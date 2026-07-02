import { Router } from 'express';
import { registerFinanceExpenseRoutes } from './expenses.js';
import { registerFinanceOutstandingRoutes } from './outstanding.js';
import { registerFinancePayslipRoutes } from './payslip.js';
import { registerFinanceRevenueRoutes } from './revenue.js';
import { registerFinanceSummaryRoutes } from './summary.js';

export const financeRouter = Router();

registerFinanceSummaryRoutes(financeRouter);
registerFinanceRevenueRoutes(financeRouter);
registerFinanceOutstandingRoutes(financeRouter);
registerFinancePayslipRoutes(financeRouter);
registerFinanceExpenseRoutes(financeRouter);
