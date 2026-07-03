import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam, writeAuditLog } from '../../utils/helpers.js';

export function registerAdminUserRoutes(router: Router) {
  router.get(
    '/admin/admins',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (_req, res) => {
      const admins = await prisma.user.findMany({
        where: { role: Role.ADMIN },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ admins });
    })
  );

  router.post(
    '/admin/admins',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const { name, email, password, mobile } = req.body as {
        name: string;
        email: string;
        password: string;
        mobile?: string;
      };

      if (!name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters.' });
      }

      const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
      if (existing) {
        return res.status(409).json({ message: 'Email already in use.' });
      }

      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 12);

      const admin = await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          mobile: mobile?.trim() || null,
          passwordHash,
          role: Role.ADMIN,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          isActive: true,
          createdAt: true
        }
      });

      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'admin.create',
        targetType: 'user',
        targetId: admin.id,
        summary: `Created admin account for ${admin.name}.`,
        metadata: { email: admin.email }
      });

      res.status(201).json({ admin });
    })
  );

  router.patch(
    '/admin/admins/:id/status',
    authRequired,
    allowRoles(Role.ADMIN),
    asyncRoute(async (req, res) => {
      const adminId = routeParam(req, 'id');
      const { isActive } = req.body as { isActive: boolean };

      if (adminId === req.user!.id && isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate your own admin account.' });
      }

      const admin = await prisma.user.update({
        where: { id: adminId, role: Role.ADMIN },
        data: { isActive },
        select: { id: true, name: true, email: true, isActive: true }
      });

      await writeAuditLog({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: isActive ? 'admin.activate' : 'admin.deactivate',
        targetType: 'user',
        targetId: admin.id,
        summary: `${isActive ? 'Activated' : 'Deactivated'} admin ${admin.name}.`,
        metadata: { email: admin.email }
      });

      res.json({ admin });
    })
  );
}
