import { z } from 'zod';
import { ExpenseCategory, ExpenseLevel } from '@prisma/client';

export const expenseBodySchema = z.object({
  level: z.nativeEnum(ExpenseLevel),
  storeId: z.string().optional().nullable(),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1),
  vendor: z.string().optional().nullable(),
  billNo: z.string().optional().nullable(),
  amountInPaise: z.number().int().positive(),
  expenseDate: z.string().min(1)
});

export function monthDateRange(from?: string, to?: string) {
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : undefined;
  return { fromDate, toDate };
}
