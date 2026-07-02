export const LEAVE_STATUSES = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
} as const;

export type LeaveStatus = (typeof LEAVE_STATUSES)[keyof typeof LEAVE_STATUSES];

export const LEAVE_STATUS_STYLES: Record<LeaveStatus, { bg: string; color: string }> = {
  PENDING: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c' },
  APPROVED: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  REJECTED: { bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  CANCELLED: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' }
};

export const LEAVE_STATUS_FALLBACK_STYLE = {
  bg: 'rgba(255,255,255,0.06)',
  color: '#94a3b8'
} as const;

export const LEAVE_STATUS_FILTER_OPTIONS = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: LEAVE_STATUSES.PENDING },
  { label: 'Approved', value: LEAVE_STATUSES.APPROVED },
  { label: 'Rejected', value: LEAVE_STATUSES.REJECTED }
] as const;
