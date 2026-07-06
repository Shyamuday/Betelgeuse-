import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { LeaveType } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { JWT_SECRET } from './shared.js';

export function registerHrSelfServiceRoutes(router: Router) {
// ─── Self-Service Leave Requests ─────────────────────────────────────────────
// Doctors and store staff submit their own leave requests (status = PENDING)

// POST /hr/self/doctor-leave — authenticated doctor submits leave
router.post(HR_API_ROUTES.SELF_DOCTOR_LEAVE, asyncRoute(async (req, res) => {
  const authHeader = req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }

  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string };
    userId = decoded.userId ?? decoded.id ?? '';
    if (!userId) { res.status(401).json({ error: 'Invalid token' }); return; }
  } catch { res.status(401).json({ error: 'Invalid token' }); return; }

  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) { res.status(403).json({ error: 'Doctor record not found' }); return; }

  const { type, startDate, endDate, reason } = req.body as {
    type: LeaveType; startDate: string; endDate: string; reason?: string;
  };
  if (!type || !startDate || !endDate) { res.status(400).json({ error: 'type, startDate, endDate are required' }); return; }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    res.status(400).json({ error: 'Invalid date range' }); return;
  }
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const leave = await prisma.leaveRequest.create({
    data: { employeeType: 'DOCTOR', doctorId: doctor.id, type, startDate: start, endDate: end, totalDays, reason: reason ?? '' }
  });
  res.status(201).json({ leave });
}));

// POST /hr/self/staff-leave — store staff submits own leave
router.post(HR_API_ROUTES.SELF_STAFF_LEAVE, asyncRoute(async (req, res) => {
  const { staffCode, storeCode, type, startDate, endDate, reason } = req.body as {
    staffCode: string; storeCode: string; type: LeaveType;
    startDate: string; endDate: string; reason?: string;
  };
  if (!staffCode || !storeCode || !type || !startDate || !endDate) {
    res.status(400).json({ error: 'staffCode, storeCode, type, startDate, endDate are required' }); return;
  }

  const store = await prisma.store.findUnique({ where: { code: storeCode }, select: { id: true } });
  if (!store) { res.status(404).json({ error: 'Store not found' }); return; }

  const staff = await prisma.storeStaff.findFirst({ where: { staffCode, storeId: store.id, isActive: true } });
  if (!staff) { res.status(404).json({ error: 'Staff not found' }); return; }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    res.status(400).json({ error: 'Invalid date range' }); return;
  }
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const leave = await prisma.leaveRequest.create({
    data: { employeeType: 'STORE_STAFF', storeStaffId: staff.id, type, startDate: start, endDate: end, totalDays, reason: reason ?? '' }
  });
  res.status(201).json({ leave });
}));

// GET /hr/self/doctor-leaves — doctor views their own leaves
router.get(HR_API_ROUTES.SELF_DOCTOR_LEAVES, asyncRoute(async (req, res) => {
  const authHeader = req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }

  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; id?: string };
    userId = decoded.userId ?? decoded.id ?? '';
    if (!userId) { res.status(401).json({ error: 'Invalid token' }); return; }
  } catch { res.status(401).json({ error: 'Invalid token' }); return; }

  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) { res.status(403).json({ error: 'Doctor record not found' }); return; }

  const leaves = await prisma.leaveRequest.findMany({
    where: { doctorId: doctor.id },
    orderBy: { createdAt: 'desc' },
    include: { approvedBy: { select: { name: true } } }
  });
  res.json({ leaves });
}));
}
