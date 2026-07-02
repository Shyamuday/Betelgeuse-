import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { STORE_ROLES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, requireManager, signStoreToken, storeAuthMiddleware } from './shared.js';

export function registerStoreSetupRoutes(router: Router) {
// ─── Store Setup (Manager only) ───────────────────────────────────────────────

router.get(
  '/info',
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const store = await prisma.store.findUniqueOrThrow({
      where: { id: storeId },
      include: {
        staff: { select: { id: true, name: true, staffCode: true, role: true, isActive: true } },
        _count: { select: { racks: true, stocks: true } }
      }
    });

    res.json({ store });
  })
);

router.post(
  '/staff',
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const body = z
      .object({
        name: z.string().min(2),
        staffCode: z.string().min(2).toUpperCase(),
        pin: z.string().min(4).max(8),
        role: z.enum([STORE_ROLES.MANAGER, STORE_ROLES.STAFF]).default(STORE_ROLES.STAFF)
      })
      .parse(req.body);

    const pinHash = await bcrypt.hash(body.pin, 10);
    const staff = await prisma.storeStaff.create({
      data: {
        name: body.name,
        staffCode: body.staffCode,
        pinHash,
        role: body.role,
        storeId
      }
    });

    res.status(201).json({
      staff: { id: staff.id, name: staff.name, staffCode: staff.staffCode, role: staff.role }
    });
  })
);

// ─── First-Run Setup (no auth required) ──────────────────────────────────────

router.post(
  '/setup',
  asyncRoute(async (req, res) => {
    const existingStore = await prisma.store.findFirst();
    if (existingStore) {
      return res.status(409).json({ message: 'Store already set up.' });
    }

    const body = z
      .object({
        storeName: z.string().min(2),
        storeCode: z.string().min(2).toUpperCase(),
        storeAddress: z.string().optional(),
        managerName: z.string().min(2),
        managerPin: z.string().min(4).max(8)
      })
      .parse(req.body);

    const pinHash = await bcrypt.hash(body.managerPin, 10);

    const store = await prisma.store.create({
      data: {
        name: body.storeName,
        code: body.storeCode,
        address: body.storeAddress,
        staff: {
          create: {
            name: body.managerName,
            staffCode: `${body.storeCode}-MGR`,
            pinHash,
            role: STORE_ROLES.MANAGER
          }
        }
      },
      include: { staff: true }
    });

    const manager = store.staff[0];
    const token = signStoreToken({
      staffId: manager.id,
      storeId: store.id,
      role: STORE_ROLES.MANAGER,
      name: manager.name
    });

    res.status(201).json({
      token,
      store: { id: store.id, name: store.name, code: store.code },
      staff: { id: manager.id, name: manager.name, staffCode: manager.staffCode, role: manager.role }
    });
  })
);
}
