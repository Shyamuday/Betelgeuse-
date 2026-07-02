import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { STORE_API_ROUTES, STORE_ROLES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { signStoreToken } from './shared.js';

export function registerStoreAuthRoutes(router: Router) {
// ─── Auth ────────────────────────────────────────────────────────────────────

router.post(
  STORE_API_ROUTES.AUTH_LOGIN,
  asyncRoute(async (req, res) => {
    const body = z
      .object({ staffCode: z.string().min(1), pin: z.string().min(4).max(8) })
      .parse(req.body);

    const staff = await prisma.storeStaff.findUnique({
      where: { staffCode: body.staffCode },
      include: { store: { select: { id: true, name: true } } }
    });

    if (!staff || !staff.isActive) {
      return res.status(401).json({ message: 'Invalid staff code or PIN.' });
    }

    const isValid = await bcrypt.compare(body.pin, staff.pinHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid staff code or PIN.' });
    }

    const token = signStoreToken({
      staffId: staff.id,
      storeId: staff.storeId,
      role: staff.role as typeof STORE_ROLES.MANAGER | typeof STORE_ROLES.STAFF,
      name: staff.name
    });

    res.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        staffCode: staff.staffCode,
        storeId: staff.storeId,
        storeName: staff.store.name
      }
    });
  })
);

router.post(
  STORE_API_ROUTES.AUTH_MANAGER_LOGIN,
  asyncRoute(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(req.body);

    // Manager uses the existing platform user (ADMIN role) with store staff record
    const staff = await prisma.storeStaff.findFirst({
      where: { role: STORE_ROLES.MANAGER, isActive: true, email: body.email },
      include: { store: { select: { id: true, name: true } } }
    });

    if (!staff) {
      return res.status(401).json({ message: 'No manager account found.' });
    }

    const isValid = await bcrypt.compare(body.password, staff.pinHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signStoreToken({
      staffId: staff.id,
      storeId: staff.storeId,
      role: STORE_ROLES.MANAGER,
      name: staff.name
    });

    res.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        staffCode: staff.staffCode,
        storeId: staff.storeId,
        storeName: staff.store.name
      }
    });
  })
);

router.get(
  '/auth/staff-list',
  asyncRoute(async (req, res) => {
    const storeCode = req.query['store'] as string | undefined;
    const store = storeCode
      ? await prisma.store.findUnique({ where: { code: storeCode }, select: { id: true } })
      : await prisma.store.findFirst({ where: { isActive: true }, select: { id: true } });

    if (!store) {
      return res.json({ staff: [] });
    }

    const staff = await prisma.storeStaff.findMany({
      where: { storeId: store.id, isActive: true, role: STORE_ROLES.STAFF },
      select: { id: true, name: true, staffCode: true, role: true }
    });

    res.json({ staff });
  })
);
}
