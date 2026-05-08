import {
  mapConsultationFromSupabaseRow,
  mapDiseaseFromSupabaseRow,
  mapUserFromSupabaseProfile
} from '../clinic-api-mappers';
import type { Consultation, Doctor } from '../interfaces';
import { supabase } from '../supabase.client';

export async function supabaseFetchDiseases() {
  const { data, error } = await supabase
    .from('diseases')
    .select('*')
    .eq('is_active', true)
    .order('fee_in_paise');

  if (error) {
    throw error;
  }

  return { diseases: (data || []).map((row) => mapDiseaseFromSupabaseRow(row as Record<string, unknown>)) };
}

export async function supabaseFetchConsultations() {
  const { data, error } = await supabase
    .from('consultations')
    .select(
      `
          *,
          disease:diseases(*),
          patient:profiles!consultations_patient_id_fkey(*),
          assigned_doctor:profiles!consultations_assigned_doctor_id_fkey(*),
          payment:payments(*),
          messages(*, sender:profiles!messages_sender_id_fkey(*)),
          prescription:prescriptions(*)
        `
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return {
    consultations: (data || []).map((row) => mapConsultationFromSupabaseRow(row as Record<string, unknown>))
  };
}

export async function supabaseInsertConsultation(payload: { diseaseId: string; intakeAnswers: Record<string, string> }) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Login required.');
  }

  const { data: disease, error: diseaseError } = await supabase.from('diseases').select('*').eq('id', payload.diseaseId).single();

  if (diseaseError) {
    throw diseaseError;
  }

  const { data: consultation, error } = await supabase
    .from('consultations')
    .insert({
      patient_id: user.id,
      disease_id: payload.diseaseId,
      intake_answers: payload.intakeAnswers
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  const { error: paymentError } = await supabase.from('payments').insert({
    consultation_id: consultation.id,
    amount_in_paise: disease.fee_in_paise,
    status: 'CREATED'
  });

  if (paymentError) {
    throw paymentError;
  }

  return { consultation };
}

export async function supabaseMarkPaymentPaid(consultationId: string) {
  const providerPaymentId = `pay_dev_${Date.now()}`;
  const { error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'PAID', provider_payment_id: providerPaymentId })
    .eq('consultation_id', consultationId);

  if (paymentError) {
    throw paymentError;
  }

  const { error: consultationError } = await supabase.from('consultations').update({ status: 'PAID' }).eq('id', consultationId);

  if (consultationError) {
    throw consultationError;
  }

  return { consultation: { id: consultationId } as Consultation };
}

export async function supabaseInsertMessage(consultationId: string, body: string) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Login required.');
  }

  const { error } = await supabase.from('messages').insert({
    consultation_id: consultationId,
    sender_id: user.id,
    body
  });

  if (error) {
    throw error;
  }

  return { ok: true as const };
}

export async function supabaseUpsertLegacyPrescription(consultationId: string, payload: { notes: string; fileUrl?: string }) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Login required.');
  }

  const { error } = await supabase.from('prescriptions').upsert({
    consultation_id: consultationId,
    uploaded_by_id: user.id,
    notes: payload.notes,
    file_url: payload.fileUrl || null
  });

  if (error) {
    throw error;
  }

  return { ok: true as const };
}

export async function supabaseUpdateConsultationStatus(consultationId: string, status: Consultation['status']) {
  const { error } = await supabase.from('consultations').update({ status }).eq('id', consultationId);
  if (error) {
    throw error;
  }

  return { ok: true as const };
}

export async function supabaseFetchDoctors() {
  const { data, error } = await supabase.from('doctors').select('*, profile:profiles(*)').order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return {
    doctors: (data || []).map((row): Doctor => ({
      ...mapUserFromSupabaseProfile(row.profile as Record<string, unknown> | null),
      isActive: row.profile?.is_active ?? true,
      doctorProfile: {
        specialty: row.specialty,
        registrationNo: row.registration_no,
        isAvailable: row.is_available
      }
    }))
  };
}

export async function supabaseAssignDoctor(consultationId: string, doctorId: string) {
  const { error } = await supabase
    .from('consultations')
    .update({ assigned_doctor_id: doctorId, status: 'ASSIGNED' })
    .eq('id', consultationId);

  if (error) {
    throw error;
  }

  return { ok: true as const };
}

export async function supabaseFetchReportsAggregate() {
  const [{ consultations }, { doctors }] = await Promise.all([supabaseFetchConsultations(), supabaseFetchDoctors()]);
  const revenueInPaise = consultations
    .filter((consultation) => consultation.payment?.status === 'PAID')
    .reduce((total, consultation) => total + (consultation.payment?.amountInPaise || 0), 0);

  return {
    revenueInPaise,
    activeDoctors: doctors.filter((doctor) => doctor.isActive).length,
    consultations
  };
}
