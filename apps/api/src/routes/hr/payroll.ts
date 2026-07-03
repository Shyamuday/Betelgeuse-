import { Router } from 'express';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';

export function registerHrPayrollRoutes(router: Router) {
// ─── Payroll Summary ──────────────────────────────────────────────────────────

// GET /hr/payroll?month=YYYY-MM — monthly payroll summary
router.get(HR_API_ROUTES.PAYROLL, hrAuthMiddleware, asyncRoute(async (req, res) => {
  const { storeIds } = getAccess(req);
  const monthStr = (req.query['month'] as string) ?? new Date().toISOString().slice(0, 7);
  const [year, month] = monthStr.split('-').map(Number);

  // Doctors
  const doctorWhere = storeIds ? { clinicStoreId: { in: storeIds } } : {};
  const doctors = await prisma.doctor.findMany({
    where: { ...doctorWhere, employeeStatus: { not: 'TERMINATED' } },
    select: {
      id: true, designation: true, department: true,
      salaryPerMonth: true, employeeStatus: true,
      user: { select: { name: true } }
    }
  });

  // Store Staff
  const staffWhere = storeIds ? { storeId: { in: storeIds } } : {};
  const storeStaff = await prisma.storeStaff.findMany({
    where: { ...staffWhere, employeeStatus: { not: 'TERMINATED' } },
    select: {
      id: true, name: true, designation: true, department: true,
      salaryPerMonth: true, employeeStatus: true,
      store: { select: { name: true } }
    }
  });

  // Leave deductions: ON_LEAVE staff get 0 in that month (simple approach)
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd   = new Date(year, month, 0);

  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: 'APPROVED',
      startDate: { lte: monthEnd },
      endDate:   { gte: monthStart }
    },
    select: { doctorId: true, storeStaffId: true, startDate: true, endDate: true, totalDays: true }
  });

  const leaveDaysMap = new Map<string, number>();
  const daysInMonth = monthEnd.getDate();
  for (const l of approvedLeaves) {
    const overlapStart = l.startDate < monthStart ? monthStart : l.startDate;
    const overlapEnd   = l.endDate   > monthEnd   ? monthEnd   : l.endDate;
    const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const empId = l.doctorId ?? l.storeStaffId ?? '';
    leaveDaysMap.set(empId, (leaveDaysMap.get(empId) ?? 0) + days);
  }

  const calcNet = (salaryPaise: number | null, leaveDays: number): number => {
    if (!salaryPaise) return 0;
    const dailyRate = salaryPaise / daysInMonth;
    return Math.round(salaryPaise - dailyRate * leaveDays);
  };

  const doctorRows = doctors.map(d => ({
    id: d.id, empType: 'DOCTOR', name: d.user?.name ?? '—',
    designation: d.designation, department: d.department,
    grossPaise: d.salaryPerMonth ?? 0,
    leaveDays: leaveDaysMap.get(d.id) ?? 0,
    netPaise: calcNet(d.salaryPerMonth, leaveDaysMap.get(d.id) ?? 0),
    employeeStatus: d.employeeStatus
  }));

  const staffRows = storeStaff.map(s => ({
    id: s.id, empType: 'STORE_STAFF', name: s.name,
    designation: s.designation, department: s.department ?? s.store?.name,
    grossPaise: s.salaryPerMonth ?? 0,
    leaveDays: leaveDaysMap.get(s.id) ?? 0,
    netPaise: calcNet(s.salaryPerMonth, leaveDaysMap.get(s.id) ?? 0),
    employeeStatus: s.employeeStatus
  }));

  const rows = [...doctorRows, ...staffRows];
  const totalGross = rows.reduce((a, r) => a + r.grossPaise, 0);
  const totalNet   = rows.reduce((a, r) => a + r.netPaise, 0);
  const totalLeave = rows.reduce((a, r) => a + r.leaveDays, 0);

  res.json({ month: monthStr, rows, summary: { totalGross, totalNet, totalLeave, headcount: rows.length } });
}));
}
