export const API_PATHS = {
  CORPORATE_WELLNESS: {
    ME: '/corporate-wellness/me',
    ACCOUNTS: '/corporate-wellness/accounts',
    ENROLLMENTS: (id: string) => `/corporate-wellness/accounts/${id}/enrollments`
  }
} as const;
