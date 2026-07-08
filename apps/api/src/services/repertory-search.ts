import type { Prisma, PrismaClient } from '@prisma/client';
import { normalizeRepertoryText } from './repertorization.js';

export type RepertoryRubricSearchRow = {
  id: string;
  chapter: string;
  subchapter: string | null;
  text: string;
  parentPath: string | null;
  normalizedText: string;
  source: { id: string; name: string; code: string };
  remedies?: Array<{
    grade: number;
    remedy: { id: string; name: string; abbreviation: string };
  }>;
};

export type RepertoryRubricSearchOptions = {
  q: string;
  sourceId?: string;
  chapter?: string;
  limit?: number;
  mode?: 'search' | 'suggest';
};

export function tokenizeRepertoryQuery(q: string) {
  return normalizeRepertoryText(q).split(' ').filter(Boolean);
}

export function scoreRubricMatch(
  rubric: Pick<RepertoryRubricSearchRow, 'normalizedText' | 'text' | 'chapter'>,
  tokens: string[]
) {
  if (!tokens.length) return -1;

  let score = 0;
  const normalized = rubric.normalizedText;
  const words = normalized.split(' ').filter(Boolean);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!normalized.includes(token)) return -1;

    if (index === 0 && normalized.startsWith(token)) {
      score += 140;
    } else if (words.some((word) => word.startsWith(token))) {
      score += 55;
    } else {
      score += 12;
    }
  }

  if (tokens.length > 1 && normalized.includes(tokens.join(' '))) {
    score += 35;
  }

  score += Math.max(0, 90 - Math.round(rubric.text.length / 5));

  const chapter = rubric.chapter.toLowerCase();
  if (tokens.some((token) => chapter.includes(token))) {
    score += 18;
  }

  return score;
}

function rubricWhere(options: RepertoryRubricSearchOptions, tokens: string[]): Prisma.RepertoryRubricWhereInput {
  return {
    ...(options.sourceId ? { sourceId: options.sourceId } : {}),
    ...(options.chapter ? { chapter: { equals: options.chapter, mode: 'insensitive' } } : {}),
    AND: tokens.map((token) => ({
      normalizedText: { contains: token }
    }))
  };
}

const rubricSelect = {
  id: true,
  chapter: true,
  subchapter: true,
  text: true,
  parentPath: true,
  normalizedText: true,
  source: { select: { id: true, name: true, code: true } }
} satisfies Prisma.RepertoryRubricSelect;

const rubricSelectWithRemedies = {
  ...rubricSelect,
  remedies: {
    take: 6,
    orderBy: { grade: 'desc' as const },
    select: {
      grade: true,
      remedy: { select: { id: true, name: true, abbreviation: true } }
    }
  }
} satisfies Prisma.RepertoryRubricSelect;

export async function searchRepertoryRubrics(
  prisma: PrismaClient,
  options: RepertoryRubricSearchOptions
): Promise<RepertoryRubricSearchRow[]> {
  const tokens = tokenizeRepertoryQuery(options.q);
  if (tokens.length < 2 && options.mode !== 'suggest') return [];
  if (tokens.length < 1) return [];

  const limit = options.limit ?? (options.mode === 'suggest' ? 12 : 25);
  const fetchLimit = Math.min(limit * 4, options.mode === 'suggest' ? 60 : 100);

  const rows = await prisma.repertoryRubric.findMany({
    where: rubricWhere(options, tokens),
    take: fetchLimit,
    select: options.mode === 'suggest' ? rubricSelect : rubricSelectWithRemedies
  });

  return rows
    .map((row) => ({ row, score: scoreRubricMatch(row, tokens) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score || a.row.text.localeCompare(b.row.text))
    .slice(0, limit)
    .map(({ row }) => row);
}

export function toRubricSuggestion(row: RepertoryRubricSearchRow) {
  const path = [row.chapter, row.subchapter, row.text].filter(Boolean).join(' · ');
  return {
    id: row.id,
    chapter: row.chapter,
    subchapter: row.subchapter,
    text: row.text,
    parentPath: row.parentPath,
    label: path,
    source: row.source
  };
}
