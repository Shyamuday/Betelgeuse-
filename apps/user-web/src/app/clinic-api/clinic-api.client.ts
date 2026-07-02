import { AUTH_TOKEN_KEY } from '../core/constants/auth.constants';
import { RAZORPAY_CHECKOUT } from '../core/constants/branding.constants';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export class ClinicApiClient {
  get backendToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
  }

  async apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${environment.apiUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(this.backendToken ? { Authorization: `Bearer ${this.backendToken}` } : {}),
        ...(init?.headers || {})
      }
    });

    if (!response.ok) {
      let message = 'Request failed.';
      try {
        message = (await response.json())?.message || message;
      } catch {
        // no-op
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  }

  loadRazorpayScript() {
    if (window.Razorpay) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = RAZORPAY_CHECKOUT.SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
      document.body.appendChild(script);
    });
  }
}
