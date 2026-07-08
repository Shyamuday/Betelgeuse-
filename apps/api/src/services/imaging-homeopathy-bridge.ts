import { prisma } from '../db.js';

export type SuggestedDiseaseMatch = {
  diseaseId: string;
  name: string;
  category: string | null;
  confidence: number;
  reasoning: string;
};

export type HomeopathicHint = {
  theme: string;
  reasoning: string;
  relatedPhrases: string[];
  repertoryChapters: string[];
};

const THEME_KEYWORDS: Array<{
  theme: string;
  keywords: string[];
  phrases: string[];
  chapters: string[];
}> = [
  {
    theme: 'Inflammation / acute flare',
    keywords: ['inflamm', 'erythem', 'redness', 'swelling', 'edema', 'effusion', 'consolidat'],
    phrases: ['inflammation', 'fever', 'heat'],
    chapters: ['GENERALITIES', 'FEVER', 'SKIN']
  },
  {
    theme: 'Respiratory / chest affection',
    keywords: ['chest', 'lung', 'pleural', 'cough', 'dyspnea', 'breath', 'opacity', 'infiltrat'],
    phrases: ['chest oppression', 'respiration difficult', 'cough'],
    chapters: ['CHEST', 'RESPIRATION', 'COUGH']
  },
  {
    theme: 'Digestive / liver-gallbladder',
    keywords: ['liver', 'gall', 'abdomen', 'bile', 'jaundice', 'nausea', 'vomit'],
    phrases: ['abdomen pain', 'liver affections', 'nausea'],
    chapters: ['ABDOMEN', 'STOMACH', 'LIVER']
  },
  {
    theme: 'Musculoskeletal / injury',
    keywords: ['fracture', 'joint', 'bone', 'disc', 'spine', 'stiff', 'arthr'],
    phrases: ['joints pain', 'back pain', 'limbs stiff'],
    chapters: ['EXTREMITIES', 'BACK', 'GENERALITIES']
  },
  {
    theme: 'Circulatory / cardiac',
    keywords: ['cardio', 'heart', 'ecg', 'ischem', 'arrhythm', 'palpit', 'tachy', 'brady'],
    phrases: ['palpitation', 'chest pain', 'weakness'],
    chapters: ['CHEST', 'HEART', 'GENERALITIES']
  },
  {
    theme: 'Metabolic / constitutional',
    keywords: ['diabetes', 'glucose', 'thyroid', 'anemia', 'hba1c', 'fatigue', 'weight'],
    phrases: ['weakness', 'thirst', 'heat', 'cold'],
    chapters: ['GENERALITIES', 'FOOD', 'STOMACH']
  },
  {
    theme: 'Neurological',
    keywords: ['brain', 'mri head', 'demyelin', 'seizure', 'numbness', 'vertigo', 'headache'],
    phrases: ['head pain', 'vertigo', 'limbs numbness'],
    chapters: ['HEAD', 'MIND', 'GENERALITIES']
  },
  {
    theme: 'Skin / external manifestation',
    keywords: ['rash', 'eruption', 'ulcer', 'skin', 'lesion', 'papule', 'pustul'],
    phrases: ['skin eruptions', 'eruptions itching', 'ulcers'],
    chapters: ['SKIN', 'GENERALITIES']
  }
];

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'with', 'on', 'in', 'of', 'to', 'is', 'are', 'was', 'were', 'patient', 'has', 'have', 'had', 'mild', 'moderate', 'severe', 'image', 'scan', 'report', 'finding', 'findings'
]);

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export async function suggestDiseasesFromFindings(input: {
  phrases: string[];
  impression: string;
  findings: string[];
}) {
  const haystack = [...input.phrases, input.impression, ...input.findings].join(' ').toLowerCase();
  const tokens = tokenize(haystack);
  if (!tokens.length) return [] as SuggestedDiseaseMatch[];

  const diseases = await prisma.disease.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      publicCategory: true,
      publicDescription: true
    },
    take: 200
  });

  const scored = diseases
    .map((disease) => {
      const profile = `${disease.name} ${disease.description} ${disease.publicDescription ?? ''}`.toLowerCase();
      let score = 0;
      const hits: string[] = [];

      for (const token of tokens) {
        if (disease.name.toLowerCase().includes(token)) {
          score += 55;
          hits.push(token);
          continue;
        }
        if (profile.includes(token)) {
          score += 12;
          hits.push(token);
        }
      }

      return { disease, score, hits };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return scored.map((item) => ({
    diseaseId: item.disease.id,
    name: item.disease.name,
    category: item.disease.publicCategory,
    confidence: Math.min(0.92, item.score / 80),
    reasoning:
      item.hits.length > 0
        ? `Imaging keywords [${[...new Set(item.hits)].slice(0, 5).join(', ')}] overlap with disease profile “${item.disease.name}”.`
        : `Possible overlap with disease profile “${item.disease.name}”.`
  }));
}

export function inferHomeopathicHints(input: {
  phrases: string[];
  impression: string;
  findings: string[];
}) {
  const haystack = [...input.phrases, input.impression, ...input.findings].join(' ').toLowerCase();
  const hints: HomeopathicHint[] = [];

  for (const theme of THEME_KEYWORDS) {
    const matchedKeywords = theme.keywords.filter((keyword) => haystack.includes(keyword));
    if (!matchedKeywords.length) continue;

    hints.push({
      theme: theme.theme,
      reasoning: `Findings mention ${matchedKeywords.slice(0, 4).join(', ')} — consider ${theme.chapters.join(', ')} chapters and related totality.`,
      relatedPhrases: theme.phrases,
      repertoryChapters: theme.chapters
    });
  }

  return hints.slice(0, 6);
}

export function formatImagingReportBlock(input: {
  mediaTypeLabel: string;
  bodyRegion?: string | null;
  impression: string;
  findings: string[];
  extractedSymptoms: string;
  suggestedDiseaseNames: string[];
}) {
  const lines = [
    `[AI-assisted ${input.mediaTypeLabel}${input.bodyRegion ? ` — ${input.bodyRegion}` : ''}]`,
    input.impression ? `Impression: ${input.impression}` : '',
    input.findings.length ? `Findings: ${input.findings.join('; ')}` : '',
    input.extractedSymptoms ? `Symptom phrases: ${input.extractedSymptoms.replace(/\n/g, '; ')}` : '',
    input.suggestedDiseaseNames.length
      ? `Possible disease differentials (review): ${input.suggestedDiseaseNames.join(', ')}`
      : ''
  ].filter(Boolean);

  return lines.join('\n');
}

export function resolveCaseSheetField(caseSheet: Record<string, string> | null | undefined) {
  const sheet = caseSheet ?? {};
  if ('investigationFindings' in sheet) return 'investigationFindings';
  if ('pathologyFindings' in sheet) return 'pathologyFindings';
  if ('examination' in sheet) return 'examination';
  return 'examination';
}
