import crypto from 'node:crypto';
import type express from 'express';
import { ConsultationStatus, PaymentStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { allowRoles, authRequired } from '../auth.js';
import { prisma } from '../db.js';
import { asyncRoute } from '../middleware/async-route.js';
import { routeParam } from '../lib/http-params.js';
import { getRazorpayClient, verifyRazorpaySignature } from '../lib/razorpay.js';
import {
  enabledNotificationChannels,
  notificationService,
  razorpayKeyId,
  razorpayWebhookSecret
} from '../server/config.js';

export function registerPaymentRoutes(app: express.Application) {
  app.post(
    '/payments/:consultationId/create-order',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const consultationId = routeParam(req, 'consultationId');
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: { payment: true }
      });
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found.' });
      }
      if (consultation.patientId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      const payment = consultation.payment;
      if (!payment) {
        return res.status(400).json({ message: 'Payment record is missing for this consultation.' });
      }
      if (payment.status === PaymentStatus.PAID) {
        return res.status(400).json({ message: 'Payment is already completed.' });
      }

      const razorpay = getRazorpayClient();
      const order = await razorpay.orders.create({
        amount: payment.amountInPaise,
        currency: 'INR',
        receipt: consultationId,
        notes: {
          consultationId,
          patientId: req.user!.id,
          billingPlanCode: payment.billingPlanCode || consultation.billingPlanCode || 'ONE_TIME'
        }
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerOrderId: order.id, status: PaymentStatus.CREATED }
      });

      res.json({
        orderId: order.id,
        amountInPaise: payment.amountInPaise,
        currency: 'INR',
        razorpayKeyId
      });
    })
  );

  app.post(
    '/payments/:consultationId/verify',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const body = z
        .object({
          razorpayOrderId: z.string().min(1),
          razorpayPaymentId: z.string().min(1),
          razorpaySignature: z.string().min(1)
        })
        .parse(req.body);
      const consultationId = routeParam(req, 'consultationId');
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          payment: true,
          patient: { select: { id: true, name: true, mobile: true, email: true } },
          disease: { select: { name: true } }
        }
      });
      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found.' });
      }
      if (consultation.patientId !== req.user!.id) {
        return res.status(403).json({ message: 'Access denied.' });
      }
      const payment = consultation.payment;
      if (!payment || payment.providerOrderId !== body.razorpayOrderId) {
        return res.status(400).json({ message: 'Payment order does not match consultation.' });
      }

      if (!verifyRazorpaySignature(body)) {
        return res.status(400).json({ message: 'Invalid Razorpay signature.' });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          providerPaymentId: body.razorpayPaymentId
        }
      });
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: ConsultationStatus.PAID }
      });

      const patient = consultation.patient;
      if (patient) {
        void notificationService.sendBatch(
          enabledNotificationChannels.map((channel) => ({
            eventType: 'BOOKING_CONFIRMED' as const,
            channel,
            recipientId: patient.id,
            recipientName: patient.name,
            recipientMobile: patient.mobile,
            recipientEmail: patient.email,
            title: 'Booking confirmed — Vitalis Care',
            body: `Your consultation for ${consultation.disease?.name || 'your concern'} has been booked and payment received. A doctor will be assigned shortly.`
          }))
        );
      }

      res.json({ ok: true });
    })
  );

  app.post(
    '/payments/razorpay-webhook',
    asyncRoute(async (req, res) => {
      if (!razorpayWebhookSecret) {
        return res.status(503).json({ message: 'Razorpay webhook secret is not configured.' });
      }

      const signature = req.header('x-razorpay-signature') || '';
      const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
      const expectedSignature = crypto.createHmac('sha256', razorpayWebhookSecret).update(rawBody).digest('hex');

      if (
        expectedSignature.length !== signature.length ||
        !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
      ) {
        return res.status(400).json({ message: 'Invalid webhook signature.' });
      }

      const event = JSON.parse(rawBody.toString()) as {
        event: string;
        payload?: {
          payment?: {
            entity?: {
              id: string;
              order_id: string;
            };
          };
        };
      };

      if (event.event !== 'payment.captured') {
        return res.json({ ok: true, ignored: true });
      }

      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity?.order_id) {
        return res.status(400).json({ message: 'Webhook payment payload is missing order id.' });
      }

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: paymentEntity.order_id },
        select: { id: true, consultationId: true }
      });
      if (!payment) {
        return res.status(404).json({ message: 'Payment record not found for Razorpay order.' });
      }
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          providerPaymentId: paymentEntity.id
        }
      });
      await prisma.consultation.update({
        where: { id: payment.consultationId },
        data: { status: ConsultationStatus.PAID }
      });

      const consultationForNotif = await prisma.consultation.findUnique({
        where: { id: payment.consultationId },
        select: {
          patient: { select: { id: true, name: true, mobile: true, email: true } },
          disease: { select: { name: true } }
        }
      });
      const webhookPatient = consultationForNotif?.patient;
      if (webhookPatient) {
        void notificationService.sendBatch(
          enabledNotificationChannels.map((channel) => ({
            eventType: 'BOOKING_CONFIRMED' as const,
            channel,
            recipientId: webhookPatient.id,
            recipientName: webhookPatient.name,
            recipientMobile: webhookPatient.mobile,
            recipientEmail: webhookPatient.email,
            title: 'Booking confirmed — Vitalis Care',
            body: `Your consultation for ${consultationForNotif?.disease?.name || 'your concern'} has been booked and payment received. A doctor will be assigned shortly.`
          }))
        );
      }

      res.json({ ok: true });
    })
  );
}
