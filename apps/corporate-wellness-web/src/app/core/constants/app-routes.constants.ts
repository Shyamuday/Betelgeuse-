export const ROUTE_PATHS = {
  LOGIN: 'login',
  ACCOUNTS: 'accounts'
} as const;

export const DEFAULT_AUTHED_ROUTE = ROUTE_PATHS.ACCOUNTS;

export const NAV_ITEMS = [
  { path: ROUTE_PATHS.ACCOUNTS, label: 'Corporate accounts', icon: '🏢' }
] as const;
