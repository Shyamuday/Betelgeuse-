export const FILTER_ALL = 'ALL' as const;

export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

export type SortDirection = (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS];
