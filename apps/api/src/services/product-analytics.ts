import { ProductEventCategory, Role } from '@prisma/client';
import { prisma } from '../db.js';

export const PRODUCT_EVENTS = {
  PATIENT_LOGIN: 'patient.login',
  CONSULTATION_BOOKED: 'consultation.booked',
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_COMPLETED: 'payment.completed',
  CONSULTATION_ASSIGNED: 'consultation.assigned',
  PRESCRIPTION_PUBLISHED: 'prescription.published',
  DOSE_TAKEN: 'dose.taken',
  DOCTOR_LOGIN: 'doctor.login',
  DOCTOR_WORKLIST_VIEWED: 'doctor.worklist_viewed',
  PAYMENT_CHECKOUT_OPENED: 'payment.checkout_opened'
} as const;

export const PATIENT_FUNNEL_STEPS = [
  { key: PRODUCT_EVENTS.CONSULTATION_BOOKED, label: 'Consultation booked' },
  { key: PRODUCT_EVENTS.PAYMENT_INITIATED, label: 'Payment initiated' },
  { key: PRODUCT_EVENTS.PAYMENT_COMPLETED, label: 'Payment completed' },
  { key: PRODUCT_EVENTS.CONSULTATION_ASSIGNED, label: 'Doctor assigned' },
  { key: PRODUCT_EVENTS.PRESCRIPTION_PUBLISHED, label: 'Prescription published' },
  { key: PRODUCT_EVENTS.DOSE_TAKEN, label: 'First dose taken' }
] as const;

export async function trackProductEvent(input: {
  name: string;
  category?: ProductEventCategory;
  actorId?: string | null;
  actorRole?: Role | null;
  sessionId?: string | null;
  properties?: Record<string, unknown>;
}) {
  try {
    await prisma.productEvent.create({
      data: {
        name: input.name,
        category: input.category ?? ProductEventCategory.FUNNEL,
        actorId: input.actorId ?? null,
        actorRole: input.actorRole ?? null,
        sessionId: input.sessionId ?? null,
        properties: input.properties ?? undefined
      }
    });
  } catch (error) {
    console.warn('[analytics] failed to track event', input.name, error);
  }
}

export async function buildProductFunnelReport(days: number) {
  const windowDays = Math.min(90, Math.max(7, days));
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (windowDays - 1));
  start.setHours(0, 0, 0, 0);

  const eventNames = [
    PRODUCT_EVENTS.PATIENT_LOGIN,
    ...PATIENT_FUNNEL_STEPS.map((step) => step.key),
    PRODUCT_EVENTS.DOCTOR_WORKLIST_VIEWED
  ];

  const events = await prisma.productEvent.findMany({
    where: {
      name: { in: eventNames },
      createdAt: { gte: start, lte: end }
    },
    select: { name: true, createdAt: true, actorId: true }
  });

  const counts = new Map<string, number>();
  const uniqueActors = new Map<string, Set<string>>();
  const daily = new Map<string, Map<string, number>>();

  for (const name of eventNames) {
    counts.set(name, 0);
    uniqueActors.set(name, new Set());
  }

  for (const event of events) {
    counts.set(event.name, (counts.get(event.name) ?? 0) + 1);
    if (event.actorId) {
      uniqueActors.get(event.name)?.add(event.actorId);
    }
    const dayKey = event.createdAt.toISOString().slice(0, 10);
    if (!daily.has(dayKey)) daily.set(dayKey, new Map());
    const dayMap = daily.get(dayKey)!;
    dayMap.set(event.name, (dayMap.get(event.name) ?? 0) + 1);
  }

  const funnel = PATIENT_FUNNEL_STEPS.map((step, index) => {
    const total = counts.get(step.key) ?? 0;
    const unique = uniqueActors.get(step.key)?.size ?? 0;
    const firstTotal = counts.get(PATIENT_FUNNEL_STEPS[0].key) ?? 0;
    const prevTotal = index === 0 ? total : counts.get(PATIENT_FUNNEL_STEPS[index - 1].key) ?? 0;
    return {
      key: step.key,
      label: step.label,
      total,
      uniqueActors: unique,
      conversionFromStart: firstTotal ? Math.round((total / firstTotal) * 100) : 0,
      conversionFromPrevious: prevTotal ? Math.round((total / prevTotal) * 100) : index === 0 ? 100 : 0
    };
  });

  const dailyTrend = Array.from(daily.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayCounts]) => ({
      date,
      consultationBooked: dayCounts.get(PRODUCT_EVENTS.CONSULTATION_BOOKED) ?? 0,
      paymentCompleted: dayCounts.get(PRODUCT_EVENTS.PAYMENT_COMPLETED) ?? 0,
      prescriptionPublished: dayCounts.get(PRODUCT_EVENTS.PRESCRIPTION_PUBLISHED) ?? 0,
      doseTaken: dayCounts.get(PRODUCT_EVENTS.DOSE_TAKEN) ?? 0
    }));

  return {
    windowDays,
    summary: {
      patientLogins: counts.get(PRODUCT_EVENTS.PATIENT_LOGIN) ?? 0,
      consultationsBooked: counts.get(PRODUCT_EVENTS.CONSULTATION_BOOKED) ?? 0,
      paymentsCompleted: counts.get(PRODUCT_EVENTS.PAYMENT_COMPLETED) ?? 0,
      prescriptionsPublished: counts.get(PRODUCT_EVENTS.PRESCRIPTION_PUBLISHED) ?? 0,
      dosesTaken: counts.get(PRODUCT_EVENTS.DOSE_TAKEN) ?? 0,
      doctorWorklistViews: counts.get(PRODUCT_EVENTS.DOCTOR_WORKLIST_VIEWED) ?? 0
    },
    funnel,
    dailyTrend
  };
}
