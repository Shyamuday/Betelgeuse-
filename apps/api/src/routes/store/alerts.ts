import { Router } from 'express';
import { StockStatus } from '@prisma/client';
import { STORE_API_ROUTES, STORE_EXPIRY } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { enrichBatch, getStoreStaff, storeAuthMiddleware } from './shared.js';

export function registerStoreAlertRoutes(router: Router) {
// ─── Alerts ───────────────────────────────────────────────────────────────────

router.get(
  STORE_API_ROUTES.ALERTS_LOW_STOCK,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const stocks = await prisma.medicineStock.findMany({
      where: {
        storeId,
        status: { in: [StockStatus.LOW_STOCK, StockStatus.OUT_OF_STOCK] }
      },
      include: {
        medicine: true,
        rack: true
      },
      orderBy: { currentQty: 'asc' }
    });

    const result = stocks.map((s) => ({
      stockId: s.id,
      medicineId: s.medicine.id,
      name: s.medicine.name,
      potency: s.medicine.potency,
      manufacturer: s.medicine.manufacturer,
      currentQty: s.currentQty,
      minStockLevel: s.medicine.minStockLevel,
      status: s.status,
      shortfall: Math.max(0, s.medicine.minStockLevel - s.currentQty),
      rack: s.rack
        ? { locationString: `${s.rack.rackCode}-${s.rack.shelfCode}-${s.rack.boxCode}` }
        : null
    }));

    res.json({ medicines: result, total: result.length });
  })
);

router.get(
  STORE_API_ROUTES.ALERTS_EXPIRING,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const days = Math.min(
      STORE_EXPIRY.ALERT_MAX_DAYS,
      Math.max(1, Number(req.query['days']) || STORE_EXPIRY.ALERT_DEFAULT_DAYS)
    );
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const batches = await prisma.stockBatch.findMany({
      where: {
        expiryDate: { lte: cutoff },
        qty: { gt: 0 },
        stock: { storeId }
      },
      include: {
        stock: {
          include: {
            medicine: true,
            rack: true
          }
        }
      },
      orderBy: { expiryDate: 'asc' }
    });

    const result = batches.map((b) => {
      const enriched = enrichBatch(b as { expiryDate: Date; [key: string]: unknown });
      return {
      batchId: b.id,
      batchNumber: b.batchNumber,
      qty: b.qty,
      ...enriched,
      medicine: {
        id: b.stock.medicine.id,
        name: b.stock.medicine.name,
        potency: b.stock.medicine.potency,
        manufacturer: b.stock.medicine.manufacturer
      },
      rack: b.stock.rack
        ? { locationString: `${b.stock.rack.rackCode}-${b.stock.rack.shelfCode}-${b.stock.rack.boxCode}` }
        : null
      };
    });

    res.json({ batches: result, total: result.length });
  })
);
}
