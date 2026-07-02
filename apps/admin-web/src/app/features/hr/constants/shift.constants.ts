export const WORK_SHIFTS = [
  'MORNING',
  'AFTERNOON',
  'EVENING',
  'NIGHT',
  'FULL_DAY',
  'CUSTOM'
] as const;

export type WorkShift = (typeof WORK_SHIFTS)[number];

export const DEFAULT_WORK_SHIFT: WorkShift = 'FULL_DAY';

export const WORK_SHIFT_LABELS: Record<WorkShift, string> = {
  MORNING: '🌅 Morning',
  AFTERNOON: '🌤️ Afternoon',
  EVENING: '🌆 Evening',
  NIGHT: '🌙 Night',
  FULL_DAY: '☀️ Full Day',
  CUSTOM: '⚙️ Custom'
};

export const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const;
