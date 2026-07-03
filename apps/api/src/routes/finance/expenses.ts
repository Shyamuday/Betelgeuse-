import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, queryText, routeParam } from '../../utils/helpers.js';
import { expenseBodySchema, monthDateRange } from './shared.js';

export function registerFinanceExpenseRoutes(router: Router) {
// GET /admin/finance/expenses
router.get(
  '/admin/finance/expenses',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const level = queryText(req, 'level');
    const storeId = queryText(req, 'storeId');
    const category = queryText(req, 'category');
    const from = queryText(req, 'from');
    const to = queryText(req, 'to');
    const { fromDate, toDate } = monthDateRange(from, to);

    const expenses = await prisma.businessExpense.findMany({
      where: {
        ...(level ? { level: level as ExpenseLevel } : {}),
        ...(storeId ? { storeId } : {}),
        ...(category ? { category: category as ExpenseCategory } : {}),
        ...(fromDate || toDate
          ? {
              expenseDate: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {})
      },
      include: { store: { select: { id: true, name: true, code: true } } },
      orderBy: { expenseDate: 'desc' },
      take: 500
    });

    res.json({ expenses });
  })
);

// GET /admin/finance/expenses/summary
router.get(
  '/admin/finance/expenses/summary',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const month = queryText(req, 'month') || new Date().toISOString().slice(0, 7);
    const range = parseMonth(month);
    const expenses = await prisma.businessExpense.findMany({
      where: { expenseDate: { gte: range.monthStart, lte: range.monthEnd } },
      select: { level: true, category: true, amountInPaise: true }
    });

    const byCategory = new Map<string, number>();
    const byLevel = { CLINIC: 0, STORE: 0 };
    for (const expense of expenses) {
      byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + expense.amountInPaise);
      byLevel[expense.level] += expense.amountInPaise;
    }

    res.json({
      month,
      byLevel,
      byCategory: [...byCategory.entries()].map(([category, amountInPaise]) => ({ category, amountInPaise }))
    });
  })
);

// POST /admin/finance/expenses
router.post(
  '/admin/finance/expenses',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = expenseBodySchema.parse(req.body);
    if (body.level === ExpenseLevel.STORE && !body.storeId) {
      return res.status(400).json({ message: 'storeId is required for STORE level expenses.' });
    }
    if (body.level === ExpenseLevel.CLINIC) {
      body.storeId = null;
    }

    const expense = await prisma.businessExpense.create({
      data: {
        level: body.level,
        storeId: body.storeId ?? null,
        category: body.category,
        description: body.description,
        vendor: body.vendor ?? null,
        billNo: body.billNo ?? null,
        amountInPaise: body.amountInPaise,
        expenseDate: new Date(body.expenseDate),
        recordedById: req.user!.id
      },
      include: { store: { select: { id: true, name: true, code: true } } }
    });
    res.status(201).json({ expense });
  })
);

// PUT /admin/finance/expenses/:id
router.put(
  '/admin/finance/expenses/:id',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const id = routeParam(req, 'id');
    const body = expenseBodySchema.partial().parse(req.body);
    if (body.level === ExpenseLevel.STORE && body.storeId === null) {
      return res.status(400).json({ message: 'storeId is required for STORE level expenses.' });
    }

    const expense = await prisma.businessExpense.update({
      where: { id },
      data: {
        level: body.level,
        storeId: body.level === ExpenseLevel.CLINIC ? null : body.storeId,
        category: body.category,
        description: body.description,
        vendor: body.vendor,
        billNo: body.billNo,
        amountInPaise: body.amountInPaise,
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : undefined
      },
      include: { store: { select: { id: true, name: true, code: true } } }
    });
    res.json({ expense });
  })
);

// DELETE /admin/finance/expenses/:id
router.delete(
  '/admin/finance/expenses/:id',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const id = routeParam(req, 'id');
    await prisma.businessExpense.delete({ where: { id } });
    res.json({ ok: true });
  })
);
}
