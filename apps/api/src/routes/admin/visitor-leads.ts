import { Router } from 'express';
import { z } from 'zod';
import { Role, WebsiteLeadFollowUp } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import {
  asyncRoute,
  routeParam,
  queryText,
  queryPositiveInt,
  writeAuditLog
} from '../../utils/helpers.js';
import {
  FOLLOW_UP_STATUSES,
  leadInclude,
  updateLeadFollowUp
} from '../../services/website-leads.service.js';

const VIEW_ROLES = [Role.ADMIN, Role.RECEPTIONIST, Role.PATIENT_COORDINATOR] as const;
const FOLLOW_UP_ROLES = [Role.RECEPTIONIST, Role.PATIENT_COORDINATOR] as const;

export function registerAdminVisitorLeadRoutes(router: Router) {
  router.get(
    '/admin/visitor-leads/stats',
    authRequired,
    allowRoles(...VIEW_ROLES),
    asyncRoute(async (_req, res) => {
      const [total, newLeads, needsCallback, called, registered, bySource] = await Promise.all([
        prisma.websiteLead.count(),
        prisma.websiteLead.count({ where: { followUpStatus: 'NEW' } }),
        prisma.websiteLead.count({ where: { followUpStatus: 'NEEDS_CALLBACK' } }),
        prisma.websiteLead.count({ where: { followUpStatus: 'CALLED' } }),
        prisma.websiteLead.count({ where: { followUpStatus: 'REGISTERED' } }),
        prisma.websiteLead.groupBy({ by: ['source'], _count: { _all: true } })
      ]);

      res.json({
        stats: {
          total,
          newLeads,
          needsCallback,
          called,
          registered,
          bySource: Object.fromEntries(bySource.map((r) => [r.source, r._count._all]))
        }
      });
    })
  );

  router.get(
    '/admin/visitor-leads',
    authRequired,
    allowRoles(...VIEW_ROLES),
    asyncRoute(async (req, res) => {
      const status = queryText(req, 'followUpStatus').toUpperCase();
      const source = queryText(req, 'source').toUpperCase();
      const page = queryPositiveInt(req, 'page', 1);
      const pageSize = queryPositiveInt(req, 'pageSize', 30);

      const where: {
        followUpStatus?: WebsiteLeadFollowUp;
        source?: 'CHAT_BOT' | 'HOME_BOOKING' | 'PROMO_POPUP';
      } = {};

      if (status && status !== 'ALL' && FOLLOW_UP_STATUSES.includes(status as WebsiteLeadFollowUp)) {
        where.followUpStatus = status as WebsiteLeadFollowUp;
      }
      if (source && source !== 'ALL' && ['CHAT_BOT', 'HOME_BOOKING', 'PROMO_POPUP'].includes(source)) {
        where.source = source as 'CHAT_BOT' | 'HOME_BOOKING' | 'PROMO_POPUP';
      }

      const total = await prisma.websiteLead.count({ where });
      const leads = await prisma.websiteLead.findMany({
        where,
        include: leadInclude,
        orderBy: [{ followUpStatus: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      });

      res.json({
        leads,
        pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
      });
    })
  );

  router.get(
    '/admin/visitor-leads/:id',
    authRequired,
    allowRoles(...VIEW_ROLES),
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      const lead = await prisma.websiteLead.findUnique({
        where: { id },
        include: {
          ...leadInclude,
          chatSession: {
            include: {
              messages: { orderBy: { createdAt: 'asc' } },
              user: { select: { id: true, name: true, mobile: true, email: true } }
            }
          }
        }
      });
      if (!lead) return res.status(404).json({ message: 'Lead not found.' });
      res.json({ lead });
    })
  );

  router.patch(
    '/admin/visitor-leads/:id/follow-up',
    authRequired,
    allowRoles(...FOLLOW_UP_ROLES),
    asyncRoute(async (req, res) => {
      const id = routeParam(req, 'id');
      const body = z
        .object({
          followUpStatus: z.nativeEnum(WebsiteLeadFollowUp),
          operatorNote: z.string().max(1000).optional(),
          markCalled: z.boolean().optional()
        })
        .parse(req.body);

      const lead = await updateLeadFollowUp({
        leadId: id,
        followUpStatus: body.followUpStatus,
        operatorId: req.user!.id,
        operatorNote: body.operatorNote,
        markCalled: body.markCalled
      });

      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'visitor_lead.follow_up',
        targetType: 'website_lead',
        targetId: id,
        summary: `Follow-up status set to ${body.followUpStatus}.`
      });

      res.json({ lead, message: 'Follow-up updated.' });
    })
  );
}
