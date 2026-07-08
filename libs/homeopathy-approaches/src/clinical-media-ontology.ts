export type ClinicalMediaType =
  | 'SKIN'
  | 'TONGUE'
  | 'NAIL'
  | 'HAIR'
  | 'SWELLING'
  | 'EYE'
  | 'EAR'
  | 'WOUND'
  | 'JOINT'
  | 'POSTURE'
  | 'DENTAL'
  | 'ABDOMEN'
  | 'CHEST'
  | 'LIMBS'
  | 'XRAY'
  | 'CT'
  | 'MRI'
  | 'ULTRASOUND'
  | 'ECG'
  | 'LAB_REPORT'
  | 'PATHOLOGY'
  | 'OTHER_IMAGING'
  | 'OTHER';

export const RADIOLOGY_MEDIA_TYPES: ClinicalMediaType[] = ['XRAY', 'CT', 'MRI', 'ULTRASOUND', 'CHEST'];
export const REPORT_MEDIA_TYPES: ClinicalMediaType[] = ['LAB_REPORT', 'PATHOLOGY', 'ECG', 'OTHER_IMAGING'];

export function isRadiologyOrReportMediaType(mediaType: ClinicalMediaType) {
  return RADIOLOGY_MEDIA_TYPES.includes(mediaType) || REPORT_MEDIA_TYPES.includes(mediaType);
}

export const CLINICAL_MEDIA_TYPE_LABELS: Record<ClinicalMediaType, string> = {
  SKIN: 'Skin / rash',
  TONGUE: 'Tongue',
  NAIL: 'Nails',
  HAIR: 'Hair / scalp',
  SWELLING: 'Swelling / oedema',
  EYE: 'Eyes',
  EAR: 'Ears',
  WOUND: 'Wound / ulcer',
  JOINT: 'Joints / stiffness',
  POSTURE: 'Posture / gait',
  DENTAL: 'Teeth / gums',
  ABDOMEN: 'Abdomen',
  CHEST: 'Chest / breathing',
  LIMBS: 'Arms / legs',
  XRAY: 'X-ray',
  CT: 'CT scan',
  MRI: 'MRI',
  ULTRASOUND: 'Ultrasound',
  ECG: 'ECG / EKG',
  LAB_REPORT: 'Lab report (image)',
  PATHOLOGY: 'Pathology / histology',
  OTHER_IMAGING: 'Other imaging',
  OTHER: 'Other clinical photo'
};

export const CLINICAL_MEDIA_BODY_REGIONS: Partial<Record<ClinicalMediaType, string[]>> = {
  SKIN: ['Face', 'Neck', 'Chest', 'Back', 'Abdomen', 'Arms', 'Hands', 'Legs', 'Feet', 'Scalp', 'Genital area'],
  TONGUE: ['Dorsum', 'Sides', 'Tip', 'Root', 'Coating', 'Margins'],
  NAIL: ['Fingers', 'Toes', 'Thumb', 'Cuticle'],
  HAIR: ['Scalp', 'Hairline', 'Beard', 'Eyebrows', 'Body hair'],
  SWELLING: ['Face', 'Eyelids', 'Hands', 'Ankles', 'Feet', 'Abdomen', 'Generalized'],
  EYE: ['Left eye', 'Right eye', 'Both eyes', 'Eyelids', 'Conjunctiva'],
  EAR: ['Left ear', 'Right ear', 'Ear canal', 'Behind ear'],
  WOUND: ['Skin ulcer', 'Surgical site', 'Pressure area', 'Diabetic foot', 'Other wound'],
  JOINT: ['Knee', 'Ankle', 'Wrist', 'Fingers', 'Shoulder', 'Hip', 'Spine', 'Small joints'],
  POSTURE: ['Standing', 'Walking', 'Sitting', 'Spine curvature', 'Shoulder level'],
  DENTAL: ['Upper teeth', 'Lower teeth', 'Gums', 'Tongue side', 'Palate'],
  ABDOMEN: ['Upper abdomen', 'Lower abdomen', 'Right side', 'Left side', 'Umbilicus'],
  CHEST: ['Anterior chest', 'Back', 'Breathing pattern', 'Ribs'],
  LIMBS: ['Upper arm', 'Forearm', 'Thigh', 'Calf', 'Hand', 'Foot'],
  XRAY: ['Chest', 'Abdomen', 'Spine', 'Pelvis', 'Skull', 'Knee', 'Ankle', 'Wrist', 'Hand', 'Foot'],
  CT: ['Head', 'Chest', 'Abdomen', 'Pelvis', 'Spine', 'Sinuses', 'Neck'],
  MRI: ['Brain', 'Spine', 'Knee', 'Shoulder', 'Abdomen', 'Pelvis', 'Breast'],
  ULTRASOUND: ['Abdomen', 'Pelvis', 'Thyroid', 'Breast', 'Kidney', 'Liver', 'Pregnancy'],
  ECG: ['12-lead', 'Rhythm strip', 'Long lead II'],
  LAB_REPORT: ['CBC', 'LFT', 'KFT', 'Thyroid', 'Lipid', 'HbA1c', 'Urine'],
  PATHOLOGY: ['Biopsy', 'Cytology', 'Histology slide'],
  OTHER_IMAGING: ['PET', 'DEXA', 'Mammography', 'Angiography', 'Endoscopy still'],
  OTHER: ['General', 'Localized', 'Before treatment', 'After treatment']
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
  EYE: [
    { label: 'Redness', phrases: ['eyes red', 'conjunctiva inflamed'] },
    { label: 'Discharge', phrases: ['eyes discharge', 'eyes watering'] },
    { label: 'Swollen lids', phrases: ['eyelids swollen', 'eyes swelling'] },
    { label: 'Itching eyes', phrases: ['eyes itching', 'eyes burning'] }
  ],
  EAR: [
    { label: 'Ear discharge', phrases: ['ears discharge', 'ears suppuration'] },
    { label: 'Ear pain', phrases: ['ears pain', 'ears aching'] },
    { label: 'Blocked ear', phrases: ['ears stopped', 'hearing diminished'] }
  ],
  WOUND: [
    { label: 'Ulcer base', phrases: ['ulcers', 'skin ulcerated'] },
    { label: 'Inflamed margin', phrases: ['wounds inflamed', 'skin inflammation'] },
    { label: 'Discharge', phrases: ['wounds discharge', 'ulcers discharge'] }
  ],
  JOINT: [
    { label: 'Joint swelling', phrases: ['joints swelling', 'joints inflamed'] },
    { label: 'Stiffness', phrases: ['joints stiff', 'limbs stiff'] },
    { label: 'Deformity', phrases: ['joints deformed', 'hands deformed'] }
  ],
  POSTURE: [
    { label: 'Stooped posture', phrases: ['back bent', 'spine curved'] },
    { label: 'Limping gait', phrases: ['walking lame', 'limping'] },
    { label: 'Asymmetry', phrases: ['shoulders unequal', 'body asymmetry'] }
  ],
  DENTAL: [
    { label: 'Gum inflammation', phrases: ['gums inflamed', 'gums bleeding'] },
    { label: 'Tooth decay', phrases: ['teeth decayed', 'teeth pain'] },
    { label: 'Coated teeth margins', phrases: ['teeth coated', 'mouth offensive'] }
  ],
  ABDOMEN: [
    { label: 'Distension', phrases: ['abdomen distended', 'abdomen bloated'] },
    { label: 'Visible veins', phrases: ['abdomen veins', 'abdomen enlarged'] },
    { label: 'Localized swelling', phrases: ['abdomen swelling', 'abdomen hard'] }
  ],
  CHEST: [
    { label: 'Laboured breathing', phrases: ['breathing difficult', 'respiration labored'] },
    { label: 'Chest retraction', phrases: ['chest oppression', 'chest constriction'] },
    { label: 'Asymmetrical expansion', phrases: ['chest unequal', 'respiration irregular'] }
  ],
  LIMBS: [
    { label: 'Muscle wasting', phrases: ['limbs emaciated', 'muscles wasted'] },
    { label: 'Varicose veins', phrases: ['legs veins', 'limbs veins'] },
    { label: 'Discoloration', phrases: ['limbs blue', 'extremities cold'] }
  ],
  OTHER: [
    { label: 'Inflammation', phrases: ['inflammation', 'pain swelling'] },
    { label: 'Discharge', phrases: ['discharges', 'secretions'] }
  ],
  XRAY: [
    { label: 'Opacity / infiltrate', phrases: ['chest oppression', 'respiration difficult', 'lungs congestion'] },
    { label: 'Pleural effusion', phrases: ['chest oppression', 'breathing difficult', 'chest pain'] },
    { label: 'Cardiomegaly', phrases: ['palpitation', 'chest oppression', 'dyspnea'] },
    { label: 'Fracture line', phrases: ['bones pain', 'limbs pain', 'injuries'] },
    { label: 'Consolidation', phrases: ['cough', 'expectoration', 'fever'] }
  ],
  CT: [
    { label: 'Mass lesion', phrases: ['tumors', 'growths', 'pain chronic'] },
    { label: 'Edema / swelling', phrases: ['swelling', 'inflammation', 'head pain'] },
    { label: 'Hemorrhage', phrases: ['bleeding', 'weakness', 'head pain'] },
    { label: 'Obstruction', phrases: ['abdomen pain', 'vomiting', 'constipation'] },
    { label: 'Effusion', phrases: ['chest oppression', 'breathing difficult'] }
  ],
  MRI: [
    { label: 'Disc lesion', phrases: ['back pain', 'limbs numbness', 'spine pain'] },
    { label: 'Demyelination pattern', phrases: ['limbs numbness', 'weakness', 'vision dim'] },
    { label: 'Joint effusion', phrases: ['joints swelling', 'joints pain', 'stiffness'] },
    { label: 'Soft tissue swelling', phrases: ['swelling', 'inflammation', 'pain'] }
  ],
  ULTRASOUND: [
    { label: 'Gallstones', phrases: ['abdomen pain', 'nausea', 'liver affections'] },
    { label: 'Fatty liver', phrases: ['liver enlarged', 'abdomen fullness', 'digestion weak'] },
    { label: 'Cyst / mass', phrases: ['swelling', 'pain', 'tumors'] },
    { label: 'Fluid collection', phrases: ['abdomen distended', 'swelling', 'dropsy'] }
  ],
  ECG: [
    { label: 'Tachycardia', phrases: ['palpitation', 'anxiety', 'restlessness'] },
    { label: 'Bradycardia', phrases: ['weakness', 'fainting', 'coldness'] },
    { label: 'Arrhythmia', phrases: ['palpitation', 'chest oppression', 'fear'] },
    { label: 'Ischemic changes', phrases: ['chest pain', 'dyspnea', 'weakness'] }
  ],
  LAB_REPORT: [
    { label: 'Anemia pattern', phrases: ['weakness', 'pallor', 'fatigue'] },
    { label: 'Elevated glucose', phrases: ['thirst', 'urine frequent', 'weakness'] },
    { label: 'Thyroid abnormality', phrases: ['heat', 'cold', 'trembling', 'weight changes'] },
    { label: 'Elevated liver enzymes', phrases: ['liver affections', 'jaundice', 'abdomen pain'] },
    { label: 'Raised ESR/CRP', phrases: ['inflammation', 'fever', 'pain'] }
  ],
  PATHOLOGY: [
    { label: 'Chronic inflammation', phrases: ['inflammation chronic', 'pain chronic'] },
    { label: 'Malignancy suspected', phrases: ['tumors', 'emaciation', 'night sweats'] },
    { label: 'Infection', phrases: ['fever', 'discharges', 'inflammation'] }
  ],
  OTHER_IMAGING: [
    { label: 'Abnormal uptake', phrases: ['weakness', 'pain', 'inflammation'] },
    { label: 'Structural abnormality', phrases: ['pain', 'deformity', 'weakness'] }
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

export function clinicalMediaMetaPayload(diseases: Array<{ id: string; name: string; publicCategory: string | null }>) {
  return {
    mediaTypes: Object.entries(CLINICAL_MEDIA_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    bodyRegions: CLINICAL_MEDIA_BODY_REGIONS,
    diseases
  };
}
