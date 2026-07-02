import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, formatPaise } from '../../my-pay/constants/my-pay.constants';

export { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS, formatPaise };

export const EMPTY_STORE_EXPENSE = {
  category: 'MISC',
  description: '',
  vendor: '',
  billNo: '',
  amountInPaise: 0,
  expenseDate: new Date().toISOString().slice(0, 10)
};
