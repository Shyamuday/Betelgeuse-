import {
  CLINICAL_MEDIA_TYPE_LABELS,
  isRadiologyOrReportMediaType,
  type ClinicalMediaType
} from '../lib/homeopathy-approaches.js';

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL ?? 'qwen2.5-vl:7b';
const OLLAMA_VISION_TIMEOUT_MS = Number(process.env.OLLAMA_VISION_TIMEOUT_MS ?? 120000);

export type VisionExtractionResult = {
  rawText: string;
  phrases: string[];
  impression: string;
  findings: string[];
  model: string;
};

type OllamaChatResponse = {
  message?: { content?: string };
};

function splitSymptomPhrases(text: string) {
  const chunks = text
    .split(/[\n,;•]+/)
    .map((part) => part.replace(/^[\s\-*]+/, '').trim())
    .filter((part) => part.length > 2);

  const unique = new Set<string>();
  for (const chunk of chunks) {
    unique.add(chunk);
    const words = chunk.split(/\s+/).filter((word) => word.length > 3);
    if (words.length >= 2) {
      unique.add(words.slice(0, 4).join(' '));
    }
  }

  return [...unique].slice(0, 10);
}

function parseStructuredSections(rawText: string) {
  const impressionMatch = rawText.match(/IMPRESSION:\s*(.+?)(?:\n|$)/i);
  const findingsBlock = rawText.match(/FINDINGS:\s*([\s\S]+?)(?:\nSYMPTOMS:|$)/i);
  const symptomsBlock = rawText.match(/SYMPTOMS:\s*([\s\S]+)$/i);

  const impression = impressionMatch?.[1]?.trim() ?? rawText.split('\n')[0]?.trim() ?? '';
  const findings = (findingsBlock?.[1] ?? '')
    .split(/\n|•|;/)
    .map((line) => line.replace(/^[\s\-*]+/, '').trim())
    .filter(Boolean)
    .slice(0, 8);

  const symptomSource = symptomsBlock?.[1]?.trim() || rawText;
  const phrases = splitSymptomPhrases(symptomSource);

  return { impression, findings, phrases };
}

function buildVisionPrompt(input: {
  mediaType: ClinicalMediaType;
  mediaTypeLabel: string;
  bodyRegion?: string | null;
}) {
  const region = input.bodyRegion?.trim() ? ` Region: ${input.bodyRegion.trim()}.` : '';

  if (isRadiologyOrReportMediaType(input.mediaType)) {
    return `You are assisting a homeopathic doctor reviewing a medical imaging study or diagnostic report image.
Study type: ${input.mediaTypeLabel}.${region}

Describe objective findings only. Do not name a final diagnosis or homeopathic remedy.

Return exactly in this format:
IMPRESSION: one-line summary
FINDINGS:
- finding one
- finding two
SYMPTOMS:
homeopathic-relevant symptom phrase one
homeopathic-relevant symptom phrase two

Use clinical language suitable for repertory rubric search (e.g. chest oppression, rattling respiration, abdomen distended).`;
  }

  return `You are assisting a homeopathic doctor reviewing a clinical photo.
Image category: ${input.mediaTypeLabel}.${region}

Identify visible physical signs/symptoms for homeopathic case-taking.
Return exactly in this format:
IMPRESSION: one-line summary
FINDINGS:
- visible sign one
- visible sign two
SYMPTOMS:
repertory-friendly symptom phrase one
repertory-friendly symptom phrase two

No remedy names. No definitive diagnosis.`;
}

export async function isOllamaVisionAvailable() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as { models?: Array<{ name?: string }> };
    const names = (payload.models ?? []).map((item) => item.name ?? '');
    return names.some((name) => name === OLLAMA_VISION_MODEL || name.startsWith(`${OLLAMA_VISION_MODEL}:`));
  } catch {
    return false;
  }
}

export async function extractClinicalSymptomsFromImage(input: {
  imageBase64: string;
  mediaType: ClinicalMediaType;
  bodyRegion?: string | null;
}) {
  const mediaTypeLabel = CLINICAL_MEDIA_TYPE_LABELS[input.mediaType] ?? input.mediaType;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OLLAMA_VISION_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_VISION_MODEL,
        stream: false,
        messages: [
          {
            role: 'user',
            content: buildVisionPrompt({ ...input, mediaTypeLabel }),
            images: [input.imageBase64]
          }
        ]
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Ollama vision request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    }

    const payload = (await response.json()) as OllamaChatResponse;
    const rawText = payload.message?.content?.trim() ?? '';
    if (!rawText) {
      throw new Error('Vision model returned no symptom text.');
    }

    const parsed = parseStructuredSections(rawText);
    const phrases = parsed.phrases.length ? parsed.phrases : splitSymptomPhrases(rawText);

    return {
      rawText,
      phrases,
      impression: parsed.impression,
      findings: parsed.findings,
      model: OLLAMA_VISION_MODEL
    } satisfies VisionExtractionResult;
  } finally {
    clearTimeout(timeout);
  }
}

export function ollamaVisionConfig() {
  return {
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_VISION_MODEL
  };
}
