import { Role } from '@prisma/client';
import { RBAC_CAPABILITIES } from './rbac-matrix.constants.js';
import { STORE_ROLES } from './store-api-routes.constants.js';

export type PortalId = 'patient' | 'clinical' | 'operations';

export const ROLE_PORTAL: Record<Role, PortalId> = {
  PATIENT: 'patient',
  DOCTOR: 'clinical',
  ADMIN: 'operations',
  HR: 'operations',
  RECEPTIONIST: 'operations',
  CLINIC_MANAGER: 'operations',
  ACCOUNTANT: 'operations',
  BRANCH_OWNER: 'operations',
  PATIENT_COORDINATOR: 'operations',
  CALL_CENTER: 'operations',
  MARKETING: 'operations',
  SUPPLIER: 'operations',
  WAREHOUSE_MANAGER: 'operations',
  DELIVERY_EXECUTIVE: 'operations',
  DIAGNOSTIC_PARTNER: 'operations',
  CORPORATE_WELLNESS: 'operations',
  INSURANCE_PARTNER: 'operations'
};

/** Default landing route inside the operations portal (path segment, no leading slash). */
export const OPERATIONS_DEFAULT_ROUTE: Partial<Record<Role, string>> = {
  ADMIN: 'admin/dashboard',
  HR: 'dashboard',
  RECEPTIONIST: 'walk-in',
  CLINIC_MANAGER: 'clinic-dashboard',
  ACCOUNTANT: 'finance',
  BRANCH_OWNER: 'branch-dashboard',
  PATIENT_COORDINATOR: 'follow-ups',
  CALL_CENTER: 'patients',
  MARKETING: 'funnels',
  SUPPLIER: 'orders',
  WAREHOUSE_MANAGER: 'warehouse',
  DELIVERY_EXECUTIVE: 'partner-deliveries',
  DIAGNOSTIC_PARTNER: 'lab-referrals',
  CORPORATE_WELLNESS: 'accounts',
  INSURANCE_PARTNER: 'claims'
};

export const STORE_COUNTER_CAPABILITIES = ['store_counter.portal', 'store.stock'] as const;
export const STORE_MANAGER_CAPABILITIES = [
  'store_manager.portal',
  'store.stock',
  'store_counter.portal'
] as const;

export function capabilitiesForRole(role: Role): string[] {
  return RBAC_CAPABILITIES.filter((cap) => cap.roles.includes(role)).map((cap) => cap.id);
}

export function portalForRole(role: Role): PortalId {
  return ROLE_PORTAL[role] ?? 'operations';
}

export function defaultRouteForRole(role: Role): string {
  const portal = portalForRole(role);
  if (portal === 'clinical') return 'worklist';
  if (portal === 'patient') return 'dashboard';
  return OPERATIONS_DEFAULT_ROUTE[role] ?? 'dashboard';
}

export function sessionPayloadForUser(user: {
  id: string;
  role: Role;
  name: string;
  email?: string | null;
  mobile?: string | null;
  patientCode?: string | null;
}) {
  const capabilities = capabilitiesForRole(user.role);
  const portal = portalForRole(user.role);
  return {
    user,
    capabilities,
    portal,
    defaultRoute: defaultRouteForRole(user.role)
  };
}

export function sessionPayloadForStoreStaff(staff: {
  id: string;
  name: string;
  email?: string | null;
  role: string;
  staffCode: string;
  storeId: string;
  storeName: string;
}) {
  const isManager = staff.role === STORE_ROLES.MANAGER;
  const capabilities = isManager ? [...STORE_MANAGER_CAPABILITIES] : [...STORE_COUNTER_CAPABILITIES];
  return {
    user: {
      id: staff.id,
      name: staff.name,
      email: staff.email ?? '',
      role: isManager ? 'STORE_MANAGER' : 'STORE_STAFF'
    },
    capabilities,
    portal: 'operations' as const,
    defaultRoute: isManager ? 'store-manager/dashboard' : 'store/dashboard',
    storeStaff: staff
  };
}
