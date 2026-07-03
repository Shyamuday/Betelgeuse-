import { ConsultationStatus, PrescriptionStatus, type Consultation, type Prescription } from '@prisma/client';

export type WorklistView = 'ALL' | 'ASSIGNED' | 'IN_PROGRESS' | 'FOLLOW_UP_DUE';
export type WorklistSection = 'ASSIGNED' | 'IN_PROGRESS' | 'FOLLOW_UP_DUE';
export type FollowUpUrgency = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

type ConsultationWithPrescriptions = Consultation & {
  prescriptions?: Pick<Prescription, 'status' | 'followUpDate' | 'version' | 'createdAt'>[];
};

export function getPublishedPrescription(prescriptions: ConsultationWithPrescriptions['prescriptions']) {
  return prescriptions?.find((p) => p.status === PrescriptionStatus.PUBLISHED) ?? null;
}

export function publishedFollowUpDate(consultation: ConsultationWithPrescriptions) {
  return getPublishedPrescription(consultation.prescriptions)?.followUpDate ?? null;
}

export function isFollowUpDue(consultation: ConsultationWithPrescriptions, now = new Date()) {
  const followUpDate = publishedFollowUpDate(consultation);
  if (!followUpDate) {
    return false;
  }

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  return (
    new Date(followUpDate) <= endOfToday &&
    consultation.status !== ConsultationStatus.COMPLETED &&
    consultation.status !== ConsultationStatus.CANCELLED
  );
}

export function resolveFollowUpUrgency(
  followUpDate: Date | null | undefined,
  now = new Date()
): FollowUpUrgency | null {
  if (!followUpDate) {
    return null;
  }

  const due = new Date(followUpDate);
  if (due < now) {
    return 'OVERDUE';
  }

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  if (due <= endOfToday) {
    return 'DUE_TODAY';
  }

  return 'UPCOMING';
}

export function worklistSections(consultation: ConsultationWithPrescriptions): WorklistSection[] {
  const sections: WorklistSection[] = [];

  if (consultation.status === ConsultationStatus.ASSIGNED) {
    sections.push('ASSIGNED');
  }

  if (
    consultation.status === ConsultationStatus.IN_PROGRESS ||
    consultation.status === ConsultationStatus.PRESCRIPTION_UPLOADED
  ) {
    sections.push('IN_PROGRESS');
  }

  if (isFollowUpDue(consultation)) {
    sections.push('FOLLOW_UP_DUE');
  }

  return sections;
}

export function matchesWorklistSearch(
  consultation: ConsultationWithPrescriptions & {
    patient?: { id?: string; name?: string | null; mobile?: string | null; patientCode?: string | null } | null;
    disease?: { name?: string | null } | null;
  },
  query: string
) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }

  const haystack = [
    consultation.patient?.name || '',
    consultation.patient?.id || '',
    consultation.patient?.patientCode || '',
    consultation.patient?.mobile || '',
    consultation.disease?.name || '',
    consultation.status || ''
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

const urgencyRank: Record<string, number> = {
  OVERDUE: 0,
  DUE_TODAY: 1,
  UPCOMING: 2
};

export function compareWorklistItems<
  T extends { followUpUrgency: FollowUpUrgency | null; followUpDate: Date | null; createdAt: Date }
>(a: T, b: T) {
  const aRank = a.followUpUrgency ? urgencyRank[a.followUpUrgency] ?? 3 : 3;
  const bRank = b.followUpUrgency ? urgencyRank[b.followUpUrgency] ?? 3 : 3;
  if (aRank !== bRank) {
    return aRank - bRank;
  }

  if (a.followUpDate && b.followUpDate) {
    const diff = new Date(a.followUpDate).getTime() - new Date(b.followUpDate).getTime();
    if (diff !== 0) {
      return diff;
    }
  }

  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
