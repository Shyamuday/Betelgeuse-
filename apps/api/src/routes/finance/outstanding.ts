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

export function registerFinanceOutstandingRoutes(router: Router) {
// GET /admin/finance/outstanding
router.get(
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

}
