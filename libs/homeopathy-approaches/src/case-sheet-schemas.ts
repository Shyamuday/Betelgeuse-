import type { CaseSheetFieldDef, CaseSheetSchemaId } from './types';

const CLASSICAL_FIELDS: CaseSheetFieldDef[] = [
  { key: 'chiefComplaint', label: 'Chief complaint', rows: 2 },
  { key: 'onset', label: 'Onset & duration', rows: 2 },
  { key: 'location', label: 'Location / side', rows: 2 },
  { key: 'sensation', label: 'Sensation & character', rows: 2 },
  { key: 'modalitiesBetter', label: 'Better from', rows: 2 },
  { key: 'modalitiesWorse', label: 'Worse from', rows: 2 },
  { key: 'concomitants', label: 'Concomitants', rows: 2 },
  { key: 'mentalEmotional', label: 'Mental / emotional', rows: 3 },
  { key: 'pastHistory', label: 'Past history', rows: 2 },
  { key: 'familyHistory', label: 'Family history', rows: 2 },
  { key: 'examination', label: 'Examination / investigations', rows: 2 }
];

const EIGHT_BOX_FIELDS: CaseSheetFieldDef[] = [
  { key: 'patientInfo', label: 'Patient identity & constitution', rows: 2, wide: true },
  { key: 'chiefComplaints', label: 'Chief complaints (duration & modalities)', rows: 3, wide: true },
  { key: 'presentHistory', label: 'Present illness progression & triggers', rows: 3, wide: true },
  { key: 'pastHistory', label: 'Past history', rows: 2 },
  { key: 'familyHistory', label: 'Family history', rows: 2 },
  { key: 'mentalState', label: 'Mental / emotional state', rows: 3 },
  { key: 'physicalGenerals', label: 'Physical generals', rows: 3 },
  { key: 'particularsAndDiagnosis', label: 'Particulars & clinical diagnosis', rows: 3, wide: true }
];

const CONSTITUTIONAL_FIELDS: CaseSheetFieldDef[] = [
  { key: 'temperament', label: 'Temperament & constitution', rows: 2 },
  { key: 'thermalState', label: 'Thermal preference', rows: 2 },
  { key: 'appetiteThirst', label: 'Appetite & thirst', rows: 2 },
  { key: 'sleepDreams', label: 'Sleep & dreams', rows: 2 },
  { key: 'mentalPicture', label: 'Mental picture', rows: 3, wide: true },
  { key: 'chiefComplaint', label: 'Chief complaint', rows: 2 },
  { key: 'modalities', label: 'Modalities', rows: 2 },
  { key: 'pastFamilyHistory', label: 'Past & family history', rows: 3 }
];

const KENTIAN_FIELDS: CaseSheetFieldDef[] = [
  { key: 'mentalGenerals', label: 'Mental generals (priority)', rows: 4, wide: true, hint: 'Fears, anxieties, delusions, will/affection/intellect.' },
  { key: 'physicalGenerals', label: 'Physical generals', rows: 3, wide: true },
  { key: 'particularSymptoms', label: 'Particular symptoms', rows: 3, wide: true },
  { key: 'strikingKeynotes', label: 'Striking / peculiar keynotes', rows: 3, wide: true },
  { key: 'causation', label: 'Causation & timeline', rows: 2 },
  { key: 'potencyStrategy', label: 'Potency strategy notes', rows: 2 }
];

const BOENNINGHAUSEN_FIELDS: CaseSheetFieldDef[] = [
  { key: 'location', label: 'Location', rows: 2 },
  { key: 'sensation', label: 'Sensation', rows: 2 },
  { key: 'modalities', label: 'Modalities (better / worse)', rows: 3 },
  { key: 'concomitants', label: 'Concomitants', rows: 2 },
  { key: 'timeAggravation', label: 'Time aggravation', rows: 2 },
  { key: 'extensions', label: 'Extensions / radiation', rows: 2 }
];

const BOGER_FIELDS: CaseSheetFieldDef[] = [
  { key: 'pathologicalTotality', label: 'Pathological totality', rows: 3, wide: true },
  { key: 'timePatterns', label: 'Time patterns', rows: 2 },
  { key: 'modalities', label: 'Modalities', rows: 2 },
  { key: 'concomitants', label: 'Concomitants', rows: 2 },
  { key: 'clinicalFindings', label: 'Clinical findings', rows: 2 }
];

const SENSATION_FIELDS: CaseSheetFieldDef[] = [
  { key: 'patientLanguage', label: 'Patient’s own words', rows: 4, wide: true },
  { key: 'coreSensation', label: 'Core sensation theme', rows: 3, wide: true },
  { key: 'activePassive', label: 'Active / passive experience', rows: 2 },
  { key: 'kingdomClues', label: 'Kingdom clues', rows: 2 },
  { key: 'miasmHints', label: 'Miasm hints', rows: 2 },
  { key: 'remedyFamilyNotes', label: 'Remedy family notes', rows: 3 }
];

const MIASMATIC_FIELDS: CaseSheetFieldDef[] = [
  { key: 'presentingLayer', label: 'Presenting layer', rows: 2 },
  { key: 'dominantMiasm', label: 'Dominant miasm', rows: 2 },
  { key: 'psoraSigns', label: 'Psora signs', rows: 3 },
  { key: 'sycosisSigns', label: 'Sycosis signs', rows: 3 },
  { key: 'syphilisSigns', label: 'Syphilis signs', rows: 3 },
  { key: 'familyMiasm', label: 'Family miasm pattern', rows: 2 },
  { key: 'constitutionalOverlay', label: 'Constitutional overlay', rows: 3 }
];

const PROTOCOL_FIELDS: CaseSheetFieldDef[] = [
  { key: 'confirmedDiagnosis', label: 'Confirmed diagnosis', rows: 2 },
  { key: 'protocolNotes', label: 'Protocol personalization', rows: 3, wide: true },
  { key: 'contraindications', label: 'Contraindications / cautions', rows: 2 },
  { key: 'followUpPlan', label: 'Follow-up plan', rows: 2 }
];

const CLINICAL_FIELDS: CaseSheetFieldDef[] = [
  { key: 'clinicalDiagnosis', label: 'Clinical diagnosis', rows: 2 },
  { key: 'pathologyFindings', label: 'Pathology / investigation findings', rows: 3 },
  { key: 'keySymptoms', label: 'Key prescribing symptoms', rows: 3 },
  { key: 'organAffinity', label: 'Organ affinity', rows: 2 },
  { key: 'acuteChronicContext', label: 'Acute vs chronic context', rows: 2 }
];

const HYBRID_FIELDS: CaseSheetFieldDef[] = [
  { key: 'primaryPath', label: 'Primary approach path used', rows: 2 },
  { key: 'secondaryPath', label: 'Secondary / supportive path', rows: 2 },
  { key: 'integrationNotes', label: 'How approaches are integrated', rows: 4, wide: true },
  { key: 'chiefComplaint', label: 'Chief complaint summary', rows: 2 }
];

const ORGANON_LM_FIELDS: CaseSheetFieldDef[] = [
  { key: 'baselineTotality', label: 'Baseline totality summary', rows: 4, wide: true },
  { key: 'vitalitySensitivity', label: 'Vitality & sensitivity profile', rows: 3, wide: true, hint: 'Assess if patient is hypersensitive, depleted, or robust before LM dosing.' },
  { key: 'previousPotencyResponse', label: 'Previous potency / remedy response', rows: 3 },
  { key: 'aggravationHistory', label: 'Aggravation / proving history', rows: 2 },
  { key: 'followUpObservations', label: 'Follow-up observations to monitor', rows: 3 }
];

const KEYNOTE_FIELDS: CaseSheetFieldDef[] = [
  { key: 'totalitySummary', label: 'Full totality summary', rows: 4, wide: true },
  { key: 'generalsReview', label: 'Generals supporting the case', rows: 3 },
  { key: 'particularsReview', label: 'Particulars & modalities', rows: 3 },
  { key: 'consistencyCheck', label: 'Consistency check notes', rows: 2, hint: 'Does the keynote fit the broader totality?' }
];

const PATHOLOGICAL_FIELDS: CaseSheetFieldDef[] = [
  { key: 'pathologyStage', label: 'Pathology stage / disease process', rows: 3, wide: true },
  { key: 'clinicalDiagnosis', label: 'Clinical diagnosis', rows: 2 },
  { key: 'investigationFindings', label: 'Investigation / report findings', rows: 3 },
  { key: 'pathologyCorrelatedSymptoms', label: 'Symptoms correlating with pathology', rows: 3 },
  { key: 'prescribingAnchor', label: 'Prescribing anchor symptoms', rows: 3 }
];

const SEHGAL_FIELDS: CaseSheetFieldDef[] = [
  { key: 'presentingComplaint', label: 'Presenting complaint', rows: 2 },
  { key: 'emotionalPresentation', label: 'Emotional presentation in clinic', rows: 3, wide: true },
  { key: 'physicalCorrelation', label: 'Physical symptom correlation', rows: 3 },
  { key: 'timelineTrigger', label: 'Timeline & emotional trigger', rows: 2 }
];

const INTEGRATIVE_FOLLOW_UP_FIELDS: CaseSheetFieldDef[] = [
  { key: 'chronicDiagnosisContext', label: 'Chronic diagnosis context', rows: 2 },
  { key: 'comorbidityNotes', label: 'Comorbidities & medications', rows: 3 },
  { key: 'homeopathyPlan', label: 'Homeopathy plan summary', rows: 3 },
  { key: 'followUpCadence', label: 'Follow-up cadence', rows: 2 },
  { key: 'patientReportedGoals', label: 'Patient-reported goals', rows: 2 }
];

const SCHOLTEN_FIELDS: CaseSheetFieldDef[] = [
  { key: 'lifeTheme', label: 'Life theme / pattern', rows: 3, wide: true },
  { key: 'mineralAffinity', label: 'Mineral affinity clues', rows: 2 },
  { key: 'confirmatorySymptoms', label: 'Confirmatory symptoms from totality', rows: 3, wide: true },
  { key: 'differentialMinerals', label: 'Differential mineral remedies', rows: 2 }
];

const FIBONACCI_FIELDS: CaseSheetFieldDef[] = [
  { key: 'baselineTotality', label: 'Baseline totality', rows: 3, wide: true },
  { key: 'selectedRemedy', label: 'Selected remedy', rows: 1 },
  { key: 'sensitivityNotes', label: 'Sensitivity notes', rows: 2, wide: true }
];

const TAUTOPATHY_FIELDS: CaseSheetFieldDef[] = [
  { key: 'causalAgent', label: 'Causal agent summary', rows: 2, wide: true },
  { key: 'symptomPicture', label: 'Symptom picture', rows: 3, wide: true },
  { key: 'previousInterventions', label: 'Previous interventions', rows: 2 }
];

const EIZAYAGA_FIELDS: CaseSheetFieldDef[] = [
  { key: 'lesionSummary', label: 'Lesion layer summary', rows: 2, wide: true },
  { key: 'functionalSummary', label: 'Functional layer summary', rows: 2, wide: true },
  { key: 'constitutionalSummary', label: 'Constitutional summary', rows: 2, wide: true }
];

const VITHOULKAS_FIELDS: CaseSheetFieldDef[] = [
  { key: 'essenceSummary', label: 'Essence summary', rows: 3, wide: true },
  { key: 'levelOfHealthNotes', label: 'Level of health notes', rows: 2, wide: true },
  { key: 'totalitySupport', label: 'Supporting totality', rows: 3, wide: true }
];

const DRAINAGE_FIELDS: CaseSheetFieldDef[] = [
  { key: 'organImpairment', label: 'Organ impairment summary', rows: 2, wide: true },
  { key: 'simillimumNotes', label: 'Simillimum notes', rows: 3, wide: true },
  { key: 'supportPlan', label: 'Support plan summary', rows: 2, wide: true }
];

const HERING_FIELDS: CaseSheetFieldDef[] = [
  { key: 'prescriptionBaseline', label: 'Prescription baseline', rows: 2, wide: true },
  { key: 'chiefComplaintSnapshot', label: 'Chief complaint snapshot', rows: 2, wide: true },
  { key: 'followUpFocus', label: 'Follow-up focus', rows: 2 }
];

const ACUTE_FAST_FIELDS: CaseSheetFieldDef[] = [
  { key: 'acuteSummary', label: 'Acute summary', rows: 2, wide: true },
  { key: 'keySymptoms', label: 'Key symptoms', rows: 2, wide: true },
  { key: 'safetyNotes', label: 'Safety notes', rows: 2 }
];

const COMBINATION_FIELDS: CaseSheetFieldDef[] = [
  { key: 'indicationSummary', label: 'Indication summary', rows: 3, wide: true },
  { key: 'personalization', label: 'Personalization notes', rows: 2, wide: true },
  { key: 'durationReview', label: 'Duration & review', rows: 2 }
];

export const CASE_SHEET_SCHEMAS: Record<CaseSheetSchemaId, CaseSheetFieldDef[]> = {
  classical: CLASSICAL_FIELDS,
  'eight-box': EIGHT_BOX_FIELDS,
  constitutional: CONSTITUTIONAL_FIELDS,
  kentian: KENTIAN_FIELDS,
  boenninghausen: BOENNINGHAUSEN_FIELDS,
  boger: BOGER_FIELDS,
  sensation: SENSATION_FIELDS,
  miasmatic: MIASMATIC_FIELDS,
  protocol: PROTOCOL_FIELDS,
  clinical: CLINICAL_FIELDS,
  hybrid: HYBRID_FIELDS,
  'organon-lm': ORGANON_LM_FIELDS,
  keynote: KEYNOTE_FIELDS,
  pathological: PATHOLOGICAL_FIELDS,
  sehgal: SEHGAL_FIELDS,
  'integrative-follow-up': INTEGRATIVE_FOLLOW_UP_FIELDS,
  scholten: SCHOLTEN_FIELDS,
  fibonacci: FIBONACCI_FIELDS,
  tautopathy: TAUTOPATHY_FIELDS,
  eizayaga: EIZAYAGA_FIELDS,
  vithoulkas: VITHOULKAS_FIELDS,
  drainage: DRAINAGE_FIELDS,
  hering: HERING_FIELDS,
  'acute-fast': ACUTE_FAST_FIELDS,
  combination: COMBINATION_FIELDS
};

export function caseSheetFieldsForSchema(schemaId: CaseSheetSchemaId): CaseSheetFieldDef[] {
  return CASE_SHEET_SCHEMAS[schemaId] || CLASSICAL_FIELDS;
}

export function emptyCaseSheetForSchema(schemaId: CaseSheetSchemaId): Record<string, string> {
  const fields = caseSheetFieldsForSchema(schemaId);
  const sheet: Record<string, string> = {
    _schema: schemaId,
    _version: '1'
  };
  for (const field of fields) {
    sheet[field.key] = '';
  }
  return sheet;
}

export function hydrateCaseSheetForSchema(
  schemaId: CaseSheetSchemaId,
  raw?: Record<string, string> | null
): Record<string, string> {
  const sheet = emptyCaseSheetForSchema(schemaId);
  if (!raw) return sheet;
  for (const field of caseSheetFieldsForSchema(schemaId)) {
    sheet[field.key] = raw[field.key]?.trim() || '';
  }
  if (raw['_schema']) sheet['_schema'] = raw['_schema'];
  if (raw['_version']) sheet['_version'] = raw['_version'];
  return sheet;
}
