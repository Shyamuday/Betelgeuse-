export const API_PATHS = {
  DISEASES: '/diseases',
  HR: {
    DASHBOARD: '/hr/dashboard',
    EMPLOYEES: '/hr/employees',
    DOCTORS: '/hr/doctors',
    STORE_STAFF: '/hr/store/staff',
    LEAVES: '/hr/leaves',
    STORES: '/hr/stores'
  },
  RECEPTION: {
    ME: '/reception/me',
    QUEUE: '/reception/queue',
    PATIENTS_SEARCH: '/reception/patients/search',
    DOCTORS: '/reception/doctors',
    WALK_IN: '/reception/walk-in',
    CONSULTATIONS: '/reception/consultations',
    COLLECT_CASH: (id: string) => `/reception/consultations/${id}/collect-cash`,
    ASSIGN: (id: string) => `/reception/consultations/${id}/assign`
  },
  CLINIC_MANAGER: {
    ME: '/clinic-manager/me',
    DASHBOARD: '/clinic-manager/dashboard',
    ROSTER: '/clinic-manager/roster',
    SCHEDULES: '/clinic-manager/schedules'
  },
  ACCOUNTANT: {
    ME: '/accountant/me',
    SUMMARY: '/accountant/summary',
    BRANCHES: '/accountant/branches',
    EXPORT_BUNDLE: '/accountant/export-bundle'
  },
  BRANCH_OWNER: {
    ME: '/branch-owner/me',
    DASHBOARD: '/branch-owner/dashboard'
  },
  COORDINATOR: {
    ME: '/coordinator/me',
    FOLLOW_UPS: '/coordinator/follow-ups'
  },
  CALL_CENTER: {
    ME: '/call-center/me',
    PATIENT_SEARCH: '/call-center/patients/search',
    RECENT_CONSULTATIONS: '/call-center/consultations/recent'
  },
  MARKETING: {
    ME: '/marketing/me',
    FUNNELS: '/marketing/funnels'
  },
  SUPPLIER: {
    ME: '/supplier/me',
    ORDERS: '/supplier/purchase-orders',
    ORDER: (id: string) => `/supplier/purchase-orders/${id}`,
    CONFIRM: (id: string) => `/supplier/purchase-orders/${id}/confirm`
  },
  WAREHOUSE: {
    ME: '/warehouse/me',
    DASHBOARD: '/warehouse/dashboard',
    BRANCHES: '/warehouse/branches',
    TRANSFERS: '/warehouse/transfers',
    TRANSFER: (id: string) => `/warehouse/transfers/${id}`,
    DISPATCH: (id: string) => `/warehouse/transfers/${id}/dispatch`
  },
  DELIVERY: {
    ME: '/delivery/me',
    DASHBOARD: '/delivery/dashboard',
    ORDERS: '/delivery/orders',
    ORDER: (id: string) => `/delivery/orders/${id}`,
    ACCEPT: (id: string) => `/delivery/orders/${id}/accept`,
    PICKUP: (id: string) => `/delivery/orders/${id}/pickup`,
    COMPLETE: (id: string) => `/delivery/orders/${id}/complete`,
    FAIL: (id: string) => `/delivery/orders/${id}/fail`
  },
  DIAGNOSTIC: {
    ME: '/diagnostic/me',
    REFERRALS: '/diagnostic/referrals',
    REFERRAL: (id: string) => `/diagnostic/referrals/${id}`,
    ACCEPT: (id: string) => `/diagnostic/referrals/${id}/accept`,
    ADVANCE: (id: string) => `/diagnostic/referrals/${id}/advance`,
    RESULTS: (id: string) => `/diagnostic/referrals/${id}/results`
  },
  CORPORATE_WELLNESS: {
    ME: '/corporate-wellness/me',
    ACCOUNTS: '/corporate-wellness/accounts',
    ENROLLMENTS: (id: string) => `/corporate-wellness/accounts/${id}/enrollments`
  },
  INSURANCE: {
    ME: '/insurance/me',
    CLAIMS: '/insurance/claims',
    CLAIM_STATUS: (id: string) => `/insurance/claims/${id}/status`
  }
} as const;
