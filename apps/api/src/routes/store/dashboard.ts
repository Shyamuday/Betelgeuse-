import { Router } from 'express';
import { STORE_API_ROUTES, STORE_EXPIRY, STORE_PAGINATION } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, storeAuthMiddleware } from './shared.js';

export function registerStoreDashboardRoutes(router: Router) {
// ─── Dashboard & Reports ──────────────────────────────────────────────────────

router.get(
  STORE_API_ROUTES.DASHBOARD,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);

    const [
      totalMedicines,
      lowStockCount,
      outOfStockCount,
      expiringIn30,
      expiringIn60,
      recentMovements,
      stockValues,
      topLowStock
    ] = await Promise.all([
      prisma.medicineStock.count({ where: { storeId } }),
      prisma.medicineStock.count({ where: { storeId, status: 'LOW_STOCK' } }),
      prisma.medicineStock.count({ where: { storeId, status: 'OUT_OF_STOCK' } }),
      prisma.stockBatch.count({
        where: {
          qty: { gt: 0 },
          stock: { storeId },
          expiryDate: { lte: new Date(Date.now() + STORE_EXPIRY.DASHBOARD_SHORT_DAYS * 24 * 60 * 60 * 1000) }
        }
      }),
      prisma.stockBatch.count({
        where: {
          qty: { gt: 0 },
          stock: { storeId },
          expiryDate: {
            gt: new Date(Date.now() + STORE_EXPIRY.DASHBOARD_SHORT_DAYS * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + STORE_EXPIRY.DASHBOARD_LONG_DAYS * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.stockMovement.findMany({
        where: { storeId },
        include: {
          stock: { include: { medicine: true } },
          staff: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.stockBatch.findMany({
        where: { stock: { storeId }, qty: { gt: 0 } },
        select: { qty: true, sellingPricePerUnit: true }
      }),
      prisma.medicineStock.findMany({
        where: { storeId, status: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } },
        include: { medicine: true },
        orderBy: { currentQty: 'asc' },
        take: 5
      })
    ]);

    const totalStockValue = stockValues.reduce(
      (sum, b) => sum + b.qty * b.sellingPricePerUnit,
      0
    );

    res.json({
      totalMedicines,
      lowStockCount: lowStockCount + outOfStockCount,
      outOfStockCount,
      expiringIn30,
      expiringIn60,
      totalStockValue,
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        medicineName: m.stock.medicine.name,
        potency: m.stock.medicine.potency,
        type: m.type,
        qty: m.qty,
        note: m.note,
        staffName: m.staff?.name,
        createdAt: m.createdAt
      })),
      topLowStock: topLowStock.map((s) => ({
        stockId: s.id,
        name: s.medicine.name,
        potency: s.medicine.potency,
        currentQty: s.currentQty,
        minStockLevel: s.medicine.minStockLevel,
        status: s.status
      }))
    });
  })
);

router.get(
  STORE_API_ROUTES.MOVEMENTS,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const page = Math.max(STORE_PAGINATION.DEFAULT_PAGE, Number(req.query['page']) || STORE_PAGINATION.DEFAULT_PAGE);
    const pageSize = Math.min(
      STORE_PAGINATION.MAX_PAGE_SIZE,
      Math.max(STORE_PAGINATION.MIN_PAGE_SIZE, Number(req.query['pageSize']) || STORE_PAGINATION.DEFAULT_PAGE_SIZE)
    );

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where: { storeId } }),
      prisma.stockMovement.findMany({
        where: { storeId },
        include: {
          stock: { include: { medicine: true } },
          staff: { select: { name: true } },
          batch: { select: { batchNumber: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    res.json({
      movements: movements.map((m) => ({
        id: m.id,
        medicineName: m.stock.medicine.name,
        potency: m.stock.medicine.potency,
        type: m.type,
        qty: m.qty,
        note: m.note,
        batchNumber: m.batch?.batchNumber,
        staffName: m.staff?.name,
        createdAt: m.createdAt
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  })
);
}
