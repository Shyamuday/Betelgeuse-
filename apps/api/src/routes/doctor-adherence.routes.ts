import type express from 'express';
import { DoseEventStatus, Role } from '@prisma/client';
import { allowRoles, authRequired } from '../auth.js';
import { prisma } from '../db.js';
import { asyncRoute } from '../middleware/async-route.js';
import { queryPositiveInt, routeParam } from '../lib/http-params.js';

export function registerDoctorAdherenceRoutes(app: express.Application) {
  app.get(
    '/doctor/patients/:id/adherence-summary',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const patientId = routeParam(req, 'id');
      if (req.user!.role === Role.DOCTOR) {
        const linkedConsultation = await prisma.consultation.findFirst({
          where: { patientId, assignedDoctorId: req.user!.id },
          select: { id: true }
        });

        if (!linkedConsultation) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const [total, taken, skipped, missed] = await Promise.all([
        prisma.medicineDoseEvent.count({ where: { patientId } }),
        prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.TAKEN } }),
        prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.SKIPPED } }),
        prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.MISSED } })
      ]);

      const adherencePercent = total ? Math.round((taken / total) * 100) : 0;
      res.json({
        patientId,
        totals: { total, taken, skipped, missed },
        adherencePercent
      });
    })
  );

  app.get(
    '/doctor/patients/:id/adherence-trend',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const patientId = routeParam(req, 'id');
      const days = queryPositiveInt(req, 'days', 7, 1, 30);
      if (req.user!.role === Role.DOCTOR) {
        const linkedConsultation = await prisma.consultation.findFirst({
          where: { patientId, assignedDoctorId: req.user!.id },
          select: { id: true }
        });

        if (!linkedConsultation) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - (days - 1));
      start.setHours(0, 0, 0, 0);

      const events = await prisma.medicineDoseEvent.findMany({
        where: {
          patientId,
          scheduledFor: { gte: start, lte: end }
        },
        select: { scheduledFor: true, status: true }
      });

      const trendMap = new Map<
        string,
        { date: string; total: number; taken: number; skipped: number; missed: number; pending: number; adherencePercent: number }
      >();
      for (let index = 0; index < days; index += 1) {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const key = date.toISOString().slice(0, 10);
        trendMap.set(key, {
          date: key,
          total: 0,
          taken: 0,
          skipped: 0,
          missed: 0,
          pending: 0,
          adherencePercent: 0
        });
      }

      for (const event of events) {
        const key = event.scheduledFor.toISOString().slice(0, 10);
        const day = trendMap.get(key);
        if (!day) {
          continue;
        }

        day.total += 1;
        if (event.status === DoseEventStatus.TAKEN) day.taken += 1;
        else if (event.status === DoseEventStatus.SKIPPED) day.skipped += 1;
        else if (event.status === DoseEventStatus.MISSED) day.missed += 1;
        else day.pending += 1;
      }

      const trend = Array.from(trendMap.values()).map((day) => ({
        ...day,
        adherencePercent: day.total ? Math.round((day.taken / day.total) * 100) : 0
      }));
      const totals = trend.reduce(
        (acc, day) => {
          acc.total += day.total;
          acc.taken += day.taken;
          acc.skipped += day.skipped;
          acc.missed += day.missed;
          acc.pending += day.pending;
          return acc;
        },
        { total: 0, taken: 0, skipped: 0, missed: 0, pending: 0 }
      );

      res.json({
        patientId,
        days,
        totals,
        adherencePercent: totals.total ? Math.round((totals.taken / totals.total) * 100) : 0,
        trend
      });
    })
  );

  app.get(
    '/doctor/patients/:id/dose-events',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const patientId = routeParam(req, 'id');
      const days = queryPositiveInt(req, 'days', 7, 1, 30);

      if (req.user!.role === Role.DOCTOR) {
        const linkedConsultation = await prisma.consultation.findFirst({
          where: { patientId, assignedDoctorId: req.user!.id },
          select: { id: true }
        });
        if (!linkedConsultation) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const since = new Date();
      since.setDate(since.getDate() - (days - 1));
      since.setHours(0, 0, 0, 0);

      const events = await prisma.medicineDoseEvent.findMany({
        where: {
          patientId,
          status: { in: [DoseEventStatus.SKIPPED, DoseEventStatus.MISSED] },
          scheduledFor: { gte: since }
        },
        select: {
          id: true,
          status: true,
          scheduledFor: true,
          skippedAt: true,
          note: true,
          prescriptionItem: { select: { medicineName: true } }
        },
        orderBy: { scheduledFor: 'desc' },
        take: 50
      });

      res.json({
        patientId,
        days,
        events: events.map((e) => ({
          id: e.id,
          status: e.status,
          scheduledFor: e.scheduledFor,
          interactedAt: e.skippedAt ?? null,
          note: e.note ?? null,
          medicineName: e.prescriptionItem.medicineName
        }))
      });
    })
  );
}
