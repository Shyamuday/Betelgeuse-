import { FILTER_ALL } from '../../../shared/constants/filter.constants';
import { PAGE_SIZES } from '../../../core/constants/pagination.constants';

export const PAYMENT_STATUSES = [FILTER_ALL, 'CREATED', 'PAID', 'FAILED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENTS_PAGE_SIZE = PAGE_SIZES.PAYMENTS;
export const AUDIT_LOGS_PAGE_SIZE = PAGE_SIZES.AUDIT_LOGS;

export const PAYMENTS_DEFAULTS = {
  STATUS: FILTER_ALL as PaymentStatus
} as const;
