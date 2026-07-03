import { FILTER_ALL } from '../../../shared/constants/filter.constants';
import { PAGE_SIZES } from '../../../core/constants/pagination.constants';

export const PAYMENT_STATUS_OPTIONS = [
  { label: 'All Statuses', value: FILTER_ALL },
  { label: 'Created', value: 'CREATED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Failed', value: 'FAILED' }
] as const;

export const PAYMENT_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  CREATED: { bg: '#fef3c7', color: '#92400e' },
  PAID: { bg: '#dcfce7', color: '#166534' },
  FAILED: { bg: '#fee2e2', color: '#991b1b' }
};

export const PAYMENTS_PAGE_SIZE = PAGE_SIZES.PAYMENTS;

export function formatPaise(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
