export const ECOSYSTEM_ROLE_LABELS: Record<string, string> = {
  BRANCH_OWNER: 'Branch owner',
  PATIENT_COORDINATOR: 'Patient coordinator',
  CALL_CENTER: 'Call center',
  MARKETING: 'Marketing',
  CORPORATE_WELLNESS: 'Corporate wellness',
  INSURANCE_PARTNER: 'Insurance partner'
};

export const ECOSYSTEM_ROLE_OPTIONS = Object.entries(ECOSYSTEM_ROLE_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const PLATFORM_BROADCAST_ROLES = [
  'PATIENT',
  'DOCTOR',
  'ADMIN',
  'HR',
  'RECEPTIONIST',
  'CLINIC_MANAGER',
  'ACCOUNTANT',
  'SUPPLIER',
  'WAREHOUSE_MANAGER',
  'DELIVERY_EXECUTIVE',
  'DIAGNOSTIC_PARTNER',
  'BRANCH_OWNER',
  'PATIENT_COORDINATOR',
  'CALL_CENTER',
  'MARKETING',
  'CORPORATE_WELLNESS',
  'INSURANCE_PARTNER'
] as const;
