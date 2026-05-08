export type PatientDashboardHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  feeNote: string;
};

export type PatientReminderChannelsLive = {
  inApp: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
};

export type PatientExperienceConfig = {
  whatsappE164: string;
  whatsappMessage: string;
  dashboardHero: PatientDashboardHero;
  reminderChannelsLive: PatientReminderChannelsLive;
};

export const defaultPatientExperience = (): PatientExperienceConfig => ({
  whatsappE164: '919876543210',
  whatsappMessage: 'Hi Vitalis Care and Research Centre, I need help with my consultation.',
  dashboardHero: {
    eyebrow: 'Your care at Vitalis',
    title: 'Consultations and follow-up',
    subtitle:
      'Book a consultation, message your doctor, and track medicines in one place. Self-assessment worksheets can prefill notes when you book.',
    feeNote: 'Fee shown at payment'
  },
  reminderChannelsLive: {
    inApp: true,
    sms: false,
    whatsapp: false,
    push: false
  }
});
