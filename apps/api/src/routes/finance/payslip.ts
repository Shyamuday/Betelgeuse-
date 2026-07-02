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

export function registerFinancePayslipRoutes(router: Router) {
// GET /admin/finance/payslip/:type/:id?month=YYYY-MM
router.get(
  '/admin/finance/payslip/:type/:id',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const type = routeParam(req, 'type').toUpperCase();
    const id = routeParam(req, 'id');
    const month = queryText(req, 'month');

    if (type === 'DOCTOR') {
      const payslip = await buildDoctorPayslip(id, month || undefined);
      if (!payslip) return res.status(404).json({ message: 'Doctor not found.' });
      return res.json({ payslip });
    }
    if (type === 'STORE_STAFF') {
      const payslip = await buildStoreStaffPayslip(id, month || undefined);
      if (!payslip) return res.status(404).json({ message: 'Store staff not found.' });
      return res.json({ payslip });
    }
    return res.status(400).json({ message: 'Invalid payslip type. Use DOCTOR or STORE_STAFF.' });
  })
);

}
