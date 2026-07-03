import { DoseEventStatus } from '@prisma/client';

export function isSystemDoseNote(note: string | null | undefined) {
  return Boolean(note?.startsWith('Snoozed by'));
}

export function isPatientProvidedDoseNote(note: string | null | undefined) {
  if (!note) {
    return false;
  }
  return !isSystemDoseNote(note);
}

export function doseNeedsPatientReason(status: DoseEventStatus, note: string | null | undefined) {
  if (status === DoseEventStatus.MISSED) {
    return !isPatientProvidedDoseNote(note);
  }
  if (status === DoseEventStatus.SKIPPED) {
    return !note;
  }
  return false;
}

export const DOSE_SKIP_REASONS = [
  'Forgot to take',
  'Side effects',
  'Not at home',
  'Ran out of medicine',
  'Doctor advised to pause'
] as const;

export const DOSE_MISSED_REASONS = [
  'Forgot to take',
  'Was travelling',
  'Felt unwell',
  'Could not find medicine',
  'Phone was off / no reminder'
] as const;
