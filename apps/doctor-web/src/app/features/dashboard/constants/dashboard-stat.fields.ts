import type { DetailFieldDef } from '@vitalis/platform-ui';

export type WorklistStatCounts = {
  assigned: number;
  inProgress: number;
  followUpDue: number;
};

export const WORKLIST_STAT_FIELDS: DetailFieldDef<WorklistStatCounts>[] = [
  { label: 'Assigned', getValue: (c) => c.assigned },
  { label: 'In progress', getValue: (c) => c.inProgress },
  { label: 'Follow-up due', getValue: (c) => c.followUpDue }
];

export type PaymentSummaryStats = {
  paidConsultations: number;
  grossInPaise: number;
  estimatedDoctorEarningsInPaise: number;
  doctorSharePercent: number;
};

function formatInr(paise: number) {
  return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

export const PAYMENT_SUMMARY_STAT_FIELDS: DetailFieldDef<PaymentSummaryStats>[] = [
  { label: 'Paid Consultations', getValue: (s) => s.paidConsultations },
  { label: 'Gross Revenue', getValue: (s) => formatInr(s.grossInPaise) },
  {
    label: 'Your Earnings',
    getLabel: (s) => `Your Earnings (${s.doctorSharePercent}%)`,
    getValue: (s) => formatInr(s.estimatedDoctorEarningsInPaise)
  }
];
