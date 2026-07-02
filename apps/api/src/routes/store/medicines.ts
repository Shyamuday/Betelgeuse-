import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { StockStatus } from '@prisma/client';
import { STORE_API_ROUTES, STORE_PAGINATION } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { computeStockStatus, enrichBatch, getStoreStaff, requireManager, storeAuthMiddleware } from './shared.js';

export function registerStoreMedicineRoutes(router: Router) {
// ─── Medicines ────────────────────────────────────────────────────────────────

router.get(
  STORE_API_ROUTES.MEDICINES,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const q = (req.query['q'] as string || '').trim().toLowerCase();
    const potency = (req.query['potency'] as string || '').trim();
    const statusFilter = req.query['status'] as string | undefined;
    const page = Math.max(STORE_PAGINATION.DEFAULT_PAGE, Number(req.query['page']) || STORE_PAGINATION.DEFAULT_PAGE);
    const pageSize = Math.min(
      STORE_PAGINATION.MAX_PAGE_SIZE,
      Math.max(STORE_PAGINATION.MIN_PAGE_SIZE, Number(req.query['pageSize']) || STORE_PAGINATION.DEFAULT_PAGE_SIZE)
    );

    const where = {
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { shortName: { contains: q, mode: 'insensitive' as const } },
              { alternateName: { contains: q, mode: 'insensitive' as const } },
              { manufacturer: { contains: q, mode: 'insensitive' as const } },
              { category: { contains: q, mode: 'insensitive' as const } },
              { barcode: { contains: q, mode: 'insensitive' as const } }
            ]
          }
        : {}),
      ...(potency ? { potency: { contains: potency, mode: 'insensitive' as const } } : {})
    };

    const total = await prisma.storeMedicine.count({ where });
    const medicines = await prisma.storeMedicine.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        stocks: {
          where: { storeId },
          include: {
            rack: true,
            batches: { orderBy: { expiryDate: 'asc' }, take: 1 }
          }
        }
      }
    });

    const result = medicines.map((m) => {
      const stock = m.stocks[0] || null;
      const stockStatus = stock
        ? statusFilter && stock.status !== statusFilter ? null : stock.status
        : 'OUT_OF_STOCK';

      if (statusFilter && stock?.status !== statusFilter) return null;

      return {
        id: m.id,
        name: m.name,
        shortName: m.shortName,
        potency: m.potency,
        manufacturer: m.manufacturer,
        category: m.category,
        minStockLevel: m.minStockLevel,
        qrCode: m.qrCode,
        barcode: m.barcode,
        currentQty: stock?.currentQty ?? 0,
        status: stockStatus ?? 'OUT_OF_STOCK',
        stockId: stock?.id ?? null,
        rack: stock?.rack
          ? {
              id: stock.rack.id,
              rackCode: stock.rack.rackCode,
              shelfCode: stock.rack.shelfCode,
              boxCode: stock.rack.boxCode,
              label: stock.rack.label,
              potencyColor: stock.rack.potencyColor,
              locationString: `${stock.rack.rackCode}-${stock.rack.shelfCode}-${stock.rack.boxCode}`
            }
          : null,
        nearestExpiry: stock?.batches[0]
          ? enrichBatch(stock.batches[0] as { expiryDate: Date; [key: string]: unknown })
          : null
      };
    }).filter(Boolean);

    res.json({
      medicines: result,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
    });
  })
);

router.get(
  STORE_API_ROUTES.MEDICINE_BY_ID,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const medicineId = req.params['id'] as string;
    const medicine = await prisma.storeMedicine.findUnique({
      where: { id: medicineId },
      include: {
        stocks: {
          where: { storeId },
          include: {
            rack: true,
            batches: { orderBy: { expiryDate: 'asc' } }
          }
        }
      }
    });

    if (!medicine) return res.status(404).json({ message: 'Medicine not found.' });

    const stock = medicine.stocks[0] || null;
    res.json({
      medicine: {
        ...medicine,
        stocks: undefined,
        currentQty: stock?.currentQty ?? 0,
        status: stock?.status ?? 'OUT_OF_STOCK',
        stockId: stock?.id ?? null,
        rack: stock?.rack
          ? {
              ...stock.rack,
              locationString: `${stock.rack.rackCode}-${stock.rack.shelfCode}-${stock.rack.boxCode}`
            }
          : null,
        batches: (stock?.batches ?? []).map((b: { expiryDate: Date; [key: string]: unknown }) =>
          enrichBatch(b)
        )
      }
    });
  })
);

router.post(
  '/medicines',
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2),
        shortName: z.string().optional(),
        alternateName: z.string().optional(),
        manufacturer: z.string().optional(),
        potency: z.string().min(1),
        category: z.string().optional(),
        description: z.string().optional(),
        minStockLevel: z.number().int().min(0).default(10),
        barcode: z.string().optional()
      })
      .parse(req.body);

    const qrCode = `VTLS-MED-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const medicine = await prisma.storeMedicine.create({
      data: { ...body, qrCode }
    });

    const { storeId } = getStoreStaff(req);
    await prisma.medicineStock.create({
      data: {
        medicineId: medicine.id,
        storeId,
        currentQty: 0,
        status: StockStatus.OUT_OF_STOCK
      }
    });

    res.status(201).json({ medicine });
  })
);

router.put(
  '/medicines/:id',
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2),
        shortName: z.string().optional(),
        alternateName: z.string().optional(),
        manufacturer: z.string().optional(),
        potency: z.string().min(1),
        category: z.string().optional(),
        description: z.string().optional(),
        minStockLevel: z.number().int().min(0),
        barcode: z.string().optional(),
        isActive: z.boolean().optional()
      })
      .parse(req.body);

    const medicine = await prisma.storeMedicine.update({
      where: { id: req.params['id'] as string },
      data: body
    });

    res.json({ medicine });
  })
);
}
