import type { User } from './user.interface';

export type ConsultationAttachmentKind = 'PATIENT_REPORT' | 'DOCTOR_CLINICAL' | 'OTHER';

export type ConsultationAttachment = {
  id: string;
  kind: ConsultationAttachmentKind;
  fileName?: string | null;
  mimeType?: string | null;
  caption?: string | null;
  fileUrl: string;
  createdAt: string;
  uploadedBy: User;
};
