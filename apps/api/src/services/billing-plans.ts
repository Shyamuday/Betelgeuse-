import { BillingPlanType } from '@prisma/client';
import { prisma } from '../db.js';

const defaultBillingPlans: Array<{
  code: string;
  name: string;
  description: string;
  planType: BillingPlanType;
  priceInPaise: number;
  consultationsLimit: number | null;
  sortOrder: number;
}> = [
  {
    code: 'ONE_TIME',
    name: 'One-Time Appointment',
    description: 'Single consultation with diagnosis, chat, and prescription follow-up.',
    planType: BillingPlanType.ONE_TIME_APPOINTMENT,
    priceInPaise: 150000,
    consultationsLimit: 1,
    sortOrder: 1
  },
  {
    code: 'STARTER_MONTHLY',
    name: 'Starter Monthly Plan',
    description: 'Monthly care plan with up to 3 consultations and follow-up support.',
    planType: BillingPlanType.STARTER_MONTHLY,
    priceInPaise: 350000,
    consultationsLimit: 3,
    sortOrder: 2
  },
  {
    code: 'CONTINUITY_QUARTERLY',
    name: 'Continuity Quarterly Plan',
    description: 'Quarterly continuity plan with up to 10 consultations and medicine adherence tracking.',
    planType: BillingPlanType.CONTINUITY_QUARTERLY,
    priceInPaise: 900000,
    consultationsLimit: 10,
    sortOrder: 3
  }
];

export async function ensureBillingPlans() {
  await Promise.all(
    defaultBillingPlans.map((plan) =>
      prisma.billingPlan.upsert({
        where: { code: plan.code },
        update: {
          name: plan.name,
          description: plan.description,
          planType: plan.planType,
          priceInPaise: plan.priceInPaise,
          consultationsLimit: plan.consultationsLimit,
          isActive: true,
          sortOrder: plan.sortOrder
        },
        create: plan
      })
    )
  );
}
