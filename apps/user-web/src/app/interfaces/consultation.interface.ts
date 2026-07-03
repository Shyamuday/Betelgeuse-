import type { Payment } from './billing.interface';
import type { ClinicLocation, ConsultationChannel } from './clinic-location.interface';
import type { ConsultationAttachment } from './consultation-attachment.interface';
import type { Disease } from './disease.interface';
import type { Message } from './message.interface';
import type { Prescription } from './prescription.interface';
import type { User } from './user.interface';

export type Consultation = {
  id: string;
  status:
    | 'PAYMENT_PENDING'
    | 'PAID'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'PRESCRIPTION_UPLOADED'
    | 'COMPLETED'
    | 'CANCELLED';
  channel: ConsultationChannel;
  location?: ClinicLocation | null;
  intakeAnswers: Record<string, string>;
  createdAt: string;
  patient: User;
  assignedDoctor?: User | null;
  disease: Disease;
  billingPlanCode?: string | null;
  pricingSnapshot?: Record<string, unknown> | null;
  payment?: Payment | null;
  messages: Message[];
  prescription?: Prescription | null;
  prescriptions?: Prescription[];
  attachments?: ConsultationAttachment[];
};
