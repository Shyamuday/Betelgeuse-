export const ROUTE_PATHS = {
  LOGIN: 'login',
  REPORTS: 'reports'
} as const;

export const DEFAULT_AUTHED_ROUTE = ROUTE_PATHS.REPORTS;

export const NAV_ITEMS = [
  { path: ROUTE_PATHS.REPORTS, label: 'Finance reports', icon: '📑' }
] as const;
