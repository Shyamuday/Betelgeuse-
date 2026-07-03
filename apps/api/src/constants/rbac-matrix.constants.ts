import { Role } from '@prisma/client';

export type RbacCapability = {
  id: string;
  label: string;
  description: string;
  roles: Role[];
};

export const RBAC_CAPABILITIES: RbacCapability[] = [
  {
    id: 'admin.dashboard',
    label: 'Platform dashboard',
    description: 'View cross-clinic KPIs and reports',
    roles: [Role.ADMIN]
  },
  {
    id: 'admin.doctors',
    label: 'Doctor onboarding',
    description: 'Approve, reject, and manage doctor accounts',
    roles: [Role.ADMIN]
  },
  {
    id: 'admin.consumers',
    label: 'Patient registry',
    description: 'Search and register patients platform-wide',
    roles: [Role.ADMIN, Role.HR, Role.RECEPTIONIST, Role.CLINIC_MANAGER]
  },
  {
    id: 'admin.consultations',
    label: 'Consultation ops',
    description: 'Assign doctors and override consultation status',
    roles: [Role.ADMIN, Role.RECEPTIONIST, Role.CLINIC_MANAGER]
  },
  {
    id: 'admin.finance',
    label: 'Finance & payroll',
    description: 'Revenue, expenses, outstanding payments, payslips',
    roles: [Role.ADMIN, Role.ACCOUNTANT]
  },
  {
    id: 'admin.inventory',
    label: 'Inventory oversight',
    description: 'View stock levels across branches and warehouses',
    roles: [Role.ADMIN, Role.WAREHOUSE_MANAGER]
  },
  {
    id: 'admin.catalog',
    label: 'Medicine & supplier catalog',
    description: 'Manage global medicines and suppliers',
    roles: [Role.ADMIN]
  },
  {
    id: 'admin.purchase_orders',
    label: 'Purchase orders',
    description: 'Create and track supplier purchase orders',
    roles: [Role.ADMIN, Role.WAREHOUSE_MANAGER]
  },
  {
    id: 'admin.audit',
    label: 'Audit trail',
    description: 'View and export admin action logs',
    roles: [Role.ADMIN]
  },
  {
    id: 'admin.audit_purge',
    label: 'Audit retention purge',
    description: 'Delete audit logs older than retention window',
    roles: [Role.ADMIN]
  },
  {
    id: 'admin.notifications',
    label: 'Notification broadcast',
    description: 'Manage templates and send platform broadcasts',
    roles: [Role.ADMIN]
  },
  {
    id: 'admin.users',
    label: 'Admin user management',
    description: 'Create and deactivate platform admin accounts',
    roles: [Role.ADMIN]
  },
  {
    id: 'store.stock',
    label: 'Branch stock operations',
    description: 'Add, remove, and adjust medicine stock at a store',
    roles: [Role.WAREHOUSE_MANAGER]
  },
  {
    id: 'doctor.consult',
    label: 'Doctor consultations',
    description: 'Conduct consultations and prescribe',
    roles: [Role.DOCTOR]
  },
  {
    id: 'patient.app',
    label: 'Patient mobile app',
    description: 'Book consultations, chat, and dose reminders',
    roles: [Role.PATIENT]
  },
  {
    id: 'supplier.portal',
    label: 'Supplier portal',
    description: 'Fulfill purchase orders and update dispatch',
    roles: [Role.SUPPLIER]
  },
  {
    id: 'delivery.ops',
    label: 'Medicine delivery',
    description: 'Assign and complete medicine deliveries',
    roles: [Role.DELIVERY_EXECUTIVE]
  },
  {
    id: 'diagnostic.portal',
    label: 'Diagnostic partner portal',
    description: 'Receive and update lab referral status',
    roles: [Role.DIAGNOSTIC_PARTNER]
  }
];

export const RBAC_ROLES = Object.values(Role);
