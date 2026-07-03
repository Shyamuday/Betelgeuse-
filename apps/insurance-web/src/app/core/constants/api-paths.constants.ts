export const API_PATHS = {
  INSURANCE: {
    ME: '/insurance/me',
    CLAIMS: '/insurance/claims',
    CLAIM_STATUS: (id: string) => `/insurance/claims/${id}/status`
  }
} as const;
