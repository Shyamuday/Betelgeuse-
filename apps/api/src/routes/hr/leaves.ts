import { Router, Request } from 'express';
import { EmployeeStatus, EmployeeType, LeaveStatus, LeaveType } from '@prisma/client';
import { HR_API_ROUTES, HR_DEFAULT_PAGE_SIZE } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { AuthPayload, hrAuthMiddleware } from './shared.js';

export function registerHrLeaveRoutes(router: Router) {
// ─── Leave Management ─────────────────────────────────────────────────────────

// GET /hr/leaves?status=PENDING&type=ALL&empType=ALL
router.get(HR_API_ROUTES.LEAVES, hrAuthMiddleware, asyncRoute(async (req, res) => {
  const status = (req.query['status'] as string) ?? 'ALL';
  const empType = (req.query['empType'] as string) ?? 'ALL';
  const page = parseInt(req.query['page'] as string) || 1;
  const pageSize = parseInt(req.query['pageSize'] as string) || HR_DEFAULT_PAGE_SIZE;

  const where = {
    status: status !== 'ALL' ? (status as LeaveStatus) : undefined,
    employeeType: empType !== 'ALL' ? (empType as EmployeeType) : undefined
  };

  const [leaves, total] = await Promise.all([
    prisma.leaveRequest.findMany({
      where,
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        storeStaff: { select: { name: true, staffCode: true, store: { select: { name: true } } } },
        approvedBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.leaveRequest.count({ where })
  ]);

  res.json({ leaves, total, page, pageSize });
}));

// GET /hr/leaves/:id
router.get(HR_API_ROUTES.LEAVE_BY_ID, hrAuthMiddleware, asyncRoute(async (req, res) => {
  const leave = await prisma.leaveRequest.findUniqueOrThrow({
    where: { id: req.params['id'] as string },
    include: {
      doctor: { include: { user: { select: { name: true, email: true } } } },
      storeStaff: { select: { name: true, staffCode: true, store: { select: { name: true } } } },
      approvedBy: { select: { name: true } }
    }
  });
  res.json({ leave });
}));

// POST /hr/leaves  — HR can manually add a leave record
router.post(HR_API_ROUTES.LEAVES, hrAuthMiddleware, asyncRoute(async (req, res) => {
  const {
    employeeType, doctorId, storeStaffId, type, startDate, endDate, reason
  } = req.body as {
    employeeType: EmployeeType; doctorId?: string; storeStaffId?: string;
    type: LeaveType; startDate: string; endDate: string; reason: string;
  };

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const leave = await prisma.leaveRequest.create({
    data: { employeeType, doctorId, storeStaffId, type, startDate: start, endDate: end, totalDays, reason }
  });
  res.status(201).json({ leave });
}));

// PATCH /hr/leaves/:id — approve or reject
router.patch('/leaves/:id', hrAuthMiddleware, asyncRoute(async (req, res) => {
  const id = req.params['id'] as string;
  const { status, hrNote } = req.body as { status: LeaveStatus; hrNote?: string };
  const { userId } = (req as Request & { hrPayload: AuthPayload }).hrPayload;

  const leave = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status,
      hrNote,
      approvedById: (status === 'APPROVED' || status === 'REJECTED') ? userId : undefined
    }
  });

  // Update employeeStatus if on leave / returning
  if (status === 'APPROVED') {
    if (leave.employeeType === 'DOCTOR' && leave.doctorId) {
      await prisma.doctor.update({ where: { id: leave.doctorId }, data: { employeeStatus: 'ON_LEAVE' } });
    } else if (leave.employeeType === 'STORE_STAFF' && leave.storeStaffId) {
      await prisma.storeStaff.update({ where: { id: leave.storeStaffId }, data: { employeeStatus: 'ON_LEAVE' } });
    }
  }

  res.json({ leave });
}));
}
