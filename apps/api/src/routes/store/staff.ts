import { Router } from 'express';
import { STORE_API_ROUTES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { buildPayslipHistory, buildStoreStaffPayslip } from '../../services/payroll.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, periodToDate, requireManager, storeAuthMiddleware } from './shared.js';

export function registerStoreStaffRoutes(router: Router) {
// ─── Staff Activity Tracking ──────────────────────────────────────────────────

router.get(
  STORE_API_ROUTES.STAFF_ACTIVITY,
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);

    const period = (req.query['period'] as string) || 'today';
    const since = periodToDate(period);

    const [allStaff, movements] = await Promise.all([
      prisma.storeStaff.findMany({
        where: { storeId, isActive: true },
        select: { id: true, name: true, staffCode: true, role: true }
      }),
      prisma.stockMovement.groupBy({
        by: ['staffId', 'type'],
        where: { storeId, staffId: { not: null }, createdAt: { gte: since } },
        _count: { id: true },
        _sum: { qty: true }
      })
    ]);

    const staffMap = new Map(allStaff.map((s) => [s.id, s]));

    const activityByStaff = new Map<
      string,
      {
        staffId: string;
        name: string;
        staffCode: string;
        role: string;
        totalActions: number;
        totalQtyIn: number;
        totalQtyOut: number;
        breakdown: { type: string; count: number; qty: number }[];
      }
    >();

    for (const row of movements) {
      if (!row.staffId) continue;
      const staff = staffMap.get(row.staffId);
      if (!staff) continue;

      if (!activityByStaff.has(row.staffId)) {
        activityByStaff.set(row.staffId, {
          staffId: row.staffId,
          name: staff.name,
          staffCode: staff.staffCode,
          role: staff.role,
          totalActions: 0,
          totalQtyIn: 0,
          totalQtyOut: 0,
          breakdown: []
        });
      }

      const entry = activityByStaff.get(row.staffId)!;
      const count = row._count.id;
      const qty = row._sum.qty ?? 0;
      const isInbound = ['PURCHASE_IN', 'ADJUSTMENT_IN', 'TRANSFER_IN'].includes(row.type);

      entry.totalActions += count;
      if (isInbound) entry.totalQtyIn += qty;
      else entry.totalQtyOut += qty;
      entry.breakdown.push({ type: row.type, count, qty });
    }

    // Include staff with zero activity too
    for (const s of allStaff) {
      if (!activityByStaff.has(s.id)) {
        activityByStaff.set(s.id, {
          staffId: s.id,
          name: s.name,
          staffCode: s.staffCode,
          role: s.role,
          totalActions: 0,
          totalQtyIn: 0,
          totalQtyOut: 0,
          breakdown: []
        });
      }
    }

    const result = Array.from(activityByStaff.values()).sort(
      (a, b) => b.totalActions - a.totalActions
    );

    res.json({ period, since, staff: result });
  })
);

router.get(
  STORE_API_ROUTES.STAFF_DETAIL_ACTIVITY,
  storeAuthMiddleware,
  requireManager,
  asyncRoute(async (req, res) => {
    const { storeId } = getStoreStaff(req);
    const staffId = req.params['staffId'] as string;
    const period = (req.query['period'] as string) || 'week';
    const since = periodToDate(period);

    const [staff, movements, recentMovements] = await Promise.all([
      prisma.storeStaff.findUniqueOrThrow({ where: { id: staffId } }),
      prisma.stockMovement.groupBy({
        by: ['type'],
        where: { storeId, staffId, createdAt: { gte: since } },
        _count: { id: true },
        _sum: { qty: true }
      }),
      prisma.stockMovement.findMany({
        where: { storeId, staffId },
        include: { stock: { include: { medicine: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    ]);

    res.json({
      staff: {
        id: staff.id,
        name: staff.name,
        staffCode: staff.staffCode,
        role: staff.role,
        createdAt: staff.createdAt
      },
      period,
      breakdown: movements.map((m) => ({
        type: m.type,
        count: m._count.id,
        qty: m._sum.qty ?? 0
      })),
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        type: m.type,
        qty: m.qty,
        note: m.note,
        medicineName: m.stock.medicine.name,
        potency: m.stock.medicine.potency,
        createdAt: m.createdAt
      }))
    });
  })
);

// GET /store/staff/my-payslip?month=YYYY-MM
router.get(
  '/staff/my-payslip',
  storeAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { staffId } = getStoreStaff(req);
    const month = typeof req.query['month'] === 'string' ? req.query['month'] : undefined;
    const payslip = await buildStoreStaffPayslip(staffId, month);
    if (!payslip) return res.status(404).json({ message: 'Staff record not found.' });
    const history = await buildPayslipHistory('STORE_STAFF', staffId, 3);
    res.json({ payslip, history });
  })
);
}
