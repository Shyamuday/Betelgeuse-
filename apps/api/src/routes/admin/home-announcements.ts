import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam, writeAuditLog } from '../../utils/helpers.js';
import { homeAnnouncementSchema } from '../../types/home-announcements.js';

export function registerAdminHomeAnnouncementRoutes(router: Router) {
  router.get(
    '/admin/home-announcements',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      const announcements = await prisma.homeAnnouncement.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
      });
      res.json({ announcements });
    })
  );

  router.post(
    '/admin/home-announcements',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = homeAnnouncementSchema.parse(req.body);
      const announcement = await prisma.homeAnnouncement.create({
        data: {
          text: body.text,
          linkLabel: body.linkLabel || null,
          linkUrl: body.linkUrl || null,
          isPublished: body.isPublished ?? true,
          sortOrder: body.sortOrder ?? 0,
          startsAt: body.startsAt ?? null,
          endsAt: body.endsAt ?? null
        }
      });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'home_announcement.create',
        targetType: 'home_announcement',
        targetId: announcement.id,
        summary: 'Home announcement created.'
      });
      res.status(201).json({ announcement });
    })
  );

  router.patch(
    '/admin/home-announcements/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = homeAnnouncementSchema.partial().parse(req.body);
      const announcement = await prisma.homeAnnouncement.update({
        where: { id: routeParam(req, 'id') },
        data: {
          ...(body.text !== undefined ? { text: body.text } : {}),
          ...(body.linkLabel !== undefined ? { linkLabel: body.linkLabel || null } : {}),
          ...(body.linkUrl !== undefined ? { linkUrl: body.linkUrl || null } : {}),
          ...(body.isPublished !== undefined ? { isPublished: body.isPublished } : {}),
          ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
          ...(body.startsAt !== undefined ? { startsAt: body.startsAt } : {}),
          ...(body.endsAt !== undefined ? { endsAt: body.endsAt } : {})
        }
      });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'home_announcement.update',
        targetType: 'home_announcement',
        targetId: announcement.id,
        summary: 'Home announcement updated.'
      });
      res.json({ announcement });
    })
  );

  router.delete(
    '/admin/home-announcements/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      await prisma.homeAnnouncement.delete({ where: { id } });
      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'home_announcement.delete',
        targetType: 'home_announcement',
        targetId: id,
        summary: 'Home announcement deleted.'
      });
      res.json({ message: 'Home announcement deleted.' });
    })
  );
}
