import { SORT_DIRECTIONS } from '../../../shared/constants/filter.constants';
import { PAGE_SIZES } from '../../../core/constants/pagination.constants';

export const CONSUMERS_PAGE_SIZE = PAGE_SIZES.CONSUMERS;

export const CONSUMER_SORT_FIELDS = ['name', 'consultations'] as const;
export type ConsumerSortField = (typeof CONSUMER_SORT_FIELDS)[number];

export const CONSUMERS_LIST_DEFAULTS = {
  SORT_BY: 'consultations' as ConsumerSortField,
  SORT_DIRECTION: SORT_DIRECTIONS.DESC
} as const;
