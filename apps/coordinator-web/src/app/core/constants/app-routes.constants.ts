export const ROUTE_PATHS = {
  LOGIN: 'login',
  FOLLOW_UPS: 'follow-ups'
} as const;

export const DEFAULT_AUTHED_ROUTE = ROUTE_PATHS.FOLLOW_UPS;

export const NAV_ITEMS = [
  { path: ROUTE_PATHS.FOLLOW_UPS, label: 'Follow-ups', icon: '💊' }
] as const;
