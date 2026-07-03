export const AUTH_TOKEN_KEY = 'operations_token';
export const AUTH_USER_KEY = 'operations_user';
export const AUTH_CAPABILITIES_KEY = 'operations_capabilities';
export const AUTH_DEFAULT_ROUTE_KEY = 'operations_default_route';
export const AUTH_STORE_STAFF_KEY = 'operations_store_staff';

export const AUTH_PATHS = {
  LOGIN: '/auth/staff-login',
  ME: '/me',
  CAPABILITIES: '/capabilities'
} as const;
