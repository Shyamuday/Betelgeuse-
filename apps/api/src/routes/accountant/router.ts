import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { asyncRoute, queryText } from '../../utils/helpers.js';
import { buildAccountantExportBundle, computeBranchPnl } from '../../services/branch-finance.js';
import { getFinanceMonthSummary } from '../../services/finance-summary.js';
import { prisma } from '../../db.js';

const accountantRoles = [Role.ACCOUNTANT, Role.ADMIN] as const;

export function createAccountantRouter() {
  const router = Router();

  router.get(
    '/accountant/me',
    authRequired,
    allowRoles(...accountantRoles),
    asyncRoute(async (req, res) => {
      const profile = await prisma.accountantProfile.findUnique({
        where: { userId: req.user!.id }
      });
      res.json({ user: req.user, profile });
    })
  );

  router.get(
    '/accountant/summary',
    authRequired,
    allowRoles(...accountantRoles),
    asyncRoute(async (req, res) => {
      const month = queryText(req, 'month') || new Date().toISOString().slice(0, 7);
      res.json(await getFinanceMonthSummary(month));
    })
  );

  router.get(
    '/accountant/branches',
    authRequired,
    allowRoles(...accountantRoles),
    asyncRoute(async (req, res) => {
      const month = queryText(req, 'month') || new Date().toISOString().slice(0, 7);
      res.json(await computeBranchPnl(month));
    })
  );

  router.get(
    '/accountant/export-bundle',
    authRequired,
    allowRoles(...accountantRoles),
    asyncRoute(async (req, res) => {
      const month = queryText(req, 'month') || new Date().toISOString().slice(0, 7);
      const storeId = queryText(req, 'storeId') || undefined;
      const csv = await buildAccountantExportBundle(month, storeId);
      const suffix = storeId ? `-${storeId}` : '';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="accountant-bundle-${month}${suffix}.csv"`
      );
      res.send(csv);
    })
  );

  return router;
}
