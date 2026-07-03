export function normalizeRepertoryText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type RepertorizationInput = {
  rubricId: string;
  weight: number;
  remedyGrades: Array<{ remedyId: string; grade: number }>;
};

export type RepertorizationResult = {
  remedyId: string;
  totalScore: number;
  coverage: number;
};

export function computeRepertorization(inputs: RepertorizationInput[]): RepertorizationResult[] {
  const totals = new Map<string, { totalScore: number; coverage: number }>();

  for (const input of inputs) {
    const weight = Math.min(4, Math.max(1, input.weight));
    for (const link of input.remedyGrades) {
      const grade = Math.min(4, Math.max(1, link.grade));
      const current = totals.get(link.remedyId) || { totalScore: 0, coverage: 0 };
      current.totalScore += grade * weight;
      current.coverage += 1;
      totals.set(link.remedyId, current);
    }
  }

  return [...totals.entries()]
    .map(([remedyId, stats]) => ({ remedyId, ...stats }))
    .sort((a, b) => b.totalScore - a.totalScore || b.coverage - a.coverage);
}
