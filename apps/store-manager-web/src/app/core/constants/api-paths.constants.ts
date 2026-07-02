export const API_BASE = {
  STORE: '/store'
} as const;

export const STORE_API_PATHS = {
  AUTH: {
    MANAGER_LOGIN: '/auth/manager-login'
  },
  DASHBOARD: '/dashboard',
  MEDICINES: '/medicines',
  RACKS: '/racks',
  STOCK: {
    ADD: '/stock/add',
    REMOVE: '/stock/remove'
  },
  ALERTS: {
    LOW_STOCK: '/alerts/low-stock',
    EXPIRING: '/alerts/expiring'
  },
  MOVEMENTS: '/movements',
  STAFF: {
    ACTIVITY: '/staff/activity',
    DETAIL_ACTIVITY: (staffId: string) => `/staff/${staffId}/activity`
  },
  EXPENSES: '/expenses',
  PATIENTS: {
    SEARCH: '/patients/search',
    CREATE: '/patients',
    BY_MOBILE: (mobile: string) => `/patients/by-mobile/${encodeURIComponent(mobile)}`
  },
  HR: {
    STAFF: '/hr/staff',
    STAFF_DETAIL: (id: string) => `/hr/staff/${id}`,
    STAFF_LETTER: (id: string) => `/hr/staff/${id}/letter`
  }
} as const;
