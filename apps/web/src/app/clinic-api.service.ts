import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { AUTH_TOKEN_KEY } from './core/constants/auth.constants';
import { API_PATHS } from './core/constants/api-paths.constants';
import { DEFAULT_SNOOZE_MINUTES } from './core/constants/timing.constants';
import { RAZORPAY_CHECKOUT } from './core/constants/branding.constants';
import { SOCKET_EVENTS, SOCKET_TRANSPORTS } from './core/constants/socket.constants';
import { environment } from '../environments/environment';
import { BillingPlan, Consultation, Disease, Doctor, DoseEvent, Payment, Prescription } from './models';

type RazorpayOrderResponse = {
  orderId: string;
  amountInPaise: number;
  currency: string;
  razorpayKeyId: string;
};

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export interface RealtimeSubscription {
  unsubscribe(): void;
}

@Injectable({ providedIn: 'root' })
export class ClinicApiService {
  diseases() {
    return from(this.fetchDiseases());
  }

  consultations() {
    return from(this.fetchConsultations());
  }

  createConsultation(payload: {
    diseaseId: string;
    intakeAnswers: Record<string, string>;
    purchaseType?: 'ONE_TIME' | 'PLAN';
    planCode?: string;
  }) {
    return from(this.apiFetch(API_PATHS.CONSULTATIONS, {
      method: 'POST',
      body: JSON.stringify(payload)
    }));
  }

  billingPlans() {
    return from(this.apiFetch<{ plans: BillingPlan[] }>(API_PATHS.BILLING_PLANS));
  }

  createPaymentOrder(consultationId: string) {
    return from(this.apiFetch<RazorpayOrderResponse>(API_PATHS.PAYMENTS.CREATE_ORDER(consultationId), {
      method: 'POST',
      body: JSON.stringify({})
    }));
  }

  verifyPayment(consultationId: string, payment: RazorpayCheckoutResponse) {
    return from(this.apiFetch(API_PATHS.PAYMENTS.VERIFY(consultationId), {
      method: 'POST',
      body: JSON.stringify({
        razorpayOrderId: payment.razorpay_order_id,
        razorpayPaymentId: payment.razorpay_payment_id,
        razorpaySignature: payment.razorpay_signature
      })
    }));
  }

  sendMessage(consultationId: string, body: string) {
    return from(this.apiFetch(`/consultations/${consultationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body })
    }));
  }

  completeConsultation(consultationId: string) {
    return from(this.apiFetch(`/consultations/${consultationId}/complete`, { method: 'POST' }));
  }

  uploadPrescription(consultationId: string, payload: { notes: string; fileUrl?: string }) {
    return from(this.apiFetch(`/consultations/${consultationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        body: `[Prescription Notes]\n${payload.notes}${payload.fileUrl ? `\nFile: ${payload.fileUrl}` : ''}`
      })
    }));
  }

  doctors() {
    return from(this.apiFetch<{ doctors: Doctor[] }>(API_PATHS.ADMIN.DOCTORS));
  }

  createDoctor(payload: {
    name: string;
    email: string;
    mobile?: string;
    password: string;
    specialty: string;
    registrationNo?: string;
  }) {
    return from(this.apiFetch(API_PATHS.ADMIN.DOCTORS, {
      method: 'POST',
      body: JSON.stringify(payload)
    }));
  }

  assignDoctor(consultationId: string, doctorId: string) {
    return from(this.apiFetch(`/consultations/${consultationId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ doctorId })
    }));
  }

  reports() {
    return from(this.apiFetch<{ revenueInPaise: number; activeDoctors: number; consultations: unknown[] }>(API_PATHS.ADMIN.REPORTS));
  }

  patientPrescriptions() {
    return from(this.fetchPatientPrescriptions());
  }

  todayDoseEvents() {
    return from(this.fetchTodayDoseEvents());
  }

  markDoseTaken(doseEventId: string) {
    return from(this.apiFetch(API_PATHS.PATIENT.DOSE_TAKE(doseEventId), { method: 'POST' }));
  }

  skipDose(doseEventId: string, note?: string) {
    return from(this.apiFetch(API_PATHS.PATIENT.DOSE_SKIP(doseEventId), {
      method: 'POST',
      body: JSON.stringify(note ? { note } : {})
    }));
  }

  snoozeDose(doseEventId: string, minutes = DEFAULT_SNOOZE_MINUTES) {
    return from(this.apiFetch(API_PATHS.PATIENT.DOSE_SNOOZE(doseEventId), {
      method: 'POST',
      body: JSON.stringify({ minutes })
    }));
  }

  reminderPreferences() {
    return from(this.apiFetch<{
      preferences: {
        inApp: boolean;
        sms: boolean;
        whatsapp: boolean;
        push: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
      };
    }>(API_PATHS.PATIENT.REMINDER_PREFERENCES));
  }

  saveReminderPreferences(preferences: {
    inApp: boolean;
    sms: boolean;
    whatsapp: boolean;
    push: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  }) {
    return from(this.apiFetch(API_PATHS.PATIENT.REMINDER_PREFERENCES, {
      method: 'PUT',
      body: JSON.stringify(preferences)
    }));
  }

  watchClinicChanges(onChange: () => void): RealtimeSubscription {
    const token = this.backendToken;
    const socket: Socket = io(environment.apiUrl, {
      auth: { token },
      transports: [...SOCKET_TRANSPORTS]
    });

    socket.on('consultation:updated', onChange);
    socket.on('message:new', onChange);
    socket.on('prescription:new', onChange);
    socket.on('payment:updated', onChange);

    return { unsubscribe: () => socket.disconnect() };
  }

  subscribeToConsultation(socket: Socket, consultationId: string) {
    socket.emit(SOCKET_EVENTS.SUBSCRIBE_CONSULTATION, consultationId);
  }

  async openRazorpayCheckout(consultation: Consultation, order: RazorpayOrderResponse) {
    await this.loadRazorpayScript();

    return new Promise<RazorpayCheckoutResponse>((resolve, reject) => {
      if (!window.Razorpay) {
        reject(new Error('Razorpay checkout script failed to load.'));
        return;
      }

      const checkout = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amountInPaise,
        currency: order.currency,
        name: RAZORPAY_CHECKOUT.NAME,
        description: consultation.disease.name,
        order_id: order.orderId,
        prefill: {
          name: consultation.patient.name,
          contact: consultation.patient.mobile || ''
        },
        theme: { color: RAZORPAY_CHECKOUT.THEME_COLOR },
        handler: (response: RazorpayCheckoutResponse) => resolve(response),
        modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) }
      });

      checkout.open();
    });
  }

  private get backendToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY) || '';
  }

  private async apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
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

  private async fetchDiseases() {
    const response = await this.apiFetch<{ diseases: Array<Record<string, unknown>> }>('/diseases');
    return { diseases: (response.diseases || []).map((row) => this.toDiseaseFromApi(row)) };
  }

  private async fetchConsultations() {
    if (!this.backendToken) {
      throw new Error('Backend session missing. Please login again.');
    }

    const response = await this.apiFetch<{ consultations: Array<Record<string, unknown>> }>(API_PATHS.CONSULTATIONS);
    return { consultations: (response.consultations || []).map((row) => this.toConsultationFromApi(row)) };
  }

  private async fetchPatientPrescriptions() {
    if (!this.backendToken) {
      throw new Error('Backend session missing. Please login again.');
    }

    const response = await this.apiFetch<{ prescriptions: Array<Record<string, unknown>> }>(API_PATHS.PATIENT.PRESCRIPTIONS);
    return { prescriptions: (response.prescriptions || []).map((row) => this.toPatientPrescriptionFromApi(row)) };
  }

  private async fetchTodayDoseEvents() {
    if (!this.backendToken) {
      throw new Error('Backend session missing. Please login again.');
    }

    const response = await this.apiFetch<{ doses: Array<Record<string, unknown>> }>(API_PATHS.PATIENT.TODAY_DOSES);
    return { doseEvents: (response.doses || []).map((row) => this.toDoseEventFromApi(row)) };
  }

  private loadRazorpayScript() {
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

  private toDiseaseFromApi(row: Record<string, unknown>): Disease {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      description: row['description'] as string,
      feeInPaise: row['feeInPaise'] as number,
      intakeQuestions: (row['intakeQuestions'] as string[]) || []
    };
  }

  private toPatientPrescriptionFromApi(row: Record<string, unknown>): Prescription {
    return {
      id: row['id'] as string,
      version: row['version'] as number,
      diagnosis: row['diagnosis'] as string,
      advice: row['advice'] as string | undefined,
      notes: (row['notes'] as string) || '',
      fileUrl: row['fileUrl'] as string | undefined,
      status: row['status'] as Prescription['status'],
      followUpDate: row['followUpDate'] as string | undefined,
      method: (row['methodOption'] as Record<string, unknown> | null)?.['label'] as string | null ?? null,
      diagnosedDisease: (row['diagnosedDiseaseOption'] as Record<string, unknown> | null)?.['label'] as string | null ?? null,
      items: ((row['items'] as Array<Record<string, unknown>>) || []).map((item) => ({
        id: item['id'] as string,
        medicineName: item['medicineName'] as string,
        strength: item['strength'] as string | undefined,
        dose: item['dose'] as string | undefined,
        frequency: item['frequency'] as string | undefined,
        duration: item['duration'] as string | undefined,
        instructions: item['instructions'] as string | undefined
      })),
      createdAt: row['createdAt'] as string
    };
  }

  private toDoseEventFromApi(row: Record<string, unknown>): DoseEvent {
    const item = row['prescriptionItem'] as Record<string, unknown> | null;
    return {
      id: row['id'] as string,
      scheduledFor: row['scheduledFor'] as string,
      status: row['status'] as DoseEvent['status'],
      note: row['note'] as string | undefined,
      takenAt: row['takenAt'] as string | undefined,
      skippedAt: row['skippedAt'] as string | undefined,
      prescriptionItem: {
        id: item?.['id'] as string || '',
        medicineName: item?.['medicineName'] as string || 'Medicine',
        strength: item?.['strength'] as string | undefined,
        dose: item?.['dose'] as string | undefined,
        frequency: item?.['frequency'] as string | undefined,
        duration: item?.['duration'] as string | undefined,
        instructions: item?.['instructions'] as string | undefined
      }
    };
  }

  private toConsultationFromApi(row: Record<string, unknown>): Consultation {
    const prescriptions = (row['prescriptions'] as Array<Record<string, unknown>>) || [];
    const latestPrescription = prescriptions[0] || null;

    return {
      id: row['id'] as string,
      status: row['status'] as Consultation['status'],
      intakeAnswers: (row['intakeAnswers'] as Record<string, string>) || {},
      createdAt: row['createdAt'] as string,
      patient: row['patient'] as Consultation['patient'],
      assignedDoctor: (row['assignedDoctor'] as Consultation['assignedDoctor']) || null,
      disease: row['disease'] as Consultation['disease'],
      billingPlanCode: (row['billingPlanCode'] as string | null) || null,
      pricingSnapshot: (row['pricingSnapshot'] as Record<string, unknown> | null) || null,
      payment: row['payment']
        ? {
            id: (row['payment'] as Record<string, unknown>)['id'] as string,
            amountInPaise: (row['payment'] as Record<string, unknown>)['amountInPaise'] as number,
            status: (row['payment'] as Record<string, unknown>)['status'] as Payment['status'],
            billingPlanCode: ((row['payment'] as Record<string, unknown>)['billingPlanCode'] as string | null) || null,
            lineItems: ((row['payment'] as Record<string, unknown>)['lineItems'] as Record<string, unknown> | null) || null,
            providerOrderId: ((row['payment'] as Record<string, unknown>)['providerOrderId'] as string | null) || null
          }
        : null,
      messages: (row['messages'] as Consultation['messages']) || [],
      prescription: latestPrescription
        ? {
            id: latestPrescription['id'] as string,
            notes: latestPrescription['notes'] as string,
            fileUrl: latestPrescription['fileUrl'] as string | undefined,
            createdAt: latestPrescription['createdAt'] as string
          }
        : null,
      prescriptions: prescriptions.map((p) => ({
        id: p['id'] as string,
        version: p['version'] as number,
        diagnosis: p['diagnosis'] as string,
        notes: p['notes'] as string,
        fileUrl: p['fileUrl'] as string | undefined,
        createdAt: p['createdAt'] as string
      }))
    };
  }
}
