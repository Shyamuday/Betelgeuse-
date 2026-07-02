export const LEAVE_TYPES = [
  'CASUAL',
  'SICK',
  'EARNED',
  'UNPAID',
  'MATERNITY',
  'PATERNITY'
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

export const DEFAULT_LEAVE_TYPE: LeaveType = 'CASUAL';

export const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  CASUAL: '#60a5fa',
  SICK: '#f87171',
  EARNED: '#4ade80',
  UNPAID: '#94a3b8',
  MATERNITY: '#f472b6',
  PATERNITY: '#2dd4bf'
};

export const LEAVE_TYPE_ICONS: Record<LeaveType, string> = {
  CASUAL: '📅',
  SICK: '🤒',
  EARNED: '⭐',
  UNPAID: '💸',
  MATERNITY: '👶',
  PATERNITY: '👨‍👶'
};

export const LEAVE_TYPE_FALLBACK_COLOR = '#94a3b8';
export const LEAVE_TYPE_FALLBACK_ICON = '📋';
