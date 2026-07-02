export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'doctor.approve': 'Doctor approved',
  'doctor.reject': 'Doctor rejected',
  'doctor.status_change': 'Doctor status changed',
  'doctor.create': 'Doctor created',
  'doctor.update': 'Doctor profile updated',
  'consultation.assign_doctor': 'Doctor assigned to consultation'
};

export function formatAuditAction(action: string) {
  return AUDIT_ACTION_LABELS[action] || action;
}
