import { OAuth2Client } from 'google-auth-library';
import { createNotificationService, type NotificationChannel } from '../notifications.js';

export const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:4200';
export const devOtp = process.env.DEV_OTP || '123456';
export const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
export const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
export const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
export const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
export const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
export const doseOverdueSweepEnabled =
  (process.env.DOSE_OVERDUE_SWEEP_ENABLED || 'true').toLowerCase() !== 'false';
export const doseOverdueSweepIntervalMs = Math.max(
  60_000,
  Number(process.env.DOSE_OVERDUE_SWEEP_INTERVAL_MS || 5 * 60_000)
);
export const doseReminderSweepEnabled =
  (process.env.DOSE_REMINDER_SWEEP_ENABLED || 'true').toLowerCase() !== 'false';
export const doseReminderWindowMinutes = Math.max(5, Number(process.env.DOSE_REMINDER_WINDOW_MINUTES || 30));

export const enabledNotificationChannels = (process.env.NOTIFICATION_CHANNELS || 'IN_APP')
  .split(',')
  .map((value) => value.trim().toUpperCase())
  .filter(Boolean) as NotificationChannel[];

export const notificationService = createNotificationService(enabledNotificationChannels);

export type ReminderPreference = {
  inApp: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

export const defaultReminderPreference: ReminderPreference = {
  inApp: true,
  sms: true,
  whatsapp: false,
  push: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00'
};

export function apiPublicBaseUrl() {
  const port = Number(process.env.PORT || 4000);
  return (process.env.API_PUBLIC_URL || `http://localhost:${port}`).replace(/\/$/, '');
}
