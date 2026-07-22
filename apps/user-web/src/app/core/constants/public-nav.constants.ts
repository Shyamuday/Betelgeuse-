import { ROUTE_PATHS } from '../../core/constants/app-routes.constants';

export type PublicNavLink = {
  label: string;
  path: string;
};

export type PublicNavGroup = {
  id: string;
  label: string;
  links: PublicNavLink[];
};

export const PUBLIC_HEADER_NAV_GROUPS: PublicNavGroup[] = [
  {
    id: 'care',
    label: 'Care',
    links: [
      { label: 'Treatments', path: `/${ROUTE_PATHS.TREATMENTS}` },
      { label: 'Talk to our expert now', path: '/talk-to-provider' },
      { label: 'Chronic care', path: `/${ROUTE_PATHS.CHRONIC_CARE}` },
      { label: 'Our Experts', path: `/${ROUTE_PATHS.OUR_PROVIDERS}` },
    ],
  },
  {
    id: 'learn',
    label: 'Learn',
    links: [
      { label: 'Blog', path: `/${ROUTE_PATHS.BLOG}` },
      { label: 'Patient stories', path: `/${ROUTE_PATHS.TESTIMONIALS}` },
      { label: 'Why HopeHub works', path: `/${ROUTE_PATHS.WHY_SUCCESSFUL}` },
      { label: 'Safety', path: `/${ROUTE_PATHS.SAFETY}` },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    links: [
      { label: 'About us', path: `/${ROUTE_PATHS.ABOUT}` },
      { label: 'Careers', path: `/${ROUTE_PATHS.CAREERS}` },
      { label: 'Contact', path: `/${ROUTE_PATHS.CONTACT}` },
      { label: 'FAQ', path: `/${ROUTE_PATHS.FAQ}` },
    ],
  },
  // App download links are hidden for now. Keep /get-app route available for later relaunch.
  // {
  //   id: 'app',
  //   label: 'App',
  //   links: [{ label: 'Get the app', path: '/get-app' }],
  // },
];

export const PUBLIC_HEADER_QUICK_LINKS: PublicNavLink[] = PUBLIC_HEADER_NAV_GROUPS.flatMap(
  (group) => group.links,
);
