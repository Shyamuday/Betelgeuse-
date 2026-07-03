import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam, writeAuditLog } from '../../utils/helpers.js';
import { notificationService } from '../../services/notification-service.js';
import type { NotificationChannel } from '../../notifications.js';

const templateSchema = z.object({
  code: z.string().min(2).max(40),
  name: z.string().min(2),
  title: z.string().min(1),
  body: z.string().min(1),
  channel: z.enum(['IN_APP', 'SMS', 'WHATSAPP', 'EMAIL', 'PUSH']).default('IN_APP'),
  isActive: z.boolean().optional()
});

const broadcastSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  channel: z.enum(['IN_APP', 'SMS', 'WHATSAPP', 'EMAIL', 'PUSH']).default('IN_APP'),
  audience: z.enum(['ALL_PATIENTS', 'ALL_DOCTORS', 'ROLE']),
  audienceRole: z.nativeEnum(Role).optional(),
  templateId: z.string().optional()
});

function audienceWhere(audience: string, audienceRole?: Role) {
  if (audience === 'ALL_PATIENTS') return { role: Role.PATIENT, isActive: true };
  if (audience === 'ALL_DOCTORS') return { role: Role.DOCTOR, isActive: true };
  if (audience === 'ROLE' && audienceRole) return { role: audienceRole, isActive: true };
  return null;
}

export function registerAdminNotificationRoutes(router: Router) {
  router.get(
    '/admin/notifications/templates',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      const templates = await prisma.notificationTemplate.findMany({
        orderBy: { name: 'asc' }
      });
      res.json({ templates });
    })
  );

  router.post(
    '/admin/notifications/templates',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = templateSchema.parse(req.body);
      const existing = await prisma.notificationTemplate.findUnique({
        where: { code: body.code.trim().toUpperCase() }
      });
      if (existing) {
        return res.status(409).json({ message: 'Template code already exists.' });
      }

      const template = await prisma.notificationTemplate.create({
        data: {
          code: body.code.trim().toUpperCase(),
          name: body.name.trim(),
          title: body.title.trim(),
          body: body.body.trim(),
          channel: body.channel,
          isActive: body.isActive ?? true
        }
      });

      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'NOTIFICATION_TEMPLATE_CREATED',
        targetType: 'NotificationTemplate',
        targetId: template.id,
        summary: `Created template ${template.code}`
      });

      res.status(201).json({ template });
    })
  );

  router.patch(
    '/admin/notifications/templates/:id',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      const body = templateSchema.partial().omit({ code: true }).parse(req.body);

      const template = await prisma.notificationTemplate.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.title !== undefined ? { title: body.title.trim() } : {}),
          ...(body.body !== undefined ? { body: body.body.trim() } : {}),
          ...(body.channel !== undefined ? { channel: body.channel } : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {})
        }
      });

      res.json({ template });
    })
  );

  router.get(
    '/admin/notifications/broadcasts',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      const broadcasts = await prisma.notificationBroadcast.findMany({
        include: {
          template: { select: { id: true, code: true, name: true } },
          createdBy: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      res.json({ broadcasts });
    })
  );

  router.post(
    '/admin/notifications/broadcast',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = broadcastSchema.parse(req.body);
      const where = audienceWhere(body.audience, body.audienceRole);
      if (!where) {
        return res.status(400).json({ message: 'audienceRole is required when audience is ROLE.' });
      }

      const recipients = await prisma.user.findMany({
        where,
        select: { id: true, name: true, mobile: true, email: true },
        take: 5000
      });

      if (!recipients.length) {
        return res.status(400).json({ message: 'No active recipients match this audience.' });
      }

      const channel = body.channel as NotificationChannel;
      await notificationService.sendBatch(
        recipients.map((recipient) => ({
          eventType: 'BOOKING_CONFIRMED' as const,
          channel,
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientMobile: recipient.mobile,
          recipientEmail: recipient.email,
          title: body.title.trim(),
          body: body.body.trim(),
          metadata: { broadcast: true, audience: body.audience }
        }))
      );

      const broadcast = await prisma.notificationBroadcast.create({
        data: {
          templateId: body.templateId || null,
          title: body.title.trim(),
          body: body.body.trim(),
          channel: body.channel,
          audience: body.audience,
          audienceRole: body.audience === 'ROLE' ? body.audienceRole : null,
          recipientCount: recipients.length,
          createdById: req.user?.id || null
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } }
        }
      });

      await writeAuditLog({
        actorId: req.user?.id,
        actorRole: req.user?.role,
        action: 'NOTIFICATION_BROADCAST_SENT',
        targetType: 'NotificationBroadcast',
        targetId: broadcast.id,
        summary: `Broadcast to ${recipients.length} recipients (${body.audience})`,
        metadata: { channel: body.channel, audience: body.audience }
      });

      res.status(201).json({ broadcast, recipientCount: recipients.length });
    })
  );
}
