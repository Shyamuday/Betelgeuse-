import { Router } from 'express';
import { Role, Prisma } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, queryPositiveInt, queryText } from '../../utils/helpers.js';

export function registerAdminAuditRoutes(router: Router) {
  router.get(
    '/admin/audit-logs',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1);
      const pageSize = queryPositiveInt(req, 'pageSize', 20, 1, 100);
      const exportType = queryText(req, 'export').toLowerCase();
      const action = queryText(req, 'action').trim();
      const targetType = queryText(req, 'targetType').trim();
      const q = queryText(req, 'q').trim();

      const where: Prisma.AuditLogWhereInput = {
        ...(action ? { action } : {}),
        ...(targetType ? { targetType } : {}),
        ...(q
          ? {
              OR: [
                { action: { contains: q, mode: 'insensitive' } },
                { targetType: { contains: q, mode: 'insensitive' } },
                { targetId: { contains: q, mode: 'insensitive' } },
                { summary: { contains: q, mode: 'insensitive' } },
                { actor: { name: { contains: q, mode: 'insensitive' } } },
                { actor: { email: { contains: q, mode: 'insensitive' } } }
              ]
            }
          : {})
      };

      const total = await prisma.auditLog.count({ where });
      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: 'desc' },
        ...(exportType === 'csv' ? { take: 10000 } : { skip: (page - 1) * pageSize, take: pageSize })
      });

      const formatted = logs.map((log) => ({
        id: log.id,
        action: log.action,
        actorRole: log.actorRole,
        targetType: log.targetType,
        targetId: log.targetId,
        summary: log.summary,
        metadata: log.metadata,
        createdAt: log.createdAt,
        actor: log.actor
          ? { id: log.actor.id, name: log.actor.name, email: log.actor.email, role: log.actor.role }
          : null
      }));

      if (exportType === 'csv') {
        const header = 'createdAt,action,actorName,actorEmail,actorRole,targetType,targetId,summary';
        const rows = formatted.map((log) => {
          const cells = [
            log.createdAt.toISOString(),
            log.action,
            log.actor?.name ?? '',
            log.actor?.email ?? '',
            log.actorRole ?? log.actor?.role ?? '',
            log.targetType,
            log.targetId,
            (log.summary ?? '').replace(/"/g, '""')
          ];
          return cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
        return res.send([header, ...rows].join('\n'));
      }

      res.json({
        logs: formatted,
        pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
      });
    })
  );
}
