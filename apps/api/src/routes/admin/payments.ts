import { Router } from 'express';
import { PaymentStatus, Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, queryText, queryPositiveInt, routeParam } from '../../utils/helpers.js';
import { getRazorpayClient } from '../../services/razorpay.js';
import {
  buildPaymentWhere,
  exportAdminPaymentsCsv,
  listAdminPayments
} from '../../services/admin-payments.js';

type RazorpayRefundEntity = {
  id: string;
  amount: number | string;
  status: string;
  payment_id: string;
  created_at?: number;
  notes?: Record<string, unknown>;
};

const refundSchema = z.object({
  amountInPaise: z.number().int().min(100).optional(),
  reason: z.string().trim().min(3).max(500),
  speed: z.enum(['normal', 'optimum']).default('normal'),
  cancelConsultation: z.boolean().optional()
});

export function registerAdminPaymentRoutes(router: Router) {
  router.get(
    '/admin/payments',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1, 1, 1000);
      const pageSize = queryPositiveInt(req, 'pageSize', 20, 1, 100);
      const exportType = queryText(req, 'export').toLowerCase();
      const where = buildPaymentWhere({
        status: queryText(req, 'status'),
        from: queryText(req, 'from'),
        to: queryText(req, 'to')
      });

      if (exportType === 'csv') {
        const csv = await exportAdminPaymentsCsv(where);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.csv"`);
        return res.send(csv);
      }

      const result = await listAdminPayments(where, page, pageSize);
      res.json({
        payments: result.payments,
        summary: result.summary,
        pagination: result.pagination,
        total: result.pagination.total,
        page: result.pagination.page,
        pageSize: result.pagination.pageSize
      });
    })
  );

  router.get(
    '/admin/payments/:paymentId/events',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const paymentId = routeParam(req, 'paymentId');
      const [events, refunds] = await Promise.all([
        prisma.paymentGatewayEvent.findMany({
          where: { paymentId },
          orderBy: { receivedAt: 'desc' },
          take: 100
        }),
        prisma.paymentRefund.findMany({
          where: { paymentId },
          orderBy: { createdAt: 'desc' },
          take: 50
        })
      ]);

      res.json({ events, refunds });
    })
  );

  router.post(
    '/admin/payments/:paymentId/refund',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const paymentId = routeParam(req, 'paymentId');
      const body = refundSchema.parse(req.body);
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { consultation: { select: { id: true, status: true, patientId: true } } }
      });

      if (!payment) return res.status(404).json({ message: 'Payment not found.' });
      if (!payment.providerPaymentId) {
        return res.status(400).json({ message: 'Gateway payment id is missing.' });
      }
      if (
        payment.status !== PaymentStatus.PAID &&
        payment.status !== PaymentStatus.PARTIALLY_REFUNDED
      ) {
        return res.status(400).json({ message: 'Only paid payments can be refunded.' });
      }

      const refundableInPaise = payment.amountInPaise - payment.refundedAmountInPaise;
      const amountInPaise = body.amountInPaise ?? refundableInPaise;
      if (amountInPaise <= 0 || amountInPaise > refundableInPaise) {
        return res.status(400).json({ message: 'Refund amount exceeds refundable balance.' });
      }

      const receipt = `refund_${payment.id}_${Date.now()}`;
      const notes = {
        paymentId: payment.id,
        consultationId: payment.consultationId,
        reason: body.reason.slice(0, 512),
        processedByUserId: req.user!.id
      };
      const razorpay = getRazorpayClient();
      const refund = (await razorpay.payments.refund(payment.providerPaymentId, {
        amount: amountInPaise,
        speed: body.speed,
        receipt,
        notes
      })) as RazorpayRefundEntity;

      const providerCreatedAt =
        typeof refund.created_at === 'number' ? new Date(refund.created_at * 1000) : undefined;
      const newRefundedTotal = payment.refundedAmountInPaise + Number(refund.amount);
      const nextStatus =
        newRefundedTotal >= payment.amountInPaise
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      const [savedRefund, updatedPayment] = await prisma.$transaction([
        prisma.paymentRefund.create({
          data: {
            paymentId: payment.id,
            providerRefundId: refund.id,
            providerPaymentId: refund.payment_id || payment.providerPaymentId,
            amountInPaise: Number(refund.amount),
            status: refund.status,
            reason: body.reason,
            notes: notes as Prisma.InputJsonObject,
            processedByUserId: req.user!.id,
            providerCreatedAt
          }
        }),
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            refundedAmountInPaise: newRefundedTotal,
            status: nextStatus,
            ...(body.cancelConsultation && nextStatus === PaymentStatus.REFUNDED
              ? { consultation: { update: { status: 'CANCELLED' } } }
              : {})
          }
        }),
        prisma.paymentGatewayEvent.create({
          data: {
            paymentId: payment.id,
            eventType: 'refund.created',
            providerOrderId: payment.providerOrderId,
            providerPaymentId: refund.payment_id || payment.providerPaymentId,
            amountInPaise: Number(refund.amount),
            currency: 'INR',
            status: refund.status,
            source: 'admin_refund',
            signatureVerified: false,
            payload: refund as unknown as Prisma.InputJsonValue
          }
        })
      ]);

      res.status(201).json({ refund: savedRefund, payment: updatedPayment });
    })
  );
}
