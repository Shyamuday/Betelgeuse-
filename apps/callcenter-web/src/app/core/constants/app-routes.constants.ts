export const ROUTE_PATHS = {
  LOGIN: 'login',
  PATIENTS: 'patients',
  CONSULTATIONS: 'consultations'
} as const;

export const DEFAULT_AUTHED_ROUTE = ROUTE_PATHS.PATIENTS;

export const NAV_ITEMS = [
  { path: ROUTE_PATHS.PATIENTS, label: 'Patient search', icon: '🔍' },
  { path: ROUTE_PATHS.CONSULTATIONS, label: 'Recent consults', icon: '📋' }
] as const;
