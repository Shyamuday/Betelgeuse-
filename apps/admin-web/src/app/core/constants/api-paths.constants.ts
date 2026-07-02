export const API_PATHS = {
  AUTH: {
    STAFF_LOGIN: '/auth/staff-login',
    ME: '/me'
  },
  ADMIN: {
    REPORTS: '/admin/reports',
    AUDIT_LOGS: '/admin/audit-logs',
    PAYMENTS: '/admin/payments',
    DOCTORS: '/admin/doctors',
    DOCTORS_PENDING: '/admin/doctors/pending',
    CONSUMERS: '/admin/consumers',
    DISEASES: '/admin/diseases',
    DISEASES_LIST: '/admin/diseases/list'
  },
  CONSULTATIONS: '/consultations',
  HR: {
    DOCTORS: '/hr/doctors',
    USERS: '/hr/users',
    EMPLOYEES: '/hr/employees',
    LEAVES: '/hr/leaves',
    STORES: '/hr/stores',
    STORE_STAFF: '/hr/store/staff'
  }
} as const;

export const API_EXPORT_FORMAT = {
  CSV: 'csv'
} as const;
