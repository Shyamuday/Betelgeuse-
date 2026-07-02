import { Router } from 'express';
import { z } from 'zod';
import {
  ExpenseCategory,
  ExpenseLevel,
  PaymentStatus,
  Role,
  StockMovementType
} from '@prisma/client';
import { authRequired, allowRoles } from '../auth.js';
import { prisma } from '../db.js';
import { asyncRoute, queryText, routeParam } from '../utils/helpers.js';
import {
  buildDoctorPayslip,
  buildStoreStaffPayslip,
  calcNetSalary,
  getLeaveDaysMap,
  parseMonth
} from '../services/payroll.js';

export const financeRouter = Router();

const expenseBodySchema = z.object({
  level: z.nativeEnum(ExpenseLevel),
  storeId: z.string().optional().nullable(),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1),
  vendor: z.string().optional().nullable(),
  billNo: z.string().optional().nullable(),
  amountInPaise: z.number().int().positive(),
  expenseDate: z.string().min(1)
});

function monthDateRange(from?: string, to?: string) {
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : undefined;
  return { fromDate, toDate };
}

// GET /admin/finance/summary
financeRouter.get(
  '/admin/finance/summary',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const month = queryText(req, 'month') || new Date().toISOString().slice(0, 7);
    const range = parseMonth(month);

    const [consultationAgg, medicineAgg, doctors, storeStaff, clinicExpenses, storeExpenses] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          createdAt: { gte: range.monthStart, lte: new Date(range.monthEnd.getFullYear(), range.monthEnd.getMonth(), range.monthEnd.getDate(), 23, 59, 59, 999) }
        },
        _sum: { amountInPaise: true },
        _count: true
      }),
      prisma.stockMovement.aggregate({
        where: {
          type: StockMovementType.SALE_OUT,
          createdAt: { gte: range.monthStart, lte: new Date(range.monthEnd.getFullYear(), range.monthEnd.getMonth(), range.monthEnd.getDate(), 23, 59, 59, 999) }
        },
        _sum: { amountInPaise: true },
        _count: true
      }),
      prisma.doctor.findMany({
        where: { employeeStatus: { not: 'TERMINATED' } },
        select: { id: true, salaryPerMonth: true }
      }),
      prisma.storeStaff.findMany({
        where: { employeeStatus: { not: 'TERMINATED' } },
        select: { id: true, salaryPerMonth: true }
      }),
      prisma.businessExpense.aggregate({
        where: { level: ExpenseLevel.CLINIC, expenseDate: { gte: range.monthStart, lte: range.monthEnd } },
        _sum: { amountInPaise: true }
      }),
      prisma.businessExpense.aggregate({
        where: { level: ExpenseLevel.STORE, expenseDate: { gte: range.monthStart, lte: range.monthEnd } },
        _sum: { amountInPaise: true }
      })
    ]);

    const leaveDaysMap = await getLeaveDaysMap(range.monthStart, range.monthEnd);
    const payrollCost = [...doctors, ...storeStaff].reduce((sum, emp) => {
      const gross = emp.salaryPerMonth ?? 0;
      const leaveDays = leaveDaysMap.get(emp.id) ?? 0;
      return sum + calcNetSalary(gross, leaveDays, range.daysInMonth);
    }, 0);

    const consultationRevenueInPaise = consultationAgg._sum.amountInPaise ?? 0;
    const medicineRevenueInPaise = medicineAgg._sum.amountInPaise ?? 0;
    const clinicExpensesInPaise = clinicExpenses._sum.amountInPaise ?? 0;
    const storeExpensesInPaise = storeExpenses._sum.amountInPaise ?? 0;
    const totalExpensesInPaise = clinicExpensesInPaise + storeExpensesInPaise;
    const totalRevenueInPaise = consultationRevenueInPaise + medicineRevenueInPaise;
    const netEstimateInPaise = totalRevenueInPaise - payrollCost - totalExpensesInPaise;

    res.json({
      month,
      consultationRevenueInPaise,
      medicineRevenueInPaise,
      totalRevenueInPaise,
      payrollCostInPaise: payrollCost,
      clinicExpensesInPaise,
      storeExpensesInPaise,
      totalExpensesInPaise,
      netEstimateInPaise,
      counts: {
        paidConsultations: consultationAgg._count,
        medicineSales: medicineAgg._count
      }
    });
  })
);

// GET /admin/finance/revenue/trend?months=6
financeRouter.get(
  '/admin/finance/revenue/trend',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const months = Math.min(Math.max(Number(req.query['months'] ?? 6), 1), 24);
    const rows = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const range = parseMonth(d.toISOString().slice(0, 7));
      const agg = await prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          createdAt: {
            gte: range.monthStart,
            lte: new Date(range.monthEnd.getFullYear(), range.monthEnd.getMonth(), range.monthEnd.getDate(), 23, 59, 59, 999)
          }
        },
        _sum: { amountInPaise: true },
        _count: true
      });
      rows.push({
        month: range.month,
        revenueInPaise: agg._sum.amountInPaise ?? 0,
        paidConsultations: agg._count
      });
    }

    res.json({ months, rows });
  })
);

// GET /admin/finance/revenue/by-doctor
financeRouter.get(
  '/admin/finance/revenue/by-doctor',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const month = queryText(req, 'month');
    const range = month ? parseMonth(month) : null;
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        consultation: { assignedDoctorId: { not: null } },
        ...(range
          ? {
              createdAt: {
                gte: range.monthStart,
                lte: new Date(range.monthEnd.getFullYear(), range.monthEnd.getMonth(), range.monthEnd.getDate(), 23, 59, 59, 999)
              }
            }
          : {})
      },
      include: {
        consultation: {
          select: {
            assignedDoctor: { select: { id: true, name: true, doctorProfile: { select: { specialty: true } } } }
          }
        }
      }
    });

    const map = new Map<string, { doctorId: string; doctorName: string; specialty: string; revenueInPaise: number; count: number }>();
    for (const payment of payments) {
      const doctor = payment.consultation.assignedDoctor;
      if (!doctor) continue;
      const existing = map.get(doctor.id) ?? {
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialty: doctor.doctorProfile?.specialty ?? '—',
        revenueInPaise: 0,
        count: 0
      };
      existing.revenueInPaise += payment.amountInPaise;
      existing.count += 1;
      map.set(doctor.id, existing);
    }

    res.json({ rows: [...map.values()].sort((a, b) => b.revenueInPaise - a.revenueInPaise) });
  })
);

// GET /admin/finance/revenue/by-disease
financeRouter.get(
  '/admin/finance/revenue/by-disease',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const month = queryText(req, 'month');
    const range = month ? parseMonth(month) : null;
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        ...(range
          ? {
              createdAt: {
                gte: range.monthStart,
                lte: new Date(range.monthEnd.getFullYear(), range.monthEnd.getMonth(), range.monthEnd.getDate(), 23, 59, 59, 999)
              }
            }
          : {})
      },
      include: { consultation: { select: { disease: { select: { id: true, name: true } } } } }
    });

    const map = new Map<string, { diseaseId: string; diseaseName: string; revenueInPaise: number; count: number }>();
    for (const payment of payments) {
      const disease = payment.consultation.disease;
      const existing = map.get(disease.id) ?? {
        diseaseId: disease.id,
        diseaseName: disease.name,
        revenueInPaise: 0,
        count: 0
      };
      existing.revenueInPaise += payment.amountInPaise;
      existing.count += 1;
      map.set(disease.id, existing);
    }

    res.json({ rows: [...map.values()].sort((a, b) => b.revenueInPaise - a.revenueInPaise) });
  })
);

// GET /admin/finance/medicine-revenue
financeRouter.get(
  '/admin/finance/medicine-revenue',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const from = queryText(req, 'from');
    const to = queryText(req, 'to');
    const storeId = queryText(req, 'storeId');
    const { fromDate, toDate } = monthDateRange(from, to);

    const movements = await prisma.stockMovement.findMany({
      where: {
        type: StockMovementType.SALE_OUT,
        ...(storeId ? { storeId } : {}),
        ...(fromDate || toDate
          ? {
              createdAt: {
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {})
              }
            }
          : {})
      },
      include: {
        store: { select: { id: true, name: true, code: true } },
        stock: { include: { medicine: { select: { name: true, potency: true } } } },
        staff: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    });

    const totalInPaise = movements.reduce((sum, m) => sum + (m.amountInPaise ?? 0), 0);
    res.json({ movements, totalInPaise, count: movements.length });
  })
);

// GET /admin/finance/outstanding
financeRouter.get(
  '/admin/finance/outstanding',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (_req, res) => {
    const payments = await prisma.payment.findMany({
      where: { status: { in: [PaymentStatus.CREATED, PaymentStatus.FAILED] } },
      include: {
        consultation: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            patient: { select: { id: true, name: true } },
            disease: { select: { name: true } },
            assignedDoctor: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    res.json({ payments });
  })
);

// GET /admin/finance/payslip/:type/:id?month=YYYY-MM
financeRouter.get(
  '/admin/finance/payslip/:type/:id',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const type = routeParam(req, 'type').toUpperCase();
    const id = routeParam(req, 'id');
    const month = queryText(req, 'month');

    if (type === 'DOCTOR') {
      const payslip = await buildDoctorPayslip(id, month || undefined);
      if (!payslip) return res.status(404).json({ message: 'Doctor not found.' });
      return res.json({ payslip });
    }
    if (type === 'STORE_STAFF') {
      const payslip = await buildStoreStaffPayslip(id, month || undefined);
      if (!payslip) return res.status(404).json({ message: 'Store staff not found.' });
      return res.json({ payslip });
    }
    return res.status(400).json({ message: 'Invalid payslip type. Use DOCTOR or STORE_STAFF.' });
  })
);

// GET /admin/finance/expenses
financeRouter.get(
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
financeRouter.get(
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
financeRouter.post(
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
financeRouter.put(
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
financeRouter.delete(
  '/admin/finance/expenses/:id',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const id = routeParam(req, 'id');
    await prisma.businessExpense.delete({ where: { id } });
    res.json({ ok: true });
  })
);
