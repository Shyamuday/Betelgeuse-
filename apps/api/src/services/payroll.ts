import { PaymentStatus } from '@prisma/client';
import { prisma } from '../db.js';

export const DOCTOR_SHARE_PERCENT = 60;

export type MonthRange = {
  month: string;
  year: number;
  monthNum: number;
  monthStart: Date;
  monthEnd: Date;
  daysInMonth: number;
};

export function parseMonth(monthStr?: string): MonthRange {
  const month = monthStr ?? new Date().toISOString().slice(0, 7);
  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0);
  return {
    month,
    year,
    monthNum,
    monthStart,
    monthEnd,
    daysInMonth: monthEnd.getDate()
  };
}

export function calcNetSalary(salaryPaise: number | null | undefined, leaveDays: number, daysInMonth: number): number {
  if (!salaryPaise) return 0;
  const dailyRate = salaryPaise / daysInMonth;
  return Math.round(salaryPaise - dailyRate * leaveDays);
}

export async function getLeaveDaysMap(monthStart: Date, monthEnd: Date): Promise<Map<string, number>> {
  const approvedLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: 'APPROVED',
      startDate: { lte: monthEnd },
      endDate: { gte: monthStart }
    },
    select: { doctorId: true, storeStaffId: true, startDate: true, endDate: true }
  });

  const leaveDaysMap = new Map<string, number>();
  for (const leave of approvedLeaves) {
    const overlapStart = leave.startDate < monthStart ? monthStart : leave.startDate;
    const overlapEnd = leave.endDate > monthEnd ? monthEnd : leave.endDate;
    const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const empId = leave.doctorId ?? leave.storeStaffId ?? '';
    if (empId) {
      leaveDaysMap.set(empId, (leaveDaysMap.get(empId) ?? 0) + days);
    }
  }
  return leaveDaysMap;
}

export async function getDoctorConsultationEarnings(doctorUserId: string, monthStart: Date, monthEnd: Date) {
  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PAID,
      createdAt: { gte: monthStart, lte: new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate(), 23, 59, 59, 999) },
      consultation: { assignedDoctorId: doctorUserId }
    },
    select: { amountInPaise: true }
  });

  const grossInPaise = payments.reduce((sum, p) => sum + p.amountInPaise, 0);
  const consultationEarningsInPaise = Math.round((grossInPaise * DOCTOR_SHARE_PERCENT) / 100);
  return {
    doctorSharePercent: DOCTOR_SHARE_PERCENT,
    paidConsultations: payments.length,
    consultationGrossInPaise: grossInPaise,
    consultationEarningsInPaise
  };
}

export async function buildDoctorPayslip(doctorId: string, monthStr?: string) {
  const range = parseMonth(monthStr);
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  if (!doctor) return null;

  const leaveDaysMap = await getLeaveDaysMap(range.monthStart, range.monthEnd);
  const leaveDays = leaveDaysMap.get(doctor.id) ?? 0;
  const grossPaise = doctor.salaryPerMonth ?? 0;
  const netPaise = calcNetSalary(grossPaise, leaveDays, range.daysInMonth);
  const deductionPaise = grossPaise - netPaise;
  const consultation = await getDoctorConsultationEarnings(doctor.userId, range.monthStart, range.monthEnd);

  return {
    month: range.month,
    empType: 'DOCTOR' as const,
    employee: {
      id: doctor.id,
      name: doctor.user.name,
      email: doctor.user.email,
      designation: doctor.designation,
      department: doctor.department,
      employeeStatus: doctor.employeeStatus
    },
    salary: {
      grossPaise,
      leaveDays,
      deductionPaise,
      netPaise
    },
    consultation,
    totalEstimatedPayInPaise: netPaise + consultation.consultationEarningsInPaise
  };
}

export async function buildStoreStaffPayslip(staffId: string, monthStr?: string) {
  const range = parseMonth(monthStr);
  const staff = await prisma.storeStaff.findUnique({
    where: { id: staffId },
    include: { store: { select: { id: true, name: true, code: true } } }
  });
  if (!staff) return null;

  const leaveDaysMap = await getLeaveDaysMap(range.monthStart, range.monthEnd);
  const leaveDays = leaveDaysMap.get(staff.id) ?? 0;
  const grossPaise = staff.salaryPerMonth ?? 0;
  const netPaise = calcNetSalary(grossPaise, leaveDays, range.daysInMonth);
  const deductionPaise = grossPaise - netPaise;

  return {
    month: range.month,
    empType: 'STORE_STAFF' as const,
    employee: {
      id: staff.id,
      name: staff.name,
      designation: staff.designation,
      department: staff.department ?? staff.store.name,
      store: staff.store,
      employeeStatus: staff.employeeStatus
    },
    salary: {
      grossPaise,
      leaveDays,
      deductionPaise,
      netPaise
    },
    totalEstimatedPayInPaise: netPaise
  };
}

export async function buildPayslipHistory(
  type: 'DOCTOR' | 'STORE_STAFF',
  id: string,
  months = 3
) {
  const history = [];
  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toISOString().slice(0, 7);
    const slip =
      type === 'DOCTOR'
        ? await buildDoctorPayslip(id, month)
        : await buildStoreStaffPayslip(id, month);
    if (slip) {
      history.push({
        month: slip.month,
        grossPaise: slip.salary.grossPaise,
        leaveDays: slip.salary.leaveDays,
        netPaise: slip.salary.netPaise,
        totalEstimatedPayInPaise: slip.totalEstimatedPayInPaise
      });
    }
  }
  return history;
}
