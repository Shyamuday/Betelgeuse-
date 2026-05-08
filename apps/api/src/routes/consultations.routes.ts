import type express from 'express';
import { ConsultationStatus, PaymentStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { allowRoles, authRequired } from '../auth.js';
import {
  attachmentUploadMiddleware,
  buildAttachmentStoragePath,
  coerceAttachmentKind,
  hydrateConsultationAttachments,
  hydrateConsultationsAttachments,
  persistConsultationAttachment,
  serializeAttachmentRecord
} from '../consultation-attachments.js';
import { prisma } from '../db.js';
import { includeConsultationRelations, publicUserSelect } from '../db/prisma-includes.js';
import { asyncRoute } from '../middleware/async-route.js';
import { routeParam } from '../lib/http-params.js';
import { enabledNotificationChannels, notificationService, apiPublicBaseUrl } from '../server/config.js';
import { ensureBillingPlans } from '../services/billing-plans.js';

export function registerConsultationRoutes(app: express.Application) {
  app.post(
    '/consultations',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const body = z
        .object({
          diseaseId: z.string().min(1),
          intakeAnswers: z.record(z.string(), z.string().min(1)),
          purchaseType: z.enum(['ONE_TIME', 'PLAN']).optional().default('ONE_TIME'),
          planCode: z.string().min(2).optional()
        })
        .parse(req.body);

      await ensureBillingPlans();
      const disease = await prisma.disease.findUniqueOrThrow({ where: { id: body.diseaseId } });
      const selectedPlan =
        body.purchaseType === 'PLAN'
          ? await prisma.billingPlan.findFirst({
              where: { code: body.planCode || '', isActive: true }
            })
          : await prisma.billingPlan.findFirst({
              where: { code: 'ONE_TIME', isActive: true }
            });
      if (!selectedPlan) {
        return res.status(400).json({ message: 'Selected billing plan is not available.' });
      }

      const amountInPaise = body.purchaseType === 'ONE_TIME' ? disease.feeInPaise : selectedPlan.priceInPaise;
      const consultation = await prisma.consultation.create({
        data: {
          patientId: req.user!.id,
          diseaseId: disease.id,
          intakeAnswers: body.intakeAnswers,
          billingPlanCode: selectedPlan.code,
          pricingSnapshot: {
            purchaseType: body.purchaseType,
            diseaseFeeInPaise: disease.feeInPaise,
            selectedPlanCode: selectedPlan.code,
            selectedPlanName: selectedPlan.name,
            selectedPlanPriceInPaise: selectedPlan.priceInPaise
          },
          payment: {
            create: {
              amountInPaise,
              billingPlanCode: selectedPlan.code,
              lineItems: {
                purchaseType: body.purchaseType,
                diseaseName: disease.name,
                diseaseFeeInPaise: disease.feeInPaise,
                planCode: selectedPlan.code,
                planName: selectedPlan.name,
                consultationsLimit: selectedPlan.consultationsLimit
              },
              status: PaymentStatus.CREATED
            }
          }
        },
        include: includeConsultationRelations()
      });

      res.status(201).json({
        consultation: await hydrateConsultationAttachments(consultation, apiPublicBaseUrl())
      });
    })
  );

  app.get(
    '/consultations',
    authRequired,
    asyncRoute(async (req, res) => {
      const where =
        req.user!.role === Role.PATIENT
          ? { patientId: req.user!.id }
          : req.user!.role === Role.DOCTOR
            ? { assignedDoctorId: req.user!.id }
            : {};

      const consultations = await prisma.consultation.findMany({
        where,
        include: includeConsultationRelations(),
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        consultations: await hydrateConsultationsAttachments(consultations, apiPublicBaseUrl())
      });
    })
  );

  app.get(
    '/consultations/:id',
    authRequired,
    asyncRoute(async (req, res) => {
      const consultation = await prisma.consultation.findUnique({
        where: { id: routeParam(req, 'id') },
        include: includeConsultationRelations()
      });

      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }

      const isOwner = consultation.patientId === req.user!.id;
      const isDoctor = consultation.assignedDoctorId === req.user!.id;
      const isAdmin = req.user!.role === Role.ADMIN;
      if (!isOwner && !isDoctor && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json({
        consultation: await hydrateConsultationAttachments(consultation, apiPublicBaseUrl())
      });
    })
  );

  app.post(
    '/consultations/:id/assign',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = z.object({ doctorId: z.string().min(1) }).parse(req.body);
      const doctor = await prisma.user.findFirstOrThrow({
        where: { id: body.doctorId, role: Role.DOCTOR, isActive: true }
      });

      const consultation = await prisma.consultation.update({
        where: { id: routeParam(req, 'id') },
        data: {
          assignedDoctorId: doctor.id,
          status: ConsultationStatus.ASSIGNED
        },
        include: {
          ...includeConsultationRelations(),
          patient: { select: { id: true, name: true, mobile: true, email: true } }
        }
      });

      const patient = (consultation as { patient?: { id: string; name: string; mobile: string | null; email: string | null } }).patient;
      if (patient) {
        void notificationService.sendBatch(
          enabledNotificationChannels.map((ch) => ({
            eventType: 'DOCTOR_ASSIGNED' as const,
            channel: ch,
            recipientId: patient.id,
            recipientName: patient.name,
            recipientMobile: patient.mobile,
            recipientEmail: patient.email,
            title: 'Doctor assigned — Vitalis Care',
            body: `Dr. ${doctor.name} has been assigned to your consultation. You can now chat with your doctor in the app.`
          }))
        );
      }

      res.json({
        consultation: await hydrateConsultationAttachments(consultation, apiPublicBaseUrl())
      });
    })
  );

  app.post(
    '/consultations/:id/messages',
    authRequired,
    asyncRoute(async (req, res) => {
      const body = z.object({ body: z.string().min(1).max(2000) }).parse(req.body);
      const consultation = await prisma.consultation.findUniqueOrThrow({ where: { id: routeParam(req, 'id') } });

      const canChat =
        req.user!.role === Role.ADMIN ||
        consultation.patientId === req.user!.id ||
        consultation.assignedDoctorId === req.user!.id;

      if (!canChat) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const message = await prisma.message.create({
        data: {
          consultationId: consultation.id,
          senderId: req.user!.id,
          body: body.body
        },
        include: { sender: { select: publicUserSelect } }
      });

      if (consultation.status === ConsultationStatus.ASSIGNED) {
        await prisma.consultation.update({
          where: { id: consultation.id },
          data: { status: ConsultationStatus.IN_PROGRESS }
        });
      }

      res.status(201).json({ message });
    })
  );

  app.post(
    '/consultations/:id/attachments',
    authRequired,
    attachmentUploadMiddleware,
    asyncRoute(async (req, res) => {
      const consultationId = routeParam(req, 'id');
      const consultation = await prisma.consultation.findUnique({ where: { id: consultationId } });

      if (!consultation) {
        return res.status(404).json({ message: 'Consultation not found' });
      }

      const canUpload =
        req.user!.role === Role.ADMIN ||
        consultation.patientId === req.user!.id ||
        consultation.assignedDoctorId === req.user!.id;

      if (!canUpload) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (
        req.user!.role === Role.DOCTOR &&
        consultation.assignedDoctorId &&
        consultation.assignedDoctorId !== req.user!.id
      ) {
        return res.status(403).json({ message: 'Only the assigned doctor can attach files to this consultation.' });
      }

      const file = 'file' in req ? (req as express.Request & { file?: Express.Multer.File }).file : undefined;
      if (!file?.buffer) {
        return res.status(400).json({ message: 'File required (form field name: file).' });
      }

      const kind = coerceAttachmentKind(req.user!.role, typeof req.body?.kind === 'string' ? req.body.kind : undefined);
      const captionRaw = typeof req.body?.caption === 'string' ? req.body.caption.trim() : '';
      const caption = captionRaw ? captionRaw.slice(0, 500) : undefined;

      const storagePath = buildAttachmentStoragePath(consultationId, file.originalname || 'upload');
      await persistConsultationAttachment(storagePath, file.buffer, file.mimetype);

      const created = await prisma.consultationAttachment.create({
        data: {
          consultationId,
          uploadedById: req.user!.id,
          kind,
          storagePath,
          fileName: file.originalname || null,
          mimeType: file.mimetype,
          caption: caption || null
        },
        include: { uploadedBy: { select: publicUserSelect } }
      });

      const attachment = await serializeAttachmentRecord(
        created as unknown as Record<string, unknown>,
        apiPublicBaseUrl()
      );
      res.status(201).json({ attachment });
    })
  );

  app.post(
    '/consultations/:id/complete',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const consultation = await prisma.consultation.findUniqueOrThrow({ where: { id: routeParam(req, 'id') } });
      if (req.user!.role === Role.DOCTOR && consultation.assignedDoctorId !== req.user!.id) {
        return res.status(403).json({ message: 'Only the assigned doctor can complete consultation' });
      }

      const updated = await prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: ConsultationStatus.COMPLETED },
        include: includeConsultationRelations()
      });

      res.json({
        consultation: await hydrateConsultationAttachments(updated, apiPublicBaseUrl())
      });
    })
  );
}
