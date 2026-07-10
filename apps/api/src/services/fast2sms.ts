const FAST2SMS_OTP_URL = 'https://www.fast2sms.com/dev/bulkV2';

type Fast2SmsOtpResponse = {
  return?: boolean;
  request_id?: string;
  message?: string[] | string;
};

export function normalizeFast2SmsMobile(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
}

export async function sendFast2SmsOtp(mobile: string, otp: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY || '';
  if (!apiKey) {
    console.info(`[otp] DEV — OTP for ${mobile}: ${otp}`);
    return;
  }

  const numbers = normalizeFast2SmsMobile(mobile);
  if (!numbers) {
    throw new Error('Valid mobile number is required for OTP SMS.');
  }

  const response = await fetch(FAST2SMS_OTP_URL, {
    method: 'POST',
    headers: {
      authorization: apiKey,
      accept: '*/*',
      'cache-control': 'no-cache',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      variables_values: otp,
      route: process.env.FAST2SMS_OTP_ROUTE || 'otp',
      numbers,
      flash: process.env.FAST2SMS_FLASH || '0'
    })
  });

  const payload = (await response.json().catch(() => null)) as Fast2SmsOtpResponse | null;
  if (!response.ok || payload?.return === false) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message || response.statusText;
    throw new Error(`Fast2SMS OTP failed: ${message}`);
  }
}
