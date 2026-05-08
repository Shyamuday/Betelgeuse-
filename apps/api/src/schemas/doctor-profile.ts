import { z } from 'zod';

export const doctorProfileUpdateBody = z.object({
  name: z.string().min(2),
  mobile: z.string().min(8).optional().or(z.literal('')),
  specialty: z.string().min(2),
  registrationNo: z.string().max(120).optional().or(z.literal('')),
  isAvailable: z.boolean().optional().default(true),
  bio: z.string().max(8000).optional().or(z.literal('')),
  qualifications: z.string().max(4000).optional().or(z.literal('')),
  homoeopathyMethods: z.string().max(4000).optional().or(z.literal('')),
  clinicalFocus: z.string().max(4000).optional().or(z.literal('')),
  languagesSpoken: z.string().max(500).optional().or(z.literal('')),
  yearsExperience: z.number().int().min(0).max(80).optional().nullable(),
  stateCouncilName: z.string().max(200).optional().or(z.literal('')),
  stateCouncilRegNo: z.string().max(120).optional().or(z.literal(''))
});

export function emptyDoctorText(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }
  const t = value.trim();
  return t.length ? t : null;
}

export const doctorCredentialKindSchema = z.enum(['DEGREE', 'COUNCIL_REG', 'OTHER']);
