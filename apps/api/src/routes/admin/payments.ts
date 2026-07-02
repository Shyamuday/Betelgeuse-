import { Router } from 'express';
import { Role, PaymentStatus } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, queryText, queryPositiveInt } from '../../utils/helpers.js';

export function registerAdminPaymentRoutes(router: Router) {
  // ─── Payments ─────────────────────────────────────────────────────────────────

  router.get(
    '/admin/payments',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1, 1, 1000);
      const pageSize = queryPositiveInt(req, 'pageSize', 20, 1, 100);
      const status = queryText(req, 'status').toUpperCase();
      const from = queryText(req, 'from');
      const to = queryText(req, 'to');
      const exportType = queryText(req, 'export').toLowerCase();

      const where = {
        ...(status === 'PAID' || status === 'FAILED' || status === 'CREATED' ? { status: status as PaymentStatus } : {}),
        ...(from || to
          ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
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
              .map((v) => `"${String(v).replace(/"/g, '""')}"`)
              .join(',')
          );
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="payments-${Date.now()}.csv"`);
        return res.send(lines.join('\n'));
      }

      res.json({ payments, total, page, pageSize });
    })
  );
}
