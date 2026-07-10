import { SERVER_CONFIG } from '../constants/config.constants.js';
import { sendFast2SmsOtp } from './fast2sms.js';
import { storeOtpEntry, verifyOtpEntry } from './otp-store.js';

export const devOtp = SERVER_CONFIG.DEV_OTP;
export const isProduction = process.env.NODE_ENV === 'production';

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function storeOtp(mobile: string, otp: string): Promise<void> {
  await storeOtpEntry(mobile, otp);
}

export async function verifyOtp(mobile: string, otp: string): Promise<boolean> {
  return verifyOtpEntry(mobile, otp);
}

export async function sendOtpSms(mobile: string, otp: string): Promise<void> {
  await sendFast2SmsOtp(mobile, otp);
}
