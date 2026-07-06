import type { DetailFieldDef } from './detail-rows.types';

export type PatientClinicalProfile = {
  allergies?: string | null;
  currentMedications?: string | null;
  chronicConditions?: string | null;
};

export const PATIENT_CLINICAL_PROFILE_FIELDS: DetailFieldDef<PatientClinicalProfile>[] = [
  {
    label: 'Allergies',
    getValue: (p) => p.allergies?.trim() || 'None reported',
    highlight: (p) => Boolean(p.allergies?.trim())
  },
  {
    label: 'Current medications',
    getValue: (p) => p.currentMedications?.trim() || 'None reported'
  },
  {
    label: 'Chronic conditions',
    getValue: (p) => p.chronicConditions?.trim() || 'None reported'
  }
];

export function patientClinicalProfileHasData(profile: PatientClinicalProfile): boolean {
  return Boolean(
    profile.allergies?.trim() ||
      profile.currentMedications?.trim() ||
      profile.chronicConditions?.trim()
  );
}
