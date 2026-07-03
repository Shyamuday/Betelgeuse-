import { Router } from 'express';
import { authRequired } from '../auth.js';
import { prisma } from '../db.js';
import { asyncRoute, queryPositiveInt, routeParam } from '../utils/helpers.js';
import { formatInAppNotification } from '../services/in-app-notifications.js';

export const notificationsRouter = Router();

registerNotificationInboxRoutes(notificationsRouter);

export function registerNotificationInboxRoutes(router: Router) {
  router.get(
    '/notifications/unread-count',
    authRequired,
    asyncRoute(async (req, res) => {
      const count = await prisma.inAppNotification.count({
        where: { recipientUserId: req.user!.id, readAt: null }
      });
      res.json({ count });
    })
  );

  router.get(
    '/notifications',
    authRequired,
    asyncRoute(async (req, res) => {
      const page = queryPositiveInt(req, 'page', 1);
      const pageSize = queryPositiveInt(req, 'pageSize', 20, 1, 100);
      const unreadOnly = String(req.query['unreadOnly'] ?? '').toLowerCase() === 'true';

      const where = {
        recipientUserId: req.user!.id,
        ...(unreadOnly ? { readAt: null } : {})
      };

      const total = await prisma.inAppNotification.count({ where });
      const rows = await prisma.inAppNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      res.json({
        notifications: rows.map(formatInAppNotification),
        pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
      });
    })
  );

  router.patch(
    '/notifications/:id/read',
    authRequired,
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      const updated = await prisma.inAppNotification.updateMany({
        where: { id, recipientUserId: req.user!.id, readAt: null },
        data: { readAt: new Date() }
      });
      if (!updated.count) {
        return res.status(404).json({ message: 'Notification not found.' });
      }
      res.json({ ok: true });
    })
  );

  router.post(
    '/notifications/read-all',
    authRequired,
    asyncRoute(async (req, res) => {
      const result = await prisma.inAppNotification.updateMany({
        where: { recipientUserId: req.user!.id, readAt: null },
        data: { readAt: new Date() }
      });
      res.json({ updated: result.count });
    })
  );
}
