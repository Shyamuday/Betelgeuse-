import { Router } from 'express';
import { z } from 'zod';
import { StockMovementType, StockStatus } from '@prisma/client';
import { STORE_API_ROUTES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { computeStockStatus, getStoreStaff, requireManager, storeAuthMiddleware } from './shared.js';

export function registerStoreStockRoutes(router: Router) {
// ─── Stock Operations ─────────────────────────────────────────────────────────

router.post(
  STORE_API_ROUTES.STOCK_ADD,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId, staffId } = getStoreStaff(req);
    const body = z
      .object({
        medicineId: z.string().min(1),
        qty: z.number().int().min(1),
        batchNumber: z.string().min(1),
        expiryDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
        purchasePricePerUnit: z.number().int().min(0),
        sellingPricePerUnit: z.number().int().min(0),
        manufacturer: z.string().optional(),
        rackId: z.string().optional(),
        note: z.string().optional()
      })
      .parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      let stock = await tx.medicineStock.findUnique({
        where: { medicineId_storeId: { medicineId: body.medicineId, storeId } }
      });

      if (!stock) {
        const medicine = await tx.storeMedicine.findUniqueOrThrow({ where: { id: body.medicineId } });
        stock = await tx.medicineStock.create({
          data: {
            medicineId: body.medicineId,
            storeId,
            currentQty: 0,
            rackId: body.rackId || null,
            status: StockStatus.OUT_OF_STOCK
          }
        });
      } else if (body.rackId && stock.rackId !== body.rackId) {
        stock = await tx.medicineStock.update({
          where: { id: stock.id },
          data: { rackId: body.rackId }
        });
      }

      const batch = await tx.stockBatch.create({
        data: {
          stockId: stock.id,
          batchNumber: body.batchNumber,
          manufacturer: body.manufacturer,
          expiryDate: new Date(body.expiryDate),
          purchasePricePerUnit: body.purchasePricePerUnit,
          sellingPricePerUnit: body.sellingPricePerUnit,
          qty: body.qty
        }
      });

      const newQty = stock.currentQty + body.qty;
      const medicine = await tx.storeMedicine.findUnique({ where: { id: body.medicineId } });
      const newStatus = computeStockStatus(newQty, medicine?.minStockLevel ?? 10);

      const updatedStock = await tx.medicineStock.update({
        where: { id: stock.id },
        data: { currentQty: newQty, status: newStatus }
      });

      const movement = await tx.stockMovement.create({
        data: {
          stockId: stock.id,
          storeId,
          batchId: batch.id,
          staffId,
          type: StockMovementType.PURCHASE_IN,
          qty: body.qty,
          note: body.note
        }
      });

      return { stock: updatedStock, batch, movement };
    });

    res.status(201).json(result);
  })
);

router.post(
  STORE_API_ROUTES.STOCK_REMOVE,
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeId, staffId } = getStoreStaff(req);
    const body = z
      .object({
        stockId: z.string().min(1),
        qty: z.number().int().min(1),
        type: z.enum(['SALE_OUT', 'ADJUSTMENT_OUT', 'EXPIRED_REMOVAL']).default('SALE_OUT'),
        batchId: z.string().optional(),
        note: z.string().optional(),
        prescriptionId: z.string().optional(),
        saleAmountInPaise: z.number().int().min(0).optional()
      })
      .parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.medicineStock.findUniqueOrThrow({
        where: { id: body.stockId },
        include: { medicine: true }
      });

      if (stock.currentQty < body.qty) {
        throw new Error(`Insufficient stock. Available: ${stock.currentQty}`);
      }

      const newQty = stock.currentQty - body.qty;
      const newStatus = computeStockStatus(newQty, stock.medicine.minStockLevel);

      const updatedStock = await tx.medicineStock.update({
        where: { id: stock.id },
        data: { currentQty: newQty, status: newStatus }
      });

      if (body.batchId) {
        const batch = await tx.stockBatch.findUnique({ where: { id: body.batchId } });
        if (batch && batch.qty >= body.qty) {
          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { qty: batch.qty - body.qty }
          });
        }
      }

      const movement = await tx.stockMovement.create({
        data: {
          stockId: stock.id,
          storeId,
          batchId: body.batchId || null,
          staffId,
          type: body.type as StockMovementType,
          qty: body.qty,
          prescriptionId: body.prescriptionId ?? null,
          amountInPaise: body.type === 'SALE_OUT' ? (body.saleAmountInPaise ?? null) : null,
          note: body.note
        }
      });

      return { stock: updatedStock, movement };
    });

    res.status(201).json(result);
  })
);

router.post(
  '/stock/adjust',
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const { storeId, staffId } = getStoreStaff(req);
    const body = z
      .object({
        stockId: z.string().min(1),
        newQty: z.number().int().min(0),
        note: z.string().min(1)
      })
      .parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.medicineStock.findUniqueOrThrow({
        where: { id: body.stockId },
        include: { medicine: true }
      });

      const diff = body.newQty - stock.currentQty;
      const movementType =
        diff > 0 ? StockMovementType.ADJUSTMENT_IN : StockMovementType.ADJUSTMENT_OUT;

      const newStatus = computeStockStatus(body.newQty, stock.medicine.minStockLevel);
      const updatedStock = await tx.medicineStock.update({
        where: { id: stock.id },
        data: { currentQty: body.newQty, status: newStatus }
      });

      if (diff !== 0) {
        await tx.stockMovement.create({
          data: {
            stockId: stock.id,
            storeId,
            staffId,
            type: movementType,
            qty: Math.abs(diff),
            note: body.note
          }
        });
      }

      return { stock: updatedStock };
    });

    res.json(result);
  })
);
}
