const STORAGE_KEY = 'vitalis_worksheet_booking_draft_v1';

/** Merges into consultation `intakeAnswers` when the patient books from the dashboard. */
export const SELF_ASSESSMENT_WORKSHEET_INTAKE_KEY = 'Self-assessment worksheet notes';

export type WorksheetBookingDraft = {
  toolKey: string;
  toolLabel: string;
  summaryText: string;
  savedAt: string;
};

export function persistWorksheetBookingDraft(draft: Omit<WorksheetBookingDraft, 'savedAt'>): void {
  const full: WorksheetBookingDraft = { ...draft, savedAt: new Date().toISOString() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    /* storage full or unavailable */
  }
}

export function readWorksheetBookingDraft(): WorksheetBookingDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorksheetBookingDraft;
    if (
      parsed &&
      typeof parsed.summaryText === 'string' &&
      typeof parsed.toolKey === 'string' &&
      typeof parsed.toolLabel === 'string'
    ) {
      return parsed;
    }
  } catch {
    /* invalid */
  }
  return null;
}

export function clearWorksheetBookingDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Human-readable lines for the booking form from saved worksheet field keys. */
export function worksheetAnswersToSummaryText(answers: Record<string, string>): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(answers)) {
    const t = (v || '').trim();
    if (!t) continue;
    const hdr = k.replaceAll('_', ' ').trim();
    lines.push(`${hdr}: ${t}`);
  }
  const s = lines.join('\n');
  return s.length > 8000 ? `${s.slice(0, 7997)}...` : s;
}
