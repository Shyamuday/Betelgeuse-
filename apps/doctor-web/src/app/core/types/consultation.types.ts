export type ConsultationMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role?: string };
};

export type DoctorConsultation = {
  id: string;
  status: string;
  intakeAnswers?: Record<string, string> | null;
  patient?: { id: string; name: string; patientCode?: string | null };
  disease?: { id: string; name: string; intakeQuestions?: string[] };
  messages?: ConsultationMessage[];
};
