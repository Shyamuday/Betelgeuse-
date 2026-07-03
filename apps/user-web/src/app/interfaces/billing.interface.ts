export type Payment = {
  id: string;
  amountInPaise: number;
  status: 'CREATED' | 'PAID' | 'FAILED';
  billingPlanCode?: string | null;
  lineItems?: Record<string, unknown> | null;
  providerOrderId?: string | null;
};

export type BillingPlan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  planType: 'ONE_TIME_APPOINTMENT' | 'STARTER_MONTHLY' | 'CONTINUITY_QUARTERLY';
  priceInPaise: number;
  consultationsLimit?: number | null;
};
