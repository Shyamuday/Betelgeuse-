export const CASE_SHEET_FIELDS = [
  { key: 'chiefComplaint', label: 'Chief complaint' },
  { key: 'onset', label: 'Onset & duration' },
  { key: 'location', label: 'Location / side' },
  { key: 'sensation', label: 'Sensation & character' },
  { key: 'modalitiesBetter', label: 'Better from' },
  { key: 'modalitiesWorse', label: 'Worse from' },
  { key: 'concomitants', label: 'Concomitants' },
  { key: 'mentalEmotional', label: 'Mental / emotional' },
  { key: 'pastHistory', label: 'Past history' },
  { key: 'familyHistory', label: 'Family history' },
  { key: 'examination', label: 'Examination / investigations' }
] as const;

export type CaseSheetKey = (typeof CASE_SHEET_FIELDS)[number]['key'];

export type CaseSheetData = Partial<Record<CaseSheetKey, string>>;

export function emptyCaseSheet(): Record<CaseSheetKey, string> {
  return CASE_SHEET_FIELDS.reduce(
    (sheet, field) => {
      sheet[field.key] = '';
      return sheet;
    },
    {} as Record<CaseSheetKey, string>
  );
}

export function hydrateCaseSheet(raw?: CaseSheetData | null): Record<CaseSheetKey, string> {
  const sheet = emptyCaseSheet();
  if (!raw) return sheet;
  for (const field of CASE_SHEET_FIELDS) {
    sheet[field.key] = raw[field.key]?.trim() || '';
  }
  return sheet;
}
