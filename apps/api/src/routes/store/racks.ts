import { Router } from 'express';
import { z } from 'zod';
import { STORE_API_ROUTES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, requireManager, storeAuthMiddleware } from './shared.js';

export function registerStoreRackRoutes(router: Router) {
// ─── Racks ────────────────────────────────────────────────────────────────────

router.get(
  STORE_API_ROUTES.RACKS,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const racks = await prisma.storeRack.findMany({
      where: { storeId },
      include: {
        stocks: {
          include: { medicine: true }
        }
      },
      orderBy: [{ rackCode: 'asc' }, { shelfCode: 'asc' }, { boxCode: 'asc' }]
    });

    const enriched = racks.map((rack) => ({
      id: rack.id,
      rackCode: rack.rackCode,
      shelfCode: rack.shelfCode,
      boxCode: rack.boxCode,
      label: rack.label,
      potencyColor: rack.potencyColor,
      locationString: `${rack.rackCode}-${rack.shelfCode}-${rack.boxCode}`,
      medicineCount: rack.stocks.length,
      medicines: rack.stocks.map((s) => ({
        id: s.medicine.id,
        name: s.medicine.name,
        potency: s.medicine.potency,
        currentQty: s.currentQty,
        status: s.status
      }))
    }));

    res.json({ racks: enriched });
  })
);

router.post(
  '/racks',
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const body = z
      .object({
        rackCode: z.string().min(1).toUpperCase(),
        shelfCode: z.string().min(1),
        boxCode: z.string().min(1).toUpperCase(),
        label: z.string().optional(),
        potencyColor: z.string().optional()
      })
      .parse(req.body);

    const rack = await prisma.storeRack.create({
      data: { storeId, ...body }
    });

    res.status(201).json({
      rack: { ...rack, locationString: `${rack.rackCode}-${rack.shelfCode}-${rack.boxCode}` }
    });
  })
);
}
