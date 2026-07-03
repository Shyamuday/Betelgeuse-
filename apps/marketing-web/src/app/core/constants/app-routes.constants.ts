export const ROUTE_PATHS = {
  LOGIN: 'login',
  FUNNELS: 'funnels'
} as const;

export const DEFAULT_AUTHED_ROUTE = ROUTE_PATHS.FUNNELS;

export const NAV_ITEMS = [
  { path: ROUTE_PATHS.FUNNELS, label: 'Product funnels', icon: '📈' }
] as const;
