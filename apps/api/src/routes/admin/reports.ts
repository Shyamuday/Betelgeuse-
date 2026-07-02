import { Router } from 'express';
import { Role, PaymentStatus } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';

export function registerAdminReportRoutes(router: Router) {
  // ─── Reports ──────────────────────────────────────────────────────────────────

  router.get(
    '/admin/reports',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      const [consultations, revenue, doctors] = await Promise.all([
        prisma.consultation.groupBy({ by: ['status'], _count: true }),
        prisma.payment.aggregate({ where: { status: PaymentStatus.PAID }, _sum: { amountInPaise: true } }),
        prisma.user.count({ where: { role: Role.DOCTOR, isActive: true } })
      ]);
      res.json({ revenueInPaise: revenue._sum.amountInPaise || 0, activeDoctors: doctors, consultations });
    })
  );
}
