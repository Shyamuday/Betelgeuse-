import { defaultPatientExperience } from '../app/patient/patient-experience.types';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:4000',
  supabaseUrl: 'https://zjbesigagyoqfvouqsed.supabase.co',
  supabaseAnonKey: 'sb_publishable_xiRZ389iXVBa0Cf0jyj80w_BHyIxw4g',
  /** Vitalis Doctor web app base URL (shown to staff using the patient portal). */
  doctorPortalUrl: '',
  /** Patient-facing hero copy, WhatsApp, and which reminder channels are truly live. */
  patientExperience: defaultPatientExperience()
};
