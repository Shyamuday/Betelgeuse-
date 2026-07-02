import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { asyncRoute, queryText, queryPositiveInt } from '../../utils/helpers.js';
import {
  buildPaymentWhere,
  exportAdminPaymentsCsv,
  listAdminPayments
} from '../../services/admin-payments.js';

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
}
