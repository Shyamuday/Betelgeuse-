import { Router } from 'express';
import { z } from 'zod';
import { ExpenseCategory, ExpenseLevel } from '@prisma/client';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, requireManager, storeAuthMiddleware } from './shared.js';

export function registerStoreExpenseRoutes(router: Router) {
// GET /store/expenses — list expenses for this store
router.get(
  '/expenses',
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const category = typeof req.query['category'] === 'string' ? req.query['category'] : undefined;
    const from = typeof req.query['from'] === 'string' ? req.query['from'] : undefined;
    const to = typeof req.query['to'] === 'string' ? req.query['to'] : undefined;

    const expenses = await prisma.businessExpense.findMany({
      where: {
        level: ExpenseLevel.STORE,
        storeId,
        ...(category ? { category: category as ExpenseCategory } : {}),
        ...(from || to
          ? {
              expenseDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {})
              }
            }
          : {})
      },
      orderBy: { expenseDate: 'desc' },
      take: 200
    });
    res.json({ expenses });
  })
);

// POST /store/expenses — log a store expense
router.post(
  '/expenses',
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const { storeId, staffId } = getStoreStaff(req);
    const body = z
      .object({
        category: z.nativeEnum(ExpenseCategory),
        description: z.string().min(1),
        vendor: z.string().optional(),
        billNo: z.string().optional(),
        amountInPaise: z.number().int().positive(),
        expenseDate: z.string().min(1)
      })
      .parse(req.body);

    const expense = await prisma.businessExpense.create({
      data: {
        level: ExpenseLevel.STORE,
        storeId,
        category: body.category,
        description: body.description,
        vendor: body.vendor ?? null,
        billNo: body.billNo ?? null,
        amountInPaise: body.amountInPaise,
        expenseDate: new Date(body.expenseDate),
        recordedById: staffId
      }
    });
    res.status(201).json({ expense });
  })
);
}
