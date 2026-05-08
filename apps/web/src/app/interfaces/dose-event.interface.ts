import type { PrescriptionItem } from './prescription.interface';

export type DoseEvent = {
  id: string;
  /** Consultation this prescription belongs to (for linking chat while on medicines). */
  consultationId?: string;
  scheduledFor: string;
  status: 'PENDING' | 'TAKEN' | 'SKIPPED' | 'MISSED';
  note?: string | null;
  takenAt?: string | null;
  skippedAt?: string | null;
  prescriptionItem: PrescriptionItem;
};
