import { ConsultationStatus, PaymentStatus, Role, StockMovementType } from '@prisma/client';
import { prisma } from '../db.js';
import { computeBranchPnl } from './branch-finance.js';

export type ClinicManagerContext = {
  userId: string;
  role: Role;
  storeId: string | null;
};

export class ClinicManagerScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClinicManagerScopeError';
  }
}

export async function resolveClinicManagerContext(userId: string, role: Role): Promise<ClinicManagerContext> {
  if (role === Role.ADMIN) {
    return { userId, role, storeId: null };
  }

  const profile = await prisma.clinicManagerProfile.findUnique({
    where: { userId },
    select: { storeId: true }
  });

  return { userId, role, storeId: profile?.storeId ?? null };
}

export function requireClinicStoreId(ctx: ClinicManagerContext, requestedStoreId?: string | null): string {
  if (ctx.role === Role.ADMIN) {
    if (!requestedStoreId) {
      throw new ClinicManagerScopeError('Store selection is required for admin users.');
    }
    return requestedStoreId;
  }

  if (!ctx.storeId) {
    throw new ClinicManagerScopeError('Clinic manager is not assigned to a branch.');
  }

  return ctx.storeId;
}

function dayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatShift(shift: string, start?: string | null, end?: string | null) {
  if (start && end) return `${shift} (${start}–${end})`;
  return shift;
}

export async function getClinicManagerDashboard(storeId: string) {
  const { start: todayStart, end: todayEnd } = dayBounds();
  const month = new Date().toISOString().slice(0, 7);

  const store = await prisma.store.findUniqueOrThrow({
    where: { id: storeId },
    select: { id: true, name: true, code: true, address: true }
  });

  const [
    consultationsToday,
    revenueToday,
    medicineToday,
    doctors,
    storeStaff,
    onLeaveToday,
    monthPnl
  ] = await Promise.all([
    prisma.consultation.groupBy({
      by: ['status'],
      where: { clinicStoreId: storeId, createdAt: { gte: todayStart, lte: todayEnd } },
      _count: true
    }),
    prisma.payment.aggregate({
      where: {
        status: PaymentStatus.PAID,
        createdAt: { gte: todayStart, lte: todayEnd },
        consultation: { clinicStoreId: storeId }
      },
      _sum: { amountInPaise: true },
      _count: true
    }),
    prisma.stockMovement.aggregate({
      where: {
        storeId,
        type: StockMovementType.SALE_OUT,
        createdAt: { gte: todayStart, lte: todayEnd }
      },
      _sum: { amountInPaise: true },
      _count: true
    }),
    prisma.doctor.count({
      where: {
        clinicStoreId: storeId,
        employeeStatus: { not: 'TERMINATED' },
        user: { isActive: true }
      }
    }),
    prisma.storeStaff.count({
      where: { storeId, employeeStatus: { not: 'TERMINATED' }, isActive: true }
    }),
    prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: { lte: todayEnd },
        endDate: { gte: todayStart },
        OR: [
          { doctor: { clinicStoreId: storeId } },
          { storeStaff: { storeId } }
        ]
      }
    }),
    computeBranchPnl(month)
  ]);

  const statusMap = Object.fromEntries(
    consultationsToday.map((row) => [
      row.status,
      typeof row._count === 'number' ? row._count : 0
    ])
  ) as Record<string, number>;

  const branchMonth = monthPnl.branches.find((b) => b.storeId === storeId);

  const queue = {
    paymentPending: statusMap[ConsultationStatus.PAYMENT_PENDING] ?? 0,
    awaitingDoctor: statusMap[ConsultationStatus.PAID] ?? 0,
    assigned: statusMap[ConsultationStatus.ASSIGNED] ?? 0,
    inProgress:
      (statusMap[ConsultationStatus.IN_PROGRESS] ?? 0) +
      (statusMap[ConsultationStatus.PRESCRIPTION_UPLOADED] ?? 0),
    completed: statusMap[ConsultationStatus.COMPLETED] ?? 0,
    total: consultationsToday.reduce(
      (sum, row) => sum + (typeof row._count === 'number' ? row._count : 0),
      0
    )
  };

  return {
    store,
    date: todayStart.toISOString().slice(0, 10),
    month,
    kpis: {
      consultationsToday: queue.total,
      revenueTodayInPaise: revenueToday._sum?.amountInPaise ?? 0,
      paidConsultationsToday: revenueToday._count,
      medicineSalesTodayInPaise: medicineToday._sum?.amountInPaise ?? 0,
      medicineSalesCount: medicineToday._count,
      activeDoctors: doctors,
      activeStoreStaff: storeStaff,
      onLeaveToday
    },
    queue,
    monthPnl: branchMonth ?? null
  };
}

function isWeeklyOff(weeklyOffDays: string[], date: Date): boolean {
  const full = date.toLocaleDateString('en-US', { weekday: 'long' });
  const short = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  return weeklyOffDays.some(
    (d) =>
      d.toLowerCase() === full.toLowerCase() ||
      d.toUpperCase() === short ||
      d.toUpperCase().startsWith(short.slice(0, 3))
  );
}

export async function getClinicRoster(storeId: string, dateStr?: string) {
  const date = dateStr ? new Date(dateStr) : new Date();
  const { start, end } = dayBounds(date);

  const [doctors, staff, leaves] = await Promise.all([
    prisma.doctor.findMany({
      where: {
        clinicStoreId: storeId,
        employeeStatus: { not: 'TERMINATED' },
        user: { isActive: true }
      },
      select: {
        id: true,
        designation: true,
        employeeStatus: true,
        workShift: true,
        shiftStart: true,
        shiftEnd: true,
        weeklyOffDays: true,
        user: { select: { id: true, name: true } }
      },
      orderBy: { user: { name: 'asc' } }
    }),
    prisma.storeStaff.findMany({
      where: { storeId, employeeStatus: { not: 'TERMINATED' }, isActive: true },
      select: {
        id: true,
        name: true,
        designation: true,
        employeeStatus: true,
        workShift: true,
        shiftStart: true,
        shiftEnd: true,
        weeklyOffDays: true
      },
      orderBy: { name: 'asc' }
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: end },
        endDate: { gte: start },
        OR: [
          { doctor: { clinicStoreId: storeId } },
          { storeStaff: { storeId } }
        ]
      },
      select: { doctorId: true, storeStaffId: true, type: true, startDate: true, endDate: true }
    })
  ]);

  const leaveDoctorIds = new Set(leaves.map((l) => l.doctorId).filter(Boolean) as string[]);
  const leaveStaffIds = new Set(leaves.map((l) => l.storeStaffId).filter(Boolean) as string[]);

  const doctorRows = doctors.map((doctor) => {
    const onLeave = leaveDoctorIds.has(doctor.id);
    const weeklyOff = isWeeklyOff(doctor.weeklyOffDays, date);
    return {
      id: doctor.id,
      userId: doctor.user.id,
      name: doctor.user.name,
      role: 'DOCTOR' as const,
      designation: doctor.designation,
      employeeStatus: doctor.employeeStatus,
      shift: formatShift(doctor.workShift, doctor.shiftStart, doctor.shiftEnd),
      attendance: onLeave ? 'ON_LEAVE' : weeklyOff ? 'WEEKLY_OFF' : 'EXPECTED',
      onLeave
    };
  });

  const staffRows = staff.map((member) => {
    const onLeave = leaveStaffIds.has(member.id);
    const weeklyOff = isWeeklyOff(member.weeklyOffDays, date);
    return {
      id: member.id,
      name: member.name,
      role: 'STORE_STAFF' as const,
      designation: member.designation,
      employeeStatus: member.employeeStatus,
      shift: formatShift(member.workShift, member.shiftStart, member.shiftEnd),
      attendance: onLeave ? 'ON_LEAVE' : weeklyOff ? 'WEEKLY_OFF' : 'EXPECTED',
      onLeave
    };
  });

  return {
    date: start.toISOString().slice(0, 10),
    doctors: doctorRows,
    storeStaff: staffRows,
    summary: {
      total: doctorRows.length + staffRows.length,
      onLeave: doctorRows.filter((d) => d.onLeave).length + staffRows.filter((s) => s.onLeave).length,
      expected:
        doctorRows.filter((d) => d.attendance === 'EXPECTED').length +
        staffRows.filter((s) => s.attendance === 'EXPECTED').length
    }
  };
}

export async function getClinicSchedules(storeId: string, from?: string, to?: string) {
  const fromDate = from ? new Date(from) : new Date();
  const toDate = to ? new Date(to) : new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  const doctors = await prisma.doctor.findMany({
    where: { clinicStoreId: storeId, employeeStatus: { not: 'TERMINATED' } },
    select: { id: true, user: { select: { name: true } } }
  });

  const doctorIds = doctors.map((d) => d.id);
  if (!doctorIds.length) {
    return { from: fromDate.toISOString().slice(0, 10), to: toDate.toISOString().slice(0, 10), slots: [] };
  }

  const slots = await prisma.doctorSlot.findMany({
    where: {
      doctorId: { in: doctorIds },
      date: { gte: fromDate, lte: toDate }
    },
    include: { doctor: { select: { user: { select: { name: true } } } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
  });

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    slots: slots.map((slot) => ({
      id: slot.id,
      doctorId: slot.doctorId,
      doctorName: slot.doctor.user.name,
      date: slot.date.toISOString().slice(0, 10),
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked,
      isBlocked: slot.isBlocked
    }))
  };
}
