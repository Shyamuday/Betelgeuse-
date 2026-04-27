export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type User = {
  id: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  role: Role;
};

export type Disease = {
  id: string;
  name: string;
  description: string;
  feeInPaise: number;
  intakeQuestions: string[];
};

export type Payment = {
  id: string;
  amountInPaise: number;
  status: 'CREATED' | 'PAID' | 'FAILED';
  providerOrderId?: string | null;
};

export type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: User;
};

export type Prescription = {
  id: string;
  notes: string;
  fileUrl?: string | null;
  createdAt: string;
};

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
  intakeAnswers: Record<string, string>;
  createdAt: string;
  patient: User;
  assignedDoctor?: User | null;
  disease: Disease;
  payment?: Payment | null;
  messages: Message[];
  prescription?: Prescription | null;
};

export type Doctor = User & {
  isActive: boolean;
  doctorProfile?: {
    specialty: string;
    registrationNo?: string | null;
    isAvailable: boolean;
  };
};
