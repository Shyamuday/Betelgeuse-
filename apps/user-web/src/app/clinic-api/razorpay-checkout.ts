import './clinic-api.types';
import type { Consultation } from '../interfaces';
import { supabase } from '../supabase.client';
import {
  RAZORPAY_CHECKOUT_SCRIPT_URL,
  RAZORPAY_CHECKOUT_THEME_COLOR,
  VITALIS_CHECKOUT_MERCHANT_NAME
} from './clinic-api.constants';
import type { RazorpayCheckoutResponse, RazorpayOrderResponse } from './clinic-api.types';

export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = RAZORPAY_CHECKOUT_SCRIPT_URL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Razorpay Checkout.'));
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(
  consultation: Consultation,
  order: RazorpayOrderResponse
): Promise<RazorpayCheckoutResponse> {
  await loadRazorpayScript();

  const user = (await supabase.auth.getUser()).data.user;
  return new Promise<RazorpayCheckoutResponse>((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay checkout script failed to load.'));
      return;
    }

    const checkout = new window.Razorpay({
      key: order.razorpayKeyId,
      amount: order.amountInPaise,
      currency: order.currency,
      name: VITALIS_CHECKOUT_MERCHANT_NAME,
      description: consultation.disease.name,
      order_id: order.orderId,
      prefill: {
        name: consultation.patient.name,
        email: user?.email || '',
        contact: consultation.patient.mobile || ''
      },
      theme: {
        color: RAZORPAY_CHECKOUT_THEME_COLOR
      },
      handler: (response: RazorpayCheckoutResponse) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment was cancelled.'))
      }
    });

    checkout.open();
  });
}
