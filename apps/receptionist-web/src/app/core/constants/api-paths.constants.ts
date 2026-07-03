export const API_PATHS = {
  DISEASES: '/diseases',
  RECEPTION: {
    ME: '/reception/me',
    QUEUE: '/reception/queue',
    PATIENTS_SEARCH: '/reception/patients/search',
    DOCTORS: '/reception/doctors',
    WALK_IN: '/reception/walk-in',
    CONSULTATIONS: '/reception/consultations',
    COLLECT_CASH: (id: string) => `/reception/consultations/${id}/collect-cash`,
    ASSIGN: (id: string) => `/reception/consultations/${id}/assign`
  }
} as const;
