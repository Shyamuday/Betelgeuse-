export function intakeSearchHints(answers?: Record<string, string> | null): string[] {
  if (!answers) return [];

  const hints = new Set<string>();
  for (const value of Object.values(answers)) {
    for (const token of value.split(/[\s,;]+/)) {
      const cleaned = token.replace(/[^\w-]/g, '').trim();
      if (cleaned.length >= 4) {
        hints.add(cleaned);
      }
    }
  }

  return [...hints].slice(0, 8);
}

export function primaryIntakeSearchPhrase(answers?: Record<string, string> | null): string {
  const hints = intakeSearchHints(answers);
  if (hints.length) return hints[0];
  if (!answers) return '';

  const firstAnswer = Object.values(answers).find((value) => value.trim().length >= 3);
  return firstAnswer?.trim().slice(0, 48) || '';
}
