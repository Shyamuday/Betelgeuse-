import { Router } from 'express';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';

export function registerHrDashboardRoutes(router: Router) {
// ─── HR Dashboard ─────────────────────────────────────────────────────────────

router.get(
  HR_API_ROUTES.DASHBOARD,
  hrAuthMiddleware,
  asyncRoute(async (req, res) => {
    const { storeIds } = getAccess(req);
    // storeIds = null means admin (all stores); [] means HR with no stores assigned yet
    const staffWhere = storeIds ? { storeId: { in: storeIds } } : {};
    const doctorWhere = storeIds
      ? { OR: [ { isOnline: true }, { clinicStoreId: { in: storeIds } } ] }
      : {};
    const leaveWhere = storeIds
      ? {
          OR: [
            { employeeType: 'DOCTOR' as const, doctor: { OR: [{ isOnline: true }, { clinicStoreId: { in: storeIds } }] } },
            { employeeType: 'STORE_STAFF' as const, storeStaff: { storeId: { in: storeIds } } }
          ]
        }
      : {};

    const [totalDoctors, activeDoctors, totalStoreStaff, activeStoreStaff, pendingLeaves, recentJoins, leaveStats] = await Promise.all([
      prisma.doctor.count({ where: doctorWhere }),
      prisma.doctor.count({ where: { ...doctorWhere, employeeStatus: 'ACTIVE' } }),
      prisma.storeStaff.count({ where: staffWhere }),
      prisma.storeStaff.count({ where: { ...staffWhere, employeeStatus: 'ACTIVE' } }),
      prisma.leaveRequest.count({ where: { ...leaveWhere, status: 'PENDING' } }),
      prisma.doctor.findMany({
        where: { ...doctorWhere, joiningDate: { not: null } },
        orderBy: { joiningDate: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } }
      }),
      prisma.leaveRequest.groupBy({ by: ['status'], where: leaveWhere, _count: { id: true } })
    ]);

    const leaveByStatus = Object.fromEntries(leaveStats.map(s => [s.status, s._count.id]));
    const accessibleStores = storeIds
      ? await prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true, code: true } })
      : await prisma.store.findMany({ select: { id: true, name: true, code: true } });

    res.json({
      totalDoctors, activeDoctors, totalStoreStaff, activeStoreStaff,
      totalEmployees: totalDoctors + totalStoreStaff,
      pendingLeaves, leaveStats: leaveByStatus,
      accessibleStores,
      recentJoins: recentJoins.map(d => ({ id: d.id, name: d.user.name, designation: d.designation, joiningDate: d.joiningDate }))
    });
  })
);
}
