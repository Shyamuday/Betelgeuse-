import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { asyncRoute, queryText } from '../../utils/helpers.js';
import { getFinanceMonthSummary } from '../../services/finance-summary.js';

export function registerFinanceSummaryRoutes(router: Router) {
router.get(
  '/admin/finance/summary',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const month = queryText(req, 'month') || new Date().toISOString().slice(0, 7);
    res.json(await getFinanceMonthSummary(month));
  })
);

}
