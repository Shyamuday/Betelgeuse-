export const AUTH_TOKEN_KEY = 'admin_app_token';

export const STAFF_ROLES = {
  ADMIN: 'ADMIN'
} as const;

export const AUTH_PATHS = {
  STAFF_LOGIN: '/auth/staff-login',
  ME: '/me'
} as const;

export const AUTH_MESSAGES = {
  ADMIN_ONLY: 'Only admin can login to this app.',
  INVALID_LOGIN: 'Invalid login or API unavailable.'
} as const;
