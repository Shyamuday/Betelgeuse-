import type { PrescriptionItem } from './prescription.interface';

export type DoseEvent = {
  id: string;
  scheduledFor: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'MISSED';
  note?: string | null;
  takenAt?: string | null;
  skippedAt?: string | null;
  prescriptionItem: PrescriptionItem;
};
