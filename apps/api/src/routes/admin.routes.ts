import type express from 'express';
import bcrypt from 'bcryptjs';
import { DoseEventStatus, PaymentStatus, Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { allowRoles, authRequired } from '../auth.js';
import { hydrateConsultationsAttachments } from '../consultation-attachments.js';
import { prisma } from '../db.js';
import { includeConsultationRelations, publicUserSelect } from '../db/prisma-includes.js';
import { asyncRoute } from '../middleware/async-route.js';
import { writeAuditLog } from '../lib/audit.js';
import { queryPositiveInt, queryText, routeParam } from '../lib/http-params.js';
import { apiPublicBaseUrl } from '../server/config.js';

export function registerAdminRoutes(app: express.Application) {
  app.get(
    '/admin/diseases/list',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      const diseases = await prisma.disease.findMany({ orderBy: { name: 'asc' } });
      res.json({ diseases });
    })
  );

  app.post(
    '/admin/diseases',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(3),
          description: z.string().min(3),
          feeInPaise: z.number().int().positive(),
          intakeQuestions: z.array(z.string().min(3)).min(1)
        })
        .parse(req.body);

      const disease = await prisma.disease.create({ data: body });
      res.status(201).json({ disease });
    })
  );

  app.put(
    '/admin/diseases/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(3),
          description: z.string().min(3),
          feeInPaise: z.number().int().positive(),
          isActive: z.boolean(),
          intakeQuestions: z.array(z.string().min(1)).min(1)
        })
        .parse(req.body);

      const disease = await prisma.disease.update({
        where: { id: routeParam(req, 'id') },
        data: body
      });
      res.json({ disease });
    })
  );

  app.get(
    '/admin/doctors',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1);
      const pageSize = queryPositiveInt(req, 'pageSize', 10);
      const query = queryText(req, 'q').trim();
      const status = queryText(req, 'status').toUpperCase();
      const sortBy = queryText(req, 'sortBy');
      const sortDirection = queryText(req, 'sortDirection').toLowerCase() === 'asc' ? 'asc' : 'desc';

      const where = {
        role: Role.DOCTOR,
        ...(status === 'ACTIVE' ? { isActive: true } : {}),
        ...(status === 'INACTIVE' ? { isActive: false } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' as const } },
                { email: { contains: query, mode: 'insensitive' as const } },
                { mobile: { contains: query, mode: 'insensitive' as const } },
                { doctorProfile: { specialty: { contains: query, mode: 'insensitive' as const } } }
              ]
            }
          : {})
      };

      const orderBy =
        sortBy === 'name'
          ? ({ name: sortDirection } as const)
          : sortBy === 'status'
            ? ({ isActive: sortDirection } as const)
            : ({ createdAt: sortDirection } as const);

      const total = await prisma.user.count({ where });
      const doctors = await prisma.user.findMany({
        where,
        select: { ...publicUserSelect, isActive: true, createdAt: true, doctorProfile: true },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      res.json({
        doctors,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
      });
    })
  );

  app.get(
    '/admin/doctors/pending',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1);
      const pageSize = queryPositiveInt(req, 'pageSize', 10);
      const query = queryText(req, 'q').trim();

      const where = {
        role: Role.DOCTOR,
        isActive: false,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' as const } },
                { email: { contains: query, mode: 'insensitive' as const } },
                { mobile: { contains: query, mode: 'insensitive' as const } },
                { doctorProfile: { specialty: { contains: query, mode: 'insensitive' as const } } }
              ]
            }
          : {})
      };

      const total = await prisma.user.count({ where });
      const pendingDoctors = await prisma.user.findMany({
        where,
        select: { ...publicUserSelect, isActive: true, createdAt: true, doctorProfile: true },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      res.json({
        pendingDoctors,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
      });
    })
  );

  app.get(
    '/admin/consumers',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1);
      const pageSize = queryPositiveInt(req, 'pageSize', 10);
      const query = queryText(req, 'q').trim().toLowerCase();
      const sortBy = queryText(req, 'sortBy');
      const sortDirection = queryText(req, 'sortDirection').toLowerCase() === 'asc' ? 'asc' : 'desc';

      const consultations = await prisma.consultation.findMany({
        select: {
          patient: { select: publicUserSelect }
        }
      });

      const grouped = new Map<string, { id: string; name: string; email: string; mobile: string; consultations: number }>();
      for (const row of consultations) {
        const patient = row.patient;
        if (!patient?.id) {
          continue;
        }

        const existing = grouped.get(patient.id);
        if (existing) {
          existing.consultations += 1;
          continue;
        }

        grouped.set(patient.id, {
          id: patient.id,
          name: patient.name || 'Unknown',
          email: patient.email || '',
          mobile: patient.mobile || '',
          consultations: 1
        });
      }

      const filtered = Array.from(grouped.values()).filter((consumer) => {
        if (!query) {
          return true;
        }

        return [consumer.name, consumer.email, consumer.mobile].join(' ').toLowerCase().includes(query);
      });

      filtered.sort((a, b) => {
        if (sortBy === 'name') {
          const compare = a.name.localeCompare(b.name);
          return sortDirection === 'asc' ? compare : -compare;
        }

        const compare = a.consultations - b.consultations;
        return sortDirection === 'asc' ? compare : -compare;
      });

      const total = filtered.length;
      const start = (page - 1) * pageSize;
      const consumers = filtered.slice(start, start + pageSize);

      res.json({
        consumers,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
      });
    })
  );

  app.get(
    '/admin/consumers/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const patientId = routeParam(req, 'id');
      const patient = await prisma.user.findFirst({
        where: { id: patientId, role: Role.PATIENT },
        select: publicUserSelect
      });

      if (!patient) {
        return res.status(404).json({ message: 'Consumer not found' });
      }

      const consultations = await prisma.consultation.findMany({
        where: { patientId },
        include: includeConsultationRelations(),
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      const [totalDoseEvents, takenDoseEvents, skippedDoseEvents, missedDoseEvents] = await Promise.all([
        prisma.medicineDoseEvent.count({ where: { patientId } }),
        prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.TAKEN } }),
        prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.SKIPPED } }),
        prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.MISSED } })
      ]);

      const adherencePercent = totalDoseEvents ? Math.round((takenDoseEvents / totalDoseEvents) * 100) : 0;
      res.json({
        consumer: patient,
        consultations: await hydrateConsultationsAttachments(consultations, apiPublicBaseUrl()),
        adherence: {
          total: totalDoseEvents,
          taken: takenDoseEvents,
          skipped: skippedDoseEvents,
          missed: missedDoseEvents,
          percent: adherencePercent
        }
      });
    })
  );

  app.post(
    '/admin/doctors/:id/approve',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const doctorId = routeParam(req, 'id');
      const doctor = await prisma.user.update({
        where: { id: doctorId },
        data: { isActive: true },
        select: { ...publicUserSelect, isActive: true, doctorProfile: true }
      });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'doctor.approve',
        targetType: 'doctor',
        targetId: doctor.id,
        summary: 'Doctor approved by admin.'
      });

      res.json({ doctor, message: 'Doctor approved successfully.' });
    })
  );

  app.post(
    '/admin/doctors/:id/reject',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const doctorId = routeParam(req, 'id');
      const doctor = await prisma.user.update({
        where: { id: doctorId },
        data: { isActive: false },
        select: { ...publicUserSelect, isActive: true, doctorProfile: true }
      });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'doctor.reject',
        targetType: 'doctor',
        targetId: doctor.id,
        summary: 'Doctor marked pending/inactive by admin.'
      });

      res.json({ doctor, message: 'Doctor marked as not approved.' });
    })
  );

  app.post(
    '/admin/doctors/:id/status',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const doctorId = routeParam(req, 'id');
      const body = z.object({ isActive: z.boolean() }).parse(req.body);
      const existing = await prisma.user.findFirst({
        where: { id: doctorId, role: Role.DOCTOR },
        select: { id: true }
      });
      if (!existing) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const doctor = await prisma.user.update({
        where: { id: doctorId },
        data: { isActive: body.isActive },
        select: { ...publicUserSelect, isActive: true, doctorProfile: true }
      });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: body.isActive ? 'doctor.activate' : 'doctor.deactivate',
        targetType: 'doctor',
        targetId: doctor.id,
        summary: body.isActive ? 'Doctor activated by admin.' : 'Doctor deactivated by admin.'
      });

      res.json({
        doctor,
        message: body.isActive ? 'Doctor activated successfully.' : 'Doctor deactivated successfully.'
      });
    })
  );

  app.post(
    '/admin/doctors',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(2),
          email: z.string().email(),
          mobile: z.string().min(8).optional(),
          password: z.string().min(8),
          specialty: z.string().min(2),
          registrationNo: z.string().optional()
        })
        .parse(req.body);

      const passwordHash = await bcrypt.hash(body.password, 10);
      const doctor = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          mobile: body.mobile,
          passwordHash,
          role: Role.DOCTOR,
          doctorProfile: {
            create: {
              specialty: body.specialty,
              registrationNo: body.registrationNo
            }
          }
        },
        select: { ...publicUserSelect, doctorProfile: true }
      });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'doctor.create',
        targetType: 'doctor',
        targetId: doctor.id,
        summary: 'Doctor account created by admin.',
        metadata: { specialty: body.specialty }
      });

      res.status(201).json({ doctor });
    })
  );

  app.put(
    '/admin/doctors/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const doctorId = routeParam(req, 'id');
      const body = z
        .object({
          name: z.string().min(2),
          email: z.string().email(),
          mobile: z.string().min(8).optional().or(z.literal('')),
          specialty: z.string().min(2),
          registrationNo: z.string().optional().or(z.literal('')),
          isAvailable: z.boolean().optional().default(true)
        })
        .parse(req.body);

      const existing = await prisma.user.findFirst({
        where: { id: doctorId, role: Role.DOCTOR },
        select: { id: true }
      });
      if (!existing) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const doctor = await prisma.user.update({
        where: { id: doctorId },
        data: {
          name: body.name,
          email: body.email,
          mobile: body.mobile || null,
          doctorProfile: {
            upsert: {
              create: {
                specialty: body.specialty,
                registrationNo: body.registrationNo || null,
                isAvailable: body.isAvailable
              },
              update: {
                specialty: body.specialty,
                registrationNo: body.registrationNo || null,
                isAvailable: body.isAvailable
              }
            }
          }
        },
        select: { ...publicUserSelect, isActive: true, doctorProfile: true }
      });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'doctor.update',
        targetType: 'doctor',
        targetId: doctor.id,
        summary: 'Doctor profile updated by admin.',
        metadata: { isAvailable: body.isAvailable, specialty: body.specialty }
      });

      res.json({ doctor, message: 'Doctor profile updated successfully.' });
    })
  );

  app.get(
    '/admin/audit-logs',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1);
      const pageSize = queryPositiveInt(req, 'pageSize', 20);
      const total = await prisma.auditLog.count();
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      res.json({
        logs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
      });
    })
  );

  app.get(
    '/admin/payments',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1);
      const pageSize = queryPositiveInt(req, 'pageSize', 20, 1, 100);
      const status = queryText(req, 'status').toUpperCase();
      const from = queryText(req, 'from');
      const to = queryText(req, 'to');
      const exportType = queryText(req, 'export').toLowerCase();

      const where: Prisma.PaymentWhereInput = {
        ...(status === 'PAID' || status === 'FAILED' || status === 'CREATED' ? { status: status as PaymentStatus } : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to) } : {})
              }
            }
          : {})
      };

      const [total, payments] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          include: {
            consultation: {
              select: {
                id: true,
                status: true,
                patient: { select: { id: true, name: true } },
                assignedDoctor: { select: { id: true, name: true } },
                disease: { select: { name: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        })
      ]);

      if (exportType === 'csv') {
        const lines = [
          'paymentId,consultationId,patientName,doctorName,disease,billingPlanCode,amountInPaise,status,providerOrderId,providerPaymentId,createdAt'
        ];
        for (const payment of payments) {
          lines.push(
            [
              payment.id,
              payment.consultationId,
              payment.consultation.patient?.name || '',
              payment.consultation.assignedDoctor?.name || '',
              payment.consultation.disease?.name || '',
              payment.billingPlanCode || '',
              String(payment.amountInPaise),
              payment.status,
              payment.providerOrderId || '',
              payment.providerPaymentId || '',
              payment.createdAt.toISOString()
            ]
              .map((value) => `"${String(value).replaceAll('"', '""')}"`)
              .join(',')
          );
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="admin-payments-page-${page}.csv"`);
        return res.send(lines.join('\n'));
      }

      const summary = payments.reduce(
        (acc, payment) => {
          acc.total += payment.amountInPaise;
          if (payment.status === PaymentStatus.PAID) acc.paid += payment.amountInPaise;
          if (payment.status === PaymentStatus.FAILED) acc.failedCount += 1;
          if (payment.status === PaymentStatus.CREATED) acc.pendingCount += 1;
          return acc;
        },
        { total: 0, paid: 0, failedCount: 0, pendingCount: 0 }
      );

      res.json({
        payments,
        summary,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize))
        }
      });
    })
  );

  app.get(
    '/admin/reports',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      const [consultations, revenue, doctors] = await Promise.all([
        prisma.consultation.groupBy({ by: ['status'], _count: true }),
        prisma.payment.aggregate({
          where: { status: PaymentStatus.PAID },
          _sum: { amountInPaise: true }
        }),
        prisma.user.count({ where: { role: Role.DOCTOR, isActive: true } })
      ]);

      res.json({
        revenueInPaise: revenue._sum.amountInPaise || 0,
        activeDoctors: doctors,
        consultations
      });
    })
  );
}
