import { Router } from 'express';
import type { Server as SocketIoServer } from 'socket.io';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { asyncRoute, queryText } from '../../utils/helpers.js';
import {
  getClinicManagerDashboard,
  getClinicRoster,
  getClinicSchedules,
  requireClinicStoreId,
  resolveClinicManagerContext
} from '../../services/clinic-manager-hub.js';
import { prisma } from '../../db.js';

export function createClinicManagerRouter(_io: SocketIoServer) {
  const router = Router();
  const roles = [Role.CLINIC_MANAGER, Role.ADMIN] as const;

  router.get(
    '/clinic-manager/me',
    authRequired,
    allowRoles(...roles),
    asyncRoute(async (req, res) => {
      const ctx = await resolveClinicManagerContext(req.user!.id, req.user!.role);
      const profile = await prisma.clinicManagerProfile.findUnique({
        where: { userId: req.user!.id },
        include: { store: { select: { id: true, name: true, code: true, address: true } } }
      });

      res.json({
        user: req.user,
        storeId: ctx.storeId,
        profile,
        store: profile?.store ?? null
      });
    })
  );

  router.get(
    '/clinic-manager/dashboard',
    authRequired,
    allowRoles(...roles),
    asyncRoute(async (req, res) => {
      const ctx = await resolveClinicManagerContext(req.user!.id, req.user!.role);
      const storeId = requireClinicStoreId(ctx, queryText(req, 'storeId') || undefined);
      const dashboard = await getClinicManagerDashboard(storeId);
      res.json(dashboard);
    })
  );

  router.get(
    '/clinic-manager/roster',
    authRequired,
    allowRoles(...roles),
    asyncRoute(async (req, res) => {
      const ctx = await resolveClinicManagerContext(req.user!.id, req.user!.role);
      const storeId = requireClinicStoreId(ctx, queryText(req, 'storeId') || undefined);
      const date = queryText(req, 'date') || undefined;
      const roster = await getClinicRoster(storeId, date);
      res.json(roster);
    })
  );

  router.get(
    '/clinic-manager/schedules',
    authRequired,
    allowRoles(...roles),
    asyncRoute(async (req, res) => {
      const ctx = await resolveClinicManagerContext(req.user!.id, req.user!.role);
      const storeId = requireClinicStoreId(ctx, queryText(req, 'storeId') || undefined);
      const from = queryText(req, 'from') || undefined;
      const to = queryText(req, 'to') || undefined;
      const schedules = await getClinicSchedules(storeId, from, to);
      res.json(schedules);
    })
  );

  return router;
}
