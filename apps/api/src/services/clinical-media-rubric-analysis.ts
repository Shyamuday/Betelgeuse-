import { ImagingInterpretationStatus, RepertorySourceCode, type Prisma } from '@prisma/client';
import {
  CLINICAL_MEDIA_TYPE_LABELS,
  suggestRubricSearchPhrases,
  type ClinicalMediaType
} from '../lib/homeopathy-approaches.js';
import { prisma } from '../db.js';
import { readClinicalMediaFile } from './clinical-media-storage.js';
import {
  extractClinicalSymptomsFromImage,
  isOllamaVisionAvailable,
  ollamaVisionConfig
} from './clinical-media-vision.js';
import {
  formatImagingReportBlock,
  inferHomeopathicHints,
  resolveCaseSheetField,
  suggestDiseasesFromFindings,
  type HomeopathicHint,
  type SuggestedDiseaseMatch
} from './imaging-homeopathy-bridge.js';
import { searchRepertoryRubrics, scoreRubricMatch, tokenizeRepertoryQuery } from './repertory-search.js';
import { isOorepSourceId } from './oorep-client.js';
import { caseAnalysisInclude } from '../routes/repertory/shared.js';

export type ClinicalMediaPhraseSearchLog = {
  phrase: string;
  sourceKey: string;
  sourceLabel: string;
  priority: number;
  reasoning: string;
};

export type ClinicalMediaRubricMatch = {
  rubricId: string;
  weight: number;
  sourceField: string;
  sourceLabel: string;
  sourcePhrase: string;
  reasoning: string;
  rubric: {
    id: string;
    chapter: string;
    subchapter: string | null;
    text: string;
    parentPath: string | null;
  };
};

export type ClinicalMediaImageAnalysis = {
  isSuggestionOnly: true;
  disclaimer: string;
  interpretationId: string;
  mediaId: string;
  mediaType: string;
  mediaTypeLabel: string;
  visionModel: string;
  visionAvailable: boolean;
  impression: string;
  findings: string[];
  extractedSymptoms: string;
  symptomPhrases: string[];
  phrasesSearched: ClinicalMediaPhraseSearchLog[];
  suggestedRubrics: ClinicalMediaRubricMatch[];
  suggestedDiseases: SuggestedDiseaseMatch[];
  homeopathicHints: HomeopathicHint[];
  suggestedCaseSheetField: string;
  summary: string;
  generatedAt: string;
};

const DISCLAIMER =
  'AI-assisted imaging interpretation for homeopathic case-taking only — not a radiology or lab report. Doctor must review all rubrics, disease hints, and findings before applying to the case.';

type RubricCandidate = ClinicalMediaRubricMatch & { matchScore: number };

async function resolveRepertorySource(preferredSourceId?: string | null) {
  if (preferredSourceId && !isOorepSourceId(preferredSourceId)) {
    const source = await prisma.repertorySource.findUnique({
      where: { id: preferredSourceId },
      select: { id: true, name: true, _count: { select: { rubrics: true } } }
    });
    if (source && source._count.rubrics > 0) return { id: source.id, name: source.name };
  }

  const imported =
    (await prisma.repertorySource.findFirst({
      where: { isActive: true, code: RepertorySourceCode.OOREP_PUBLICUM },
      select: { id: true, name: true, _count: { select: { rubrics: true } } }
    })) ||
    (await prisma.repertorySource.findFirst({
      where: { isActive: true, code: RepertorySourceCode.REPERTORIUM_PUBLICUM },
      select: { id: true, name: true, _count: { select: { rubrics: true } } }
    }));

  if (imported && imported._count.rubrics > 0) {
    return { id: imported.id, name: imported.name };
  }

  return imported ? { id: imported.id, name: imported.name } : null;
}

function rubricPathLabel(rubric: ClinicalMediaRubricMatch['rubric']) {
  return [rubric.chapter, rubric.subchapter, rubric.text].filter(Boolean).join(' · ');
}

function collectPhrases(input: {
  mediaType: ClinicalMediaType;
  bodyRegion?: string | null;
  visionPhrases: string[];
  impression: string;
  findings: string[];
  existingObservations?: string | null;
}) {
  const combinedObservations = [
    input.existingObservations?.trim(),
    input.impression,
    ...input.findings,
    ...input.visionPhrases
  ]
    .filter(Boolean)
    .join('\n');

  const ontologyPhrases = suggestRubricSearchPhrases({
    mediaType: input.mediaType,
    observations: combinedObservations,
    bodyRegion: input.bodyRegion ?? undefined
  });

  const entries: Array<{ phrase: string; sourceKey: string; sourceLabel: string; priority: number }> = [];

  for (const phrase of input.visionPhrases) {
    entries.push({ phrase, sourceKey: 'vision', sourceLabel: 'AI vision extraction', priority: 100 });
  }
  for (const phrase of input.findings) {
    entries.push({ phrase, sourceKey: 'finding', sourceLabel: 'Structured finding', priority: 90 });
  }
  if (input.impression) {
    entries.push({
      phrase: input.impression,
      sourceKey: 'impression',
      sourceLabel: 'Impression summary',
      priority: 85
    });
  }
  for (const phrase of ontologyPhrases) {
    entries.push({ phrase, sourceKey: 'ontology', sourceLabel: 'Homeopathy ontology', priority: 70 });
  }

  const seen = new Set<string>();
  const unique: typeof entries = [];
  for (const entry of entries.sort((a, b) => b.priority - a.priority)) {
    const key = entry.phrase.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(entry);
  }

  return unique.slice(0, 16);
}

async function searchPhraseForRubrics(
  phrase: { phrase: string; sourceKey: string; sourceLabel: string; priority: number },
  sourceId: string
): Promise<RubricCandidate[]> {
  const rows = await searchRepertoryRubrics(prisma, {
    q: phrase.phrase,
    sourceId,
    limit: 3,
    mode: 'search'
  });
  const tokens = tokenizeRepertoryQuery(phrase.phrase);
  const matches: RubricCandidate[] = [];

  for (const row of rows) {
    const matchScore = scoreRubricMatch(row, tokens);
    if (matchScore < 0) continue;
    const weight = phrase.sourceKey === 'vision' || phrase.sourceKey === 'finding' ? 3 : 2;
    matches.push({
      rubricId: row.id,
      weight,
      sourceField: phrase.sourceKey,
      sourceLabel: phrase.sourceLabel,
      sourcePhrase: phrase.phrase,
      reasoning: '',
      rubric: {
        id: row.id,
        chapter: row.chapter,
        subchapter: row.subchapter,
        text: row.text,
        parentPath: row.parentPath
      },
      matchScore: matchScore + phrase.priority
    });
  }

  return matches;
}

async function persistInterpretation(input: {
  mediaId: string;
  caseAnalysisId: string;
  aiModel: string;
  rawAiOutput: string;
  snapshot: ClinicalMediaImageAnalysis;
}) {
  return prisma.imagingInterpretation.create({
    data: {
      mediaId: input.mediaId,
      caseAnalysisId: input.caseAnalysisId,
      aiProvider: 'ollama',
      aiModel: input.aiModel,
      rawAiOutput: input.rawAiOutput,
      structuredSnapshot: input.snapshot as unknown as Prisma.InputJsonValue,
      status: ImagingInterpretationStatus.DRAFT
    }
  });
}

export async function analyzeClinicalMediaImage(input: {
  analysisId: string;
  mediaId: string;
  saveObservations?: boolean;
}): Promise<ClinicalMediaImageAnalysis | null> {
  const [analysis, media] = await Promise.all([
    prisma.caseAnalysis.findUnique({
      where: { id: input.analysisId },
      select: { id: true, sourceId: true, caseSheet: true }
    }),
    prisma.clinicalMedia.findFirst({
      where: { id: input.mediaId, caseAnalysisId: input.analysisId },
      select: {
        id: true,
        mediaType: true,
        bodyRegion: true,
        observations: true,
        storageKey: true,
        mimeType: true
      }
    })
  ]);

  if (!analysis || !media) return null;

  if (media.mimeType === 'application/pdf') {
    throw new Error('PDF_NOT_SUPPORTED');
  }

  const visionAvailable = await isOllamaVisionAvailable();
  if (!visionAvailable) {
    throw new Error('OLLAMA_UNAVAILABLE');
  }

  const source = await resolveRepertorySource(analysis.sourceId);
  if (!source) return null;

  const bytes = await readClinicalMediaFile(media.storageKey);
  const imageBase64 = bytes.toString('base64');
  const mediaType = media.mediaType as ClinicalMediaType;
  const mediaTypeLabel = CLINICAL_MEDIA_TYPE_LABELS[mediaType] ?? media.mediaType;

  const vision = await extractClinicalSymptomsFromImage({
    imageBase64,
    mediaType,
    bodyRegion: media.bodyRegion
  });

  if (input.saveObservations) {
    const merged = [media.observations?.trim(), vision.rawText].filter(Boolean).join('\n\n');
    await prisma.clinicalMedia.update({
      where: { id: media.id },
      data: { observations: merged || null }
    });
  }

  const phraseEntries = collectPhrases({
    mediaType,
    bodyRegion: media.bodyRegion,
    visionPhrases: vision.phrases,
    impression: vision.impression,
    findings: vision.findings,
    existingObservations: media.observations
  });

  const phrasesSearched: ClinicalMediaPhraseSearchLog[] = phraseEntries.map((entry) => ({
    phrase: entry.phrase,
    sourceKey: entry.sourceKey,
    sourceLabel: entry.sourceLabel,
    priority: entry.priority,
    reasoning:
      entry.sourceKey === 'vision'
        ? `Local vision model (${vision.model}) extracted “${entry.phrase}” from the image.`
        : entry.sourceKey === 'finding'
          ? `Structured finding mapped to repertory phrase “${entry.phrase}”.`
          : entry.sourceKey === 'impression'
            ? `Impression summary used as search phrase.`
            : `Homeopathic ontology phrase for ${mediaTypeLabel}.`
  }));

  const rubricCandidates: RubricCandidate[] = [];
  for (const phrase of phraseEntries) {
    rubricCandidates.push(...(await searchPhraseForRubrics(phrase, source.id)));
  }

  const byRubric = new Map<string, RubricCandidate>();
  for (const candidate of rubricCandidates.sort((a, b) => b.matchScore - a.matchScore)) {
    const existing = byRubric.get(candidate.rubricId);
    if (!existing || candidate.matchScore > existing.matchScore) {
      byRubric.set(candidate.rubricId, candidate);
    }
  }

  const suggestedRubrics: ClinicalMediaRubricMatch[] = [...byRubric.values()]
    .slice(0, 18)
    .map((item) => ({
      rubricId: item.rubricId,
      weight: item.weight,
      sourceField: item.sourceField,
      sourceLabel: item.sourceLabel,
      sourcePhrase: item.sourcePhrase,
      reasoning: `Repertory match for “${item.sourcePhrase}” from ${item.sourceLabel} → ${rubricPathLabel(item.rubric)} (weight ${item.weight}).`,
      rubric: item.rubric
    }));

  const suggestedDiseases = await suggestDiseasesFromFindings({
    phrases: vision.phrases,
    impression: vision.impression,
    findings: vision.findings
  });

  const homeopathicHints = inferHomeopathicHints({
    phrases: vision.phrases,
    impression: vision.impression,
    findings: vision.findings
  });

  for (const hint of homeopathicHints) {
    for (const phrase of hint.relatedPhrases) {
      if (!phraseEntries.some((entry) => entry.phrase.toLowerCase() === phrase.toLowerCase())) {
        phraseEntries.push({
          phrase,
          sourceKey: 'theme',
          sourceLabel: `Theme: ${hint.theme}`,
          priority: 60
        });
      }
    }
  }

  const config = ollamaVisionConfig();
  const caseSheet = (analysis.caseSheet || null) as Record<string, string> | null;
  const suggestedCaseSheetField = resolveCaseSheetField(caseSheet);

  const summary = [
    suggestedRubrics.length
      ? `${suggestedRubrics.length} rubric match(es)`
      : 'no rubric matches',
    suggestedDiseases.length ? `${suggestedDiseases.length} possible disease hint(s)` : 'no disease hints',
    `${homeopathicHints.length} homeopathic theme(s)`
  ].join(' · ');

  const snapshotBase = {
    isSuggestionOnly: true as const,
    disclaimer: DISCLAIMER,
    mediaId: media.id,
    mediaType: media.mediaType,
    mediaTypeLabel,
    visionModel: config.model,
    visionAvailable: true,
    impression: vision.impression,
    findings: vision.findings,
    extractedSymptoms: vision.rawText,
    symptomPhrases: vision.phrases,
    phrasesSearched,
    suggestedRubrics,
    suggestedDiseases,
    homeopathicHints,
    suggestedCaseSheetField,
    summary: `Preview: ${summary} from ${mediaTypeLabel} via ${source.name}. Doctor review required.`,
    generatedAt: new Date().toISOString()
  };

  const interpretation = await persistInterpretation({
    mediaId: media.id,
    caseAnalysisId: input.analysisId,
    aiModel: config.model,
    rawAiOutput: vision.rawText,
    snapshot: { ...snapshotBase, interpretationId: 'pending' }
  });

  return {
    ...snapshotBase,
    interpretationId: interpretation.id
  };
}

export async function applyImagingInterpretation(input: {
  analysisId: string;
  interpretationId: string;
  overrideRationale?: string | null;
}) {
  const interpretation = await prisma.imagingInterpretation.findFirst({
    where: {
      id: input.interpretationId,
      caseAnalysisId: input.analysisId,
      status: ImagingInterpretationStatus.DRAFT
    }
  });
  if (!interpretation) return null;

  const snapshot = interpretation.structuredSnapshot as unknown as ClinicalMediaImageAnalysis;
  const analysis = await prisma.caseAnalysis.findUnique({
    where: { id: input.analysisId },
    include: caseAnalysisInclude
  });
  if (!analysis) return null;

  const media = await prisma.clinicalMedia.findUnique({
    where: { id: snapshot.mediaId },
    select: { id: true, mediaType: true, bodyRegion: true, observations: true, diseaseId: true }
  });
  if (!media) return null;

  const caseSheet = { ...((analysis.caseSheet || {}) as Record<string, string>) };
  const fieldKey = snapshot.suggestedCaseSheetField || resolveCaseSheetField(caseSheet);
  const reportBlock = formatImagingReportBlock({
    mediaTypeLabel: snapshot.mediaTypeLabel,
    bodyRegion: media.bodyRegion,
    impression: snapshot.impression,
    findings: snapshot.findings,
    extractedSymptoms: snapshot.extractedSymptoms,
    suggestedDiseaseNames: snapshot.suggestedDiseases.map((item) => item.name)
  });
  caseSheet[fieldKey] = [caseSheet[fieldKey]?.trim(), reportBlock].filter(Boolean).join('\n\n');

  const existingRubricIds = new Set(analysis.rubrics.map((item) => item.rubricId));
  const rubricsToAdd = snapshot.suggestedRubrics.filter((item) => !existingRubricIds.has(item.rubricId));

  const topDiseaseId = snapshot.suggestedDiseases[0]?.diseaseId;

  await prisma.$transaction(async (tx) => {
    if (rubricsToAdd.length) {
      await tx.caseAnalysisRubric.createMany({
        data: rubricsToAdd.map((item) => ({
          analysisId: input.analysisId,
          rubricId: item.rubricId,
          weight: item.weight
        }))
      });
    }

    await tx.caseAnalysis.update({
      where: { id: input.analysisId },
      data: { caseSheet: caseSheet as Prisma.InputJsonValue }
    });

    await tx.clinicalMedia.update({
      where: { id: media.id },
      data: {
        observations: [media.observations?.trim(), snapshot.extractedSymptoms].filter(Boolean).join('\n\n') || null,
        ...(topDiseaseId && !media.diseaseId ? { diseaseId: topDiseaseId } : {})
      }
    });

    await tx.imagingInterpretation.update({
      where: { id: interpretation.id },
      data: {
        status: ImagingInterpretationStatus.DOCTOR_APPROVED,
        appliedAt: new Date(),
        doctorOverrideRationale: input.overrideRationale?.trim() || null
      }
    });
  });

  const updated = await prisma.caseAnalysis.findUnique({
    where: { id: input.analysisId },
    include: caseAnalysisInclude
  });

  return { analysis: updated, interpretationId: interpretation.id, rubricsAdded: rubricsToAdd.length };
}
