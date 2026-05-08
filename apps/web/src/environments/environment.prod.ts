import { defaultPatientExperience } from '../app/patient/patient-experience.types';

export const environment = {
  production: true,
  apiUrl: 'https://YOUR_API_DOMAIN',
  supabaseUrl: 'https://zjbesigagyoqfvouqsed.supabase.co',
  supabaseAnonKey: 'sb_publishable_xiRZ389iXVBa0Cf0jyj80w_BHyIxw4g',
  doctorPortalUrl: 'https://YOUR_DOCTOR_WEB_DOMAIN',
  patientExperience: {
    ...defaultPatientExperience(),
    // Replace with your public WhatsApp-enabled number (digits only, country code included).
    whatsappE164: '919876543210',
    reminderChannelsLive: {
      inApp: true,
      sms: false,
      whatsapp: false,
      push: false
    }
  }
};
