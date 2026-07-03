export const ROUTE_PATHS = {
  LOGIN: 'login',
  CLAIMS: 'claims'
} as const;

export const DEFAULT_AUTHED_ROUTE = ROUTE_PATHS.CLAIMS;

export const NAV_ITEMS = [
  { path: ROUTE_PATHS.CLAIMS, label: 'Insurance claims', icon: '📄' }
] as const;
