import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, queryPositiveInt } from '../../utils/helpers.js';

export function registerAdminAuditRoutes(router: Router) {
  // ─── Audit logs ───────────────────────────────────────────────────────────────

  router.get(
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
      res.json({ logs, pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) } });
    })
  );
}
