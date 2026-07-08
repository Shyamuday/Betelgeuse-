export const ROUTE_PATHS = {
  LOGIN: 'login',

  WORKLIST: 'worklist',

  DASHBOARD: 'dashboard',

  APPOINTMENTS: 'appointments',

  REPERTORY: 'repertory',

  CASE_ANALYSIS_STUDIO: 'case-analysis',

  REPERTORY_BROWSER: 'repertory-browser',

  CASE_ANALYSIS: 'consultations',

  PATIENTS: 'patients',

  PROFILE: 'profile',

  LEAVES: 'leaves',

  SLOTS: 'slots',

  EARNINGS: 'earnings',

  PATIENT_SCAN: 'scan/patient',

  SCAN: 'scan',

  DISEASE_PAGES: 'disease-pages',

  BLOG: 'blog',

  ONLINE_DOCTOR: 'online-doctor',
} as const;

export const DEFAULT_AUTHED_ROUTE = ROUTE_PATHS.WORKLIST;

/** Legacy flat list — prefer doctor-nav.constants.ts for the live shell menu. */

export const NAV_ITEMS = [
  { path: `/${ROUTE_PATHS.WORKLIST}`, label: 'Worklist' },

  { path: `/${ROUTE_PATHS.CASE_ANALYSIS_STUDIO}`, label: 'Case Analysis' },

  { path: `/${ROUTE_PATHS.REPERTORY_BROWSER}`, label: 'Repertory lookup' },

  { path: `/${ROUTE_PATHS.PATIENTS}`, label: 'Patients' },

  { path: `/${ROUTE_PATHS.ONLINE_DOCTOR}`, label: 'Go live' },

  { path: `/${ROUTE_PATHS.SCAN}`, label: 'Scan' },

  { path: `/${ROUTE_PATHS.DASHBOARD}`, label: 'Dashboard' },

  { path: `/${ROUTE_PATHS.SLOTS}`, label: 'Slots' },

  { path: `/${ROUTE_PATHS.LEAVES}`, label: 'Leaves' },

  { path: `/${ROUTE_PATHS.EARNINGS}`, label: 'Earnings' },

  { path: `/${ROUTE_PATHS.DISEASE_PAGES}`, label: 'Treatment pages' },

  { path: `/${ROUTE_PATHS.BLOG}`, label: 'Blog articles' },

  { path: `/${ROUTE_PATHS.PROFILE}`, label: 'Profile' },
] as const;
