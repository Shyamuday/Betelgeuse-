export type ConsultationMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role?: string };
};

export type ConsultationSessionNote = {
  id: string;
  body: string;
  category?: string;
  createdAt: string;
  updatedAt?: string;
  author: { id: string; name: string; role?: string };
};

export type ConsultationAssessmentAttempt = {
  id: string;
  assessmentId: string;
  assessmentType: string;
  category?: string | null;
  title: string;
  totalScore: number;
  maxScore: number;
  level: string;
  color?: string | null;
  safetyFlag: boolean;
  retakeNumber: number;
  previousId?: string | null;
  completedAt: string;
};

export type ConsultationAssessmentSummary = {
  attempts: ConsultationAssessmentAttempt[];
  latest: ConsultationAssessmentAttempt[];
  safetyFlaggedCount: number;
};

export type DoctorConsultation = {
  id: string;
  status: string;
  intakeAnswers?: Record<string, string> | null;
  patient?: { id: string; name: string; patientCode?: string | null };
  disease?: { id: string; name: string; intakeQuestions?: string[] };
  messages?: ConsultationMessage[];
};
