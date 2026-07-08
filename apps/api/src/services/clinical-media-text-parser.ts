export type ParsedClinicalText = {
  impression: string;
  findings: string[];
  phrases: string[];
};

export function splitSymptomPhrases(text: string) {
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

  return [...unique].slice(0, 12);
}

export function parseStructuredSections(rawText: string): ParsedClinicalText {
  const impressionMatch =
    rawText.match(/IMPRESSION:\s*(.+?)(?:\n|$)/i) ||
    rawText.match(/CONCLUSION:\s*(.+?)(?:\n|$)/i) ||
    rawText.match(/SUMMARY:\s*(.+?)(?:\n|$)/i);

  const findingsBlock =
    rawText.match(/FINDINGS:\s*([\s\S]+?)(?:\n(?:SYMPTOMS|IMPRESSION|CONCLUSION):|$)/i) ||
    rawText.match(/RESULTS?:\s*([\s\S]+?)(?:\n(?:SYMPTOMS|IMPRESSION|CONCLUSION):|$)/i);

  const symptomsBlock = rawText.match(/SYMPTOMS:\s*([\s\S]+)$/i);

  const impression = impressionMatch?.[1]?.trim() ?? rawText.split('\n').find((line) => line.trim().length > 12)?.trim() ?? '';

  let findings = (findingsBlock?.[1] ?? '')
    .split(/\n|•|;/)
    .map((line) => line.replace(/^[\s\-*]+/, '').trim())
    .filter(Boolean)
    .slice(0, 10);

  if (!findings.length) {
    findings = extractHeuristicFindings(rawText);
  }

  const symptomSource = symptomsBlock?.[1]?.trim() || rawText;
  const phrases = splitSymptomPhrases(symptomSource);

  return { impression, findings, phrases };
}

function extractHeuristicFindings(text: string) {
  const lines = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 8);

  const abnormal = lines.filter((line) =>
    /\b(high|low|elevated|decreased|abnormal|positive|negative|raised|reduced|markedly|mild|moderate|severe)\b/i.test(
      line
    )
  );

  if (abnormal.length) return abnormal.slice(0, 10);

  return lines
    .filter((line) => /[:=]/.test(line) || /\d/.test(line))
    .slice(0, 8);
}

export function buildExtractionFromText(rawText: string, model: string) {
  const trimmed = rawText.trim();
  const parsed = parseStructuredSections(trimmed);
  const phrases = parsed.phrases.length ? parsed.phrases : splitSymptomPhrases(trimmed);

  return {
    rawText: trimmed,
    phrases,
    impression: parsed.impression,
    findings: parsed.findings,
    model
  };
}
