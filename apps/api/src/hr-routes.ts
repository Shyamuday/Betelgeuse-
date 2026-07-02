import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, WorkShift, EmployeeStatus } from '@prisma/client';

const hrRouter = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function asyncRoute(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);
}

interface AdminPayload { userId: string; role: string }

function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AdminPayload;
    if (payload.role !== 'ADMIN') { res.status(403).json({ error: 'Admin only' }); return; }
    (req as Request & { adminPayload: AdminPayload }).adminPayload = payload;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// Store-auth middleware (re-declared here to keep hr-routes independent)
interface StorePayload { staffId: string; storeId: string; role: string }

function storeManagerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as StorePayload;
    if (payload.role !== 'MANAGER') { res.status(403).json({ error: 'Manager only' }); return; }
    (req as Request & { storePayload: StorePayload }).storePayload = payload;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function generateLetterNumber(prefix: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${y}${m}-${rand}`;
}

function formatSalary(paise: number | null | undefined): string {
  if (!paise) return 'As discussed';
  return `₹${(paise / 100).toLocaleString('en-IN')} per month`;
}

function formatShift(shift: WorkShift, start?: string | null, end?: string | null): string {
  const shiftNames: Record<WorkShift, string> = {
    MORNING: 'Morning Shift', AFTERNOON: 'Afternoon Shift',
    EVENING: 'Evening Shift', NIGHT: 'Night Shift',
    FULL_DAY: 'Full Day', CUSTOM: 'Custom Hours'
  };
  const label = shiftNames[shift] ?? shift;
  if (start && end) return `${label} (${start} – ${end})`;
  return label;
}

// ─── Store Staff HR ───────────────────────────────────────────────────────────

// GET /hr/store/staff  — list all staff with HR info (manager)
hrRouter.get(
  '/store/staff',
  storeManagerMiddleware,
  asyncRoute(async (req, res) => {
    const storeId = (req as Request & { storePayload: StorePayload }).storePayload.storeId;
    const staff = await prisma.storeStaff.findMany({
      where: { storeId },
      include: { joiningLetter: true },
      orderBy: { joiningDate: 'asc' }
    });
    res.json({ staff });
  })
);

// GET /hr/store/staff/:id  — get one staff HR profile
hrRouter.get(
  '/store/staff/:id',
  storeManagerMiddleware,
  asyncRoute(async (req, res) => {
    const id = req.params['id'] as string;
    const staff = await prisma.storeStaff.findUniqueOrThrow({
      where: { id },
      include: { joiningLetter: true, store: true }
    });
    res.json({ staff });
  })
);

// PUT /hr/store/staff/:id  — update HR profile
hrRouter.put(
  '/store/staff/:id',
  storeManagerMiddleware,
  asyncRoute(async (req, res) => {
    const id = req.params['id'] as string;
    const {
      designation, department, phone, email, address,
      joiningDate, probationEndDate, salaryPerMonth,
      workShift, shiftStart, shiftEnd, weeklyOffDays,
      emergencyContact, emergencyPhone, employeeStatus, employeeId
    } = req.body as {
      designation?: string; department?: string; phone?: string; email?: string;
      address?: string; joiningDate?: string; probationEndDate?: string;
      salaryPerMonth?: number; workShift?: WorkShift; shiftStart?: string;
      shiftEnd?: string; weeklyOffDays?: string[]; emergencyContact?: string;
      emergencyPhone?: string; employeeStatus?: EmployeeStatus; employeeId?: string;
    };

    const updated = await prisma.storeStaff.update({
      where: { id },
      data: {
        designation, department, phone, email, address,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        probationEndDate: probationEndDate ? new Date(probationEndDate) : undefined,
        salaryPerMonth, workShift, shiftStart, shiftEnd,
        weeklyOffDays: weeklyOffDays ?? [],
        emergencyContact, emergencyPhone, employeeStatus, employeeId
      }
    });
    res.json({ staff: updated });
  })
);

// POST /hr/store/staff/:id/letter  — generate / regenerate joining letter
hrRouter.post(
  '/store/staff/:id/letter',
  storeManagerMiddleware,
  asyncRoute(async (req, res) => {
    const id = req.params['id'] as string;
    const storeId = (req as Request & { storePayload: StorePayload }).storePayload.storeId;

    const [staff, store] = await Promise.all([
      prisma.storeStaff.findUniqueOrThrow({ where: { id } }),
      prisma.store.findUniqueOrThrow({ where: { id: storeId } })
    ]);

    const letterNumber = generateLetterNumber('JL-STORE');
    const issuedDate = new Date();

    const content = {
      letterNumber,
      issuedDate: issuedDate.toISOString(),
      storeName: store.name,
      storeAddress: store.address ?? '',
      storePhone: store.phone ?? '',
      employeeName: staff.name,
      employeeCode: staff.employeeId ?? staff.staffCode,
      designation: staff.designation ?? staff.role,
      department: staff.department ?? 'Store Operations',
      joiningDate: staff.joiningDate ? staff.joiningDate.toISOString() : issuedDate.toISOString(),
      probationEndDate: staff.probationEndDate?.toISOString() ?? null,
      salary: formatSalary(staff.salaryPerMonth),
      shift: formatShift(staff.workShift, staff.shiftStart, staff.shiftEnd),
      weeklyOff: (staff.weeklyOffDays ?? []).join(', ') || 'Sunday',
      phone: staff.phone ?? '',
      address: staff.address ?? '',
    };

    const letter = await prisma.joiningLetter.upsert({
      where: { staffId: id },
      create: { letterNumber, issuedDate, content, staffId: id },
      update: { letterNumber, issuedDate, content }
    });

    res.json({ letter });
  })
);

// GET /hr/store/staff/:id/letter  — fetch joining letter
hrRouter.get(
  '/store/staff/:id/letter',
  storeManagerMiddleware,
  asyncRoute(async (req, res) => {
    const id = req.params['id'] as string;
    const letter = await prisma.joiningLetter.findUnique({ where: { staffId: id } });
    if (!letter) { res.status(404).json({ error: 'Letter not yet generated' }); return; }
    res.json({ letter });
  })
);

// ─── Doctor HR ────────────────────────────────────────────────────────────────

// GET /hr/doctors  — list all doctors with HR info (admin)
hrRouter.get(
  '/doctors',
  adminAuthMiddleware,
  asyncRoute(async (_req, res) => {
    const doctors = await prisma.doctor.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, mobile: true } },
        joiningLetter: true
      },
      orderBy: { joiningDate: 'asc' }
    });
    res.json({ doctors });
  })
);

// GET /hr/doctors/:id
hrRouter.get(
  '/doctors/:id',
  adminAuthMiddleware,
  asyncRoute(async (req, res) => {
    const id = req.params['id'] as string;
    const doctor = await prisma.doctor.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, mobile: true } },
        joiningLetter: true
      }
    });
    res.json({ doctor });
  })
);

// PUT /hr/doctors/:id
hrRouter.put(
  '/doctors/:id',
  adminAuthMiddleware,
  asyncRoute(async (req, res) => {
    const id = req.params['id'] as string;
    const {
      designation, department, phone, address,
      joiningDate, probationEndDate, salaryPerMonth, consultationFee,
      workShift, shiftStart, shiftEnd, weeklyOffDays,
      emergencyContact, emergencyPhone, employeeStatus, employeeId
    } = req.body as {
      designation?: string; department?: string; phone?: string; address?: string;
      joiningDate?: string; probationEndDate?: string; salaryPerMonth?: number;
      consultationFee?: number; workShift?: WorkShift; shiftStart?: string;
      shiftEnd?: string; weeklyOffDays?: string[]; emergencyContact?: string;
      emergencyPhone?: string; employeeStatus?: EmployeeStatus; employeeId?: string;
    };

    const updated = await prisma.doctor.update({
      where: { id },
      data: {
        designation, department, phone, address,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        probationEndDate: probationEndDate ? new Date(probationEndDate) : undefined,
        salaryPerMonth, consultationFee, workShift, shiftStart, shiftEnd,
        weeklyOffDays: weeklyOffDays ?? [],
        emergencyContact, emergencyPhone, employeeStatus, employeeId
      },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json({ doctor: updated });
  })
);

// POST /hr/doctors/:id/letter  — generate joining letter for doctor
hrRouter.post(
  '/doctors/:id/letter',
  adminAuthMiddleware,
  asyncRoute(async (req, res) => {
    const id = req.params['id'] as string;
    const { clinicName, clinicAddress } = req.body as { clinicName?: string; clinicAddress?: string };

    const doctor = await prisma.doctor.findUniqueOrThrow({
      where: { id },
      include: { user: true }
    });

    const letterNumber = generateLetterNumber('JL-DOC');
    const issuedDate = new Date();

    const content = {
      letterNumber,
      issuedDate: issuedDate.toISOString(),
      organizationName: clinicName ?? 'Betelgeuse Clinic',
      organizationAddress: clinicAddress ?? '',
      employeeName: doctor.user.name,
      employeeEmail: doctor.user.email ?? '',
      employeeCode: doctor.employeeId ?? `DOC-${doctor.id.slice(0, 6).toUpperCase()}`,
      designation: doctor.designation ?? 'Doctor',
      department: doctor.department ?? doctor.specialty,
      specialty: doctor.specialty,
      registrationNo: doctor.registrationNo ?? 'N/A',
      joiningDate: doctor.joiningDate ? doctor.joiningDate.toISOString() : issuedDate.toISOString(),
      probationEndDate: doctor.probationEndDate?.toISOString() ?? null,
      salary: formatSalary(doctor.salaryPerMonth),
      consultationFee: doctor.consultationFee ? `₹${(doctor.consultationFee / 100).toFixed(0)}` : 'As per schedule',
      shift: formatShift(doctor.workShift, doctor.shiftStart, doctor.shiftEnd),
      weeklyOff: (doctor.weeklyOffDays ?? []).join(', ') || 'Sunday',
      phone: doctor.phone ?? doctor.user.mobile ?? '',
      address: doctor.address ?? '',
    };

    const letter = await prisma.joiningLetter.upsert({
      where: { doctorUserId: id },
      create: { letterNumber, issuedDate, content, doctorUserId: id },
      update: { letterNumber, issuedDate, content }
    });

    res.json({ letter });
  })
);

// GET /hr/doctors/:id/letter
hrRouter.get(
  '/doctors/:id/letter',
  adminAuthMiddleware,
  asyncRoute(async (req, res) => {
    const id = req.params['id'] as string;
    const letter = await prisma.joiningLetter.findUnique({ where: { doctorUserId: id } });
    if (!letter) { res.status(404).json({ error: 'Letter not yet generated' }); return; }
    res.json({ letter });
  })
);

export { hrRouter };
