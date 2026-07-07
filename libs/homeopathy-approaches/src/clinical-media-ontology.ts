export type ClinicalMediaType = 'SKIN' | 'TONGUE' | 'NAIL' | 'HAIR' | 'SWELLING' | 'OTHER';

export const CLINICAL_MEDIA_TYPE_LABELS: Record<ClinicalMediaType, string> = {
  SKIN: 'Skin / rash',
  TONGUE: 'Tongue',
  NAIL: 'Nails',
  HAIR: 'Hair / scalp',
  SWELLING: 'Swelling / oedema',
  OTHER: 'Other'
};

export const CLINICAL_MEDIA_BODY_REGIONS: Partial<Record<ClinicalMediaType, string[]>> = {
  SKIN: ['Face', 'Extensor surfaces', 'Flexor surfaces', 'Trunk', 'Hands', 'Feet', 'Scalp'],
  TONGUE: ['Dorsum', 'Sides', 'Tip', 'Root'],
  NAIL: ['Fingers', 'Toes'],
  HAIR: ['Scalp', 'Beard', 'Body'],
  SWELLING: ['Face', 'Ankles', 'Hands', 'Abdomen', 'Generalized']
};

type OntologyEntry = {
  label: string;
  phrases: string[];
};

const OBSERVATION_ONTOLOGY: Record<ClinicalMediaType, OntologyEntry[]> = {
  SKIN: [
    { label: 'Erythematous eruption', phrases: ['skin eruptions', 'skin redness'] },
    { label: 'Dry scaly patches', phrases: ['skin dry', 'skin scaly'] },
    { label: 'Itching eruption', phrases: ['skin itching', 'eruptions itching'] },
    { label: 'Burning skin', phrases: ['skin burning', 'burning pains skin'] },
    { label: 'Papular rash', phrases: ['eruptions papular', 'skin papules'] },
    { label: 'Pustular lesions', phrases: ['eruptions pustular', 'skin pustules'] },
    { label: 'Moist / weeping', phrases: ['eruptions moist', 'skin discharges'] }
  ],
  TONGUE: [
    { label: 'White coating', phrases: ['tongue coated white', 'tongue white'] },
    { label: 'Red tongue', phrases: ['tongue red', 'tongue inflamed'] },
    { label: 'Cracked tongue', phrases: ['tongue cracked', 'tongue fissured'] },
    { label: 'Moist tongue', phrases: ['tongue moist', 'mouth moist'] },
    { label: 'Dry tongue', phrases: ['tongue dry', 'mouth dry'] },
    { label: 'Mapped / geographic', phrases: ['tongue mapped', 'tongue patches'] }
  ],
  NAIL: [
    { label: 'Brittle nails', phrases: ['nails brittle', 'nails break'] },
    { label: 'Ridged nails', phrases: ['nails ridged', 'nails grooved'] },
    { label: 'Discolored nails', phrases: ['nails discolored', 'nails yellow'] },
    { label: 'Inflamed nail bed', phrases: ['nails inflamed', 'fingers inflamed'] }
  ],
  HAIR: [
    { label: 'Hair falling', phrases: ['hair falling', 'hair loss'] },
    { label: 'Dry hair', phrases: ['hair dry', 'scalp dry'] },
    { label: 'Itchy scalp', phrases: ['scalp itching', 'head itching'] },
    { label: 'Dandruff / scales', phrases: ['scalp scaly', 'head eruptions'] }
  ],
  SWELLING: [
    { label: 'Pitting oedema', phrases: ['extremities oedema', 'ankles swelling'] },
    { label: 'Facial puffiness', phrases: ['face swelling', 'eyes swelling'] },
    { label: 'General dropsy', phrases: ['body swelling', 'dropsy'] }
  ],
  OTHER: [
    { label: 'Inflammation', phrases: ['inflammation', 'pain swelling'] },
    { label: 'Discharge', phrases: ['discharges', 'secretions'] }
  ]
};

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'with', 'on', 'in', 'of', 'to', 'is', 'are', 'was', 'were', 'patient', 'has', 'have', 'had', 'mild', 'moderate', 'severe'
]);

function tokenizeObservations(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

export function observationHintsForMediaType(mediaType: ClinicalMediaType) {
  return OBSERVATION_ONTOLOGY[mediaType] ?? [];
}

export function suggestRubricSearchPhrases(input: {
  mediaType: ClinicalMediaType;
  observations?: string | null;
  bodyRegion?: string | null;
}) {
  const phrases = new Set<string>();
  const observationText = (input.observations || '').toLowerCase();

  for (const entry of OBSERVATION_ONTOLOGY[input.mediaType] ?? []) {
    const labelHit = observationText && entry.label.toLowerCase().split(/\s+/).some((word) => observationText.includes(word));
    const tokenHits = tokenizeObservations(observationText).some((token) =>
      entry.label.toLowerCase().includes(token) || entry.phrases.some((phrase) => phrase.includes(token))
    );
    if (!observationText || labelHit || tokenHits) {
      for (const phrase of entry.phrases) {
        phrases.add(phrase);
      }
    }
  }

  if (input.bodyRegion?.trim()) {
    const region = input.bodyRegion.trim().toLowerCase();
    phrases.add(`${region} ${input.mediaType === 'SKIN' ? 'eruptions' : 'symptoms'}`);
  }

  const tokens = tokenizeObservations(observationText);
  if (tokens.length >= 2) {
    phrases.add(tokens.slice(0, 4).join(' '));
  }
  for (const token of tokens.slice(0, 6)) {
    if (token.length > 3) phrases.add(token);
  }

  return [...phrases].slice(0, 12);
}
