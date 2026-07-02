import { Router } from 'express';
import { PaymentStatus, Role, StockMovementType } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, queryText, routeParam } from '../../utils/helpers.js';
import {
  buildDoctorPayslip,
  buildStoreStaffPayslip,
  calcNetSalary,
  getLeaveDaysMap,
  parseMonth
} from '../../services/payroll.js';
import { monthDateRange } from './shared.js';

export function registerFinanceRevenueRoutes(router: Router) {
// GET /admin/finance/revenue/trend?months=6
router.get(
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
router.get(
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
router.get(
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
router.get(
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

}
