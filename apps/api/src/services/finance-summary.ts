import { ExpenseLevel, PaymentStatus, StockMovementType } from '@prisma/client';
import { prisma } from '../db.js';
import { calcNetSalary, getLeaveDaysMap, parseMonth } from './payroll.js';

export async function getFinanceMonthSummary(monthStr: string) {
  const range = parseMonth(monthStr);
  const monthEnd = new Date(
    range.monthEnd.getFullYear(),
    range.monthEnd.getMonth(),
    range.monthEnd.getDate(),
    23,
    59,
    59,
    999
  );

  const [consultationAgg, medicineAgg, doctors, storeStaff, clinicExpenses, storeExpenses] =
    await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          createdAt: { gte: range.monthStart, lte: monthEnd }
        },
        _sum: { amountInPaise: true },
        _count: true
      }),
      prisma.stockMovement.aggregate({
        where: {
          type: StockMovementType.SALE_OUT,
          createdAt: { gte: range.monthStart, lte: monthEnd }
        },
        _sum: { amountInPaise: true },
        _count: true
      }),
      prisma.doctor.findMany({
        where: { employeeStatus: { not: 'TERMINATED' } },
        select: { id: true, salaryPerMonth: true }
      }),
      prisma.storeStaff.findMany({
        where: { employeeStatus: { not: 'TERMINATED' } },
        select: { id: true, salaryPerMonth: true }
      }),
      prisma.businessExpense.aggregate({
        where: {
          level: ExpenseLevel.CLINIC,
          expenseDate: { gte: range.monthStart, lte: range.monthEnd }
        },
        _sum: { amountInPaise: true }
      }),
      prisma.businessExpense.aggregate({
        where: {
          level: ExpenseLevel.STORE,
          expenseDate: { gte: range.monthStart, lte: range.monthEnd }
        },
        _sum: { amountInPaise: true }
      })
    ]);

  const leaveDaysMap = await getLeaveDaysMap(range.monthStart, range.monthEnd);
  const payrollCost = [...doctors, ...storeStaff].reduce((sum, emp) => {
    const gross = emp.salaryPerMonth ?? 0;
    const leaveDays = leaveDaysMap.get(emp.id) ?? 0;
    return sum + calcNetSalary(gross, leaveDays, range.daysInMonth);
  }, 0);

  const consultationRevenueInPaise = consultationAgg._sum?.amountInPaise ?? 0;
  const medicineRevenueInPaise = medicineAgg._sum?.amountInPaise ?? 0;
  const clinicExpensesInPaise = clinicExpenses._sum?.amountInPaise ?? 0;
  const storeExpensesInPaise = storeExpenses._sum?.amountInPaise ?? 0;
  const totalExpensesInPaise = clinicExpensesInPaise + storeExpensesInPaise;
  const totalRevenueInPaise = consultationRevenueInPaise + medicineRevenueInPaise;
  const netEstimateInPaise = totalRevenueInPaise - payrollCost - totalExpensesInPaise;

  return {
    month: monthStr,
    consultationRevenueInPaise,
    medicineRevenueInPaise,
    totalRevenueInPaise,
    payrollCostInPaise: payrollCost,
    clinicExpensesInPaise,
    storeExpensesInPaise,
    totalExpensesInPaise,
    netEstimateInPaise,
    counts: {
      paidConsultations: consultationAgg._count,
      medicineSales: medicineAgg._count
    }
  };
}
