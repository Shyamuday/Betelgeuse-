export const EMPLOYEE_STATUSES = [
  'ACTIVE',
  'ON_LEAVE',
  'RESIGNED',
  'TERMINATED'
] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const DEFAULT_EMPLOYEE_STATUS: EmployeeStatus = 'ACTIVE';

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  ACTIVE: '#4ade80',
  ON_LEAVE: '#fb923c',
  RESIGNED: '#94a3b8',
  TERMINATED: '#f87171'
};

export const EMPLOYEE_STATUS_FALLBACK_COLOR = '#94a3b8';

export const EMPLOYEE_STATUS_FILTER_OPTIONS = [
  { label: 'All Status', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'On Leave', value: 'ON_LEAVE' },
  { label: 'Resigned', value: 'RESIGNED' }
] as const;
