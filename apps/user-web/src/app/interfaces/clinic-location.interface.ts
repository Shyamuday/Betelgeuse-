export type ConsultationChannel = 'ONLINE_CHAT' | 'VIDEO' | 'PHONE' | 'IN_CLINIC';

export type ClinicLocation = {
  id: string;
  name: string;
  slug?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
  timezone?: string | null;
};

export const CONSULTATION_CHANNEL_LABELS: Record<ConsultationChannel, string> = {
  ONLINE_CHAT: 'Online (async chat)',
  VIDEO: 'Video consultation',
  PHONE: 'Phone consultation',
  IN_CLINIC: 'In-clinic visit'
};
