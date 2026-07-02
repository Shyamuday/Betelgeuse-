import { Router } from 'express';
import { registerHrAuthRoutes } from './auth.js';
import { registerHrDashboardRoutes } from './dashboard.js';
import { registerHrDoctorRoutes } from './doctors.js';
import { registerHrEmployeeRoutes } from './employees.js';
import { registerHrLeaveRoutes } from './leaves.js';
import { registerHrPayrollRoutes } from './payroll.js';
import { registerHrSelfServiceRoutes } from './self-service.js';
import { registerHrStoreStaffRoutes } from './store-staff.js';
import { registerHrStoreRoutes } from './stores.js';
import { registerHrUserRoutes } from './users.js';

export const hrRouter = Router();

registerHrAuthRoutes(hrRouter);
registerHrDashboardRoutes(hrRouter);
registerHrEmployeeRoutes(hrRouter);
registerHrDoctorRoutes(hrRouter);
registerHrStoreStaffRoutes(hrRouter);
registerHrLeaveRoutes(hrRouter);
registerHrStoreRoutes(hrRouter);
registerHrUserRoutes(hrRouter);
registerHrPayrollRoutes(hrRouter);
registerHrSelfServiceRoutes(hrRouter);
