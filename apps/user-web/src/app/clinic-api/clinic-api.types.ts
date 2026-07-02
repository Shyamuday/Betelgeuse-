export type RazorpayOrderResponse = {
  orderId: string;
  amountInPaise: number;
  currency: string;
  razorpayKeyId: string;
};

export type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export interface RealtimeSubscription {
  unsubscribe(): void;
}
