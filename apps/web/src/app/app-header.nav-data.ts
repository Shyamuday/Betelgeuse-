import { type Role } from './interfaces';

/** Visitor / logged-out primary navigation (sheet + desktop). */
export type GuestHeaderNavItem =
  | { id: string; type: 'route'; label: string; routerLink: string; linkClass?: string }
  | { id: string; type: 'auth'; label: string; authMode: 'patient' | 'staff'; linkClass?: string }
  | { id: string; type: 'whatsapp'; ariaLabel: string };

/** Links in the signed-in user chip (before name / role / logout). */
export type AuthenticatedHeaderNavItem = {
  id: string;
  type: 'route';
  label: string;
  routerLink: string;
  linkClass?: string;
  /** When set, the link is shown only for these roles. */
  roles?: Role[];
};

export const DEFAULT_HEADER_BRAND = {
  title: 'Vitalis Care and Research Centre',
  mark: 'B',
  homePath: '/'
} as const;

export const DEFAULT_GUEST_HEADER_NAV: GuestHeaderNavItem[] = [
  { id: 'about', type: 'route', label: 'About us', routerLink: '/about' },
  { id: 'treatments', type: 'route', label: 'Treatments', routerLink: '/treatments' },
  { id: 'safety', type: 'route', label: 'Safety', routerLink: '/safety' },
  { id: 'login', type: 'auth', label: 'Login', authMode: 'patient', linkClass: 'header-cta' },
  {
    id: 'doctor-login',
    type: 'auth',
    label: 'Doctor login',
    authMode: 'staff',
    linkClass: 'header-cta secondary'
  },
  { id: 'whatsapp', type: 'whatsapp', ariaLabel: 'WhatsApp' }
];

export const DEFAULT_USER_HEADER_NAV: AuthenticatedHeaderNavItem[] = [
  {
    id: 'self-assessment',
    type: 'route',
    label: 'Self-assessment',
    routerLink: '/patient/self-diagnosis',
    linkClass: 'user-chip-nav',
    roles: ['PATIENT']
  }
];
