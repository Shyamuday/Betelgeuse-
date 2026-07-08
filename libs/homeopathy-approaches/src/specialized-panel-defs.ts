import {
  MIASM_OPTIONS,
  ORGANON_LM_DILUTION_OPTIONS,
  SCHOLTEN_SERIES_OPTIONS,
  SCHOLTEN_STAGE_OPTIONS,
  SENSATION_KINGDOM_OPTIONS
} from './approach-field-options';
import { approachField } from './approach-field-helpers';
import type { ApproachFieldDef, ApproachStepComponent } from './types';

export type SpecializedPanelDef = {
  title: string;
  hint: string;
  aiPanelPromptKey?: string;
  fields: ApproachFieldDef[];
};

export const SPECIALIZED_PANEL_DEFS: Partial<Record<ApproachStepComponent, SpecializedPanelDef>> = {
  'kent-hierarchy': {
    title: 'Kentian symptom hierarchy',
    hint: 'Capture symptoms in Kent’s order: mental generals first, then physical generals, then particulars.',
    aiPanelPromptKey: 'kent.hierarchy',
    fields: [
      approachField('mentalGenerals', 'Mental generals (priority)', {
        rows: 4,
        wide: true,
        required: true,
        description: 'Will, intellect, and affection — fears, anxieties, irritability, delusions.',
        hint: 'Ask: “What happens in your mind when you are unwell?”',
        placeholder: 'Fears, anxieties, irritability, delusions, will/affection/intellect…',
        rubricSearchable: true,
        promptKey: 'kent.mentalGenerals',
        suggestEndpoint: 'ai-complete',
        extractFrom: ['intake', 'chat']
      }),
      approachField('physicalGenerals', 'Physical generals', {
        rows: 3,
        wide: true,
        required: true,
        description: 'Appetite, thirst, thermal state, sleep, perspiration, stool, urine.',
        placeholder: 'Thermal state, appetite, thirst, sleep, perspiration…',
        rubricSearchable: true,
        promptKey: 'kent.physicalGenerals',
        suggestEndpoint: 'ai-complete',
        extractFrom: ['intake']
      }),
      approachField('particularSymptoms', 'Particular symptoms', {
        rows: 3,
        wide: true,
        required: true,
        description: 'Localized symptoms with sensation, location, and modality.',
        placeholder: 'Localized symptoms with sensation and modality…',
        rubricSearchable: true,
        promptKey: 'kent.particularSymptoms',
        suggestEndpoint: 'ai-complete'
      }),
      approachField('strikingKeynotes', 'Striking / peculiar keynotes', {
        rows: 3,
        wide: true,
        description: 'Strange, rare, and peculiar symptoms that may anchor the remedy.',
        placeholder: 'Strange, rare, and peculiar symptoms…',
        rubricSearchable: true,
        promptKey: 'kent.strikingKeynotes',
        suggestEndpoint: 'ai-complete'
      })
    ]
  },
  'sensation-mapper': {
    title: 'Sensation mapping',
    hint: 'Capture the patient’s exact language and the core sensation theme before remedy family selection.',
    aiPanelPromptKey: 'sensation.mapping',
    fields: [
      approachField('patientLanguage', 'Patient’s own words', {
        rows: 4,
        wide: true,
        required: true,
        description: 'Record metaphors, gestures, and repeated phrases verbatim.',
        placeholder: 'Record metaphors, hand gestures, repeated phrases…',
        promptKey: 'sensation.patientLanguage',
        suggestEndpoint: 'ai-extract-intake',
        extractFrom: ['intake', 'chat']
      }),
      approachField('coreSensation', 'Core sensation theme', {
        rows: 3,
        wide: true,
        required: true,
        description: 'The deepest sensation word or image (e.g. crushed, split, stuck).',
        placeholder: 'e.g. crushed, split, stuck, attacked, bound…',
        promptKey: 'sensation.coreSensation',
        suggestEndpoint: 'ai-complete',
        suggestContext: ['patientLanguage']
      }),
      approachField('kingdom', 'Kingdom', {
        fieldType: 'select',
        multiline: false,
        options: [...SENSATION_KINGDOM_OPTIONS],
        description: 'Plant, mineral, animal, or nosode kingdom clues.',
        promptKey: 'sensation.kingdom',
        suggestEndpoint: 'ai-complete',
        suggestContext: ['patientLanguage', 'coreSensation']
      }),
      approachField('remedyFamily', 'Remedy family notes', {
        fieldType: 'text',
        multiline: false,
        description: 'Likely family or group (e.g. Snake, Carbon, Muriaticum).',
        placeholder: 'e.g. Snake, Carbon, Muriaticum…',
        promptKey: 'sensation.remedyFamily'
      }),
      approachField('levelOfExperience', 'Level of experience', {
        rows: 2,
        wide: true,
        description: 'Depth of sensation experience (Level 1–4 or descriptive).',
        placeholder: 'Level 1–4 or descriptive depth notes…',
        promptKey: 'sensation.levelOfExperience'
      })
    ]
  },
  'miasm-selector': {
    title: 'Miasmatic layer',
    hint: 'Document the active miasmatic layer before repertorization and remedy selection.',
    aiPanelPromptKey: 'miasm.layer',
    fields: [
      approachField('presentingLayer', 'Presenting layer', {
        fieldType: 'text',
        multiline: false,
        required: true,
        description: 'What miasmatic layer is expressing in the current complaint.',
        placeholder: 'What is expressing now?',
        promptKey: 'miasm.presentingLayer'
      }),
      approachField('dominantMiasm', 'Dominant miasm', {
        fieldType: 'select',
        multiline: false,
        required: true,
        options: [...MIASM_OPTIONS],
        promptKey: 'miasm.dominantMiasm',
        suggestEndpoint: 'ai-complete'
      }),
      approachField('psoraSigns', 'Psora signs', {
        rows: 3,
        description: 'Itching, sensitivity, functional disturbances, periodicity.',
        placeholder: 'Functional, hypersensitive, changeable symptoms…',
        promptKey: 'miasm.psoraSigns'
      }),
      approachField('sycosisSigns', 'Sycosis signs', {
        rows: 3,
        description: 'Warts, growths, retention, rheumatic tendency.',
        placeholder: 'Growths, warts, retention, overproduction…',
        promptKey: 'miasm.sycosisSigns'
      }),
      approachField('syphilisSigns', 'Syphilis signs', {
        rows: 3,
        description: 'Ulceration, destruction, night pains, deformity.',
        placeholder: 'Destruction, ulceration, night aggravation…',
        promptKey: 'miasm.syphilisSigns'
      }),
      approachField('familyMiasm', 'Family miasm pattern', {
        rows: 2,
        wide: true,
        description: 'Inherited or family disease patterns supporting miasm choice.',
        placeholder: 'Family history of TB, cancer, diabetes, addictions…',
        promptKey: 'miasm.familyMiasm',
        extractFrom: ['intake', 'priorCase']
      })
    ]
  },
  'keynote-striking': {
    title: 'Keynote & striking symptoms',
    hint: 'Identify striking peculiar symptoms, then cross-check against the full totality.',
    aiPanelPromptKey: 'keynote.striking',
    fields: [
      approachField('strikingSymptoms', 'Striking symptoms', {
        rows: 3,
        wide: true,
        required: true,
        description: 'Symptoms that stand out immediately in the case.',
        placeholder: 'What jumps out in the first interview?',
        rubricSearchable: true,
        promptKey: 'keynote.strikingSymptoms',
        suggestEndpoint: 'ai-complete',
        extractFrom: ['intake']
      }),
      approachField('peculiarRareSymptoms', 'Peculiar / rare symptoms', {
        rows: 3,
        wide: true,
        description: 'Unusual symptoms not explained by pathology alone.',
        placeholder: 'Strange, rare, peculiar modalities or concomitants…',
        rubricSearchable: true,
        promptKey: 'keynote.peculiarRareSymptoms',
        suggestEndpoint: 'ai-complete'
      }),
      approachField('totalityCrossCheck', 'Totality cross-check', {
        rows: 3,
        wide: true,
        required: true,
        description: 'Does the keynote fit the broader generals and particulars?',
        placeholder: 'Confirm keynote against full case picture…',
        promptKey: 'keynote.totalityCrossCheck'
      }),
      approachField('differentialShortlist', 'Differential shortlist', {
        rows: 2,
        wide: true,
        description: 'Remedies competing for the keynote anchor.',
        placeholder: 'e.g. Sulphur vs Lycopodium — why?',
        promptKey: 'keynote.differentialShortlist'
      })
    ]
  },
  'scholten-mapper': {
    title: 'Scholten periodic table map',
    hint: 'Map life theme to series and stage before mineral remedy shortlisting.',
    aiPanelPromptKey: 'scholten.mapping',
    fields: [
      approachField('thematicPattern', 'Thematic pattern', {
        rows: 3,
        wide: true,
        required: true,
        description: 'Central life theme or conflict pattern in patient’s story.',
        placeholder: 'Responsibility, performance, isolation, protection…',
        promptKey: 'scholten.thematicPattern',
        suggestEndpoint: 'ai-complete',
        extractFrom: ['intake', 'chat']
      }),
      approachField('series', 'Series', {
        fieldType: 'select',
        multiline: false,
        options: [...SCHOLTEN_SERIES_OPTIONS],
        promptKey: 'scholten.series',
        suggestContext: ['thematicPattern']
      }),
      approachField('stage', 'Stage', {
        fieldType: 'select',
        multiline: false,
        options: SCHOLTEN_STAGE_OPTIONS,
        promptKey: 'scholten.stage'
      }),
      approachField('mineralShortlist', 'Mineral shortlist', {
        rows: 2,
        wide: true,
        description: 'Candidate mineral remedies from series/stage mapping.',
        placeholder: 'e.g. Nat-m, Sil, Kali-s…',
        promptKey: 'scholten.mineralShortlist'
      }),
      approachField('confirmationNotes', 'Confirmation notes', {
        rows: 3,
        wide: true,
        description: 'Totality symptoms confirming or ruling out minerals.',
        placeholder: 'Symptoms that confirm or exclude shortlisted minerals…',
        rubricSearchable: true,
        promptKey: 'scholten.confirmationNotes'
      })
    ]
  },
  'sehgal-emotion': {
    title: 'Sehgal emotional core',
    hint: 'Identify the emotional disturbance at the center of the case and its mind–body linkage.',
    aiPanelPromptKey: 'sehgal.emotion',
    fields: [
      approachField('emotionalDisturbance', 'Emotional disturbance', {
        rows: 3,
        wide: true,
        required: true,
        description: 'Primary emotional state driving the case.',
        placeholder: 'Fear of failure, grief, anger, insecurity…',
        promptKey: 'sehgal.emotionalDisturbance',
        suggestEndpoint: 'ai-complete',
        extractFrom: ['intake', 'chat']
      }),
      approachField('emotionalTrigger', 'Emotional trigger', {
        rows: 2,
        wide: true,
        description: 'Event or situation that activates the disturbance.',
        placeholder: 'Loss, humiliation, conflict, anticipation…',
        promptKey: 'sehgal.emotionalTrigger'
      }),
      approachField('mindBodyLinkage', 'Mind–body linkage', {
        rows: 3,
        wide: true,
        required: true,
        description: 'How emotion expresses in physical symptoms.',
        placeholder: 'e.g. anxiety → palpitations; anger → headache…',
        promptKey: 'sehgal.mindBodyLinkage',
        rubricSearchable: true
      }),
      approachField('emotionalCoreRemedy', 'Emotional core remedy', {
        rows: 2,
        wide: true,
        description: 'Remedy matching the emotional essence (working hypothesis).',
        placeholder: 'Remedy hypothesis from emotional core…',
        promptKey: 'sehgal.emotionalCoreRemedy'
      })
    ]
  },
  'integrative-follow-up': {
    title: 'Integrative follow-up & safety',
    hint: 'Document baseline metrics, safety flags, and review plan for integrative chronic care.',
    aiPanelPromptKey: 'integrative.followUp',
    fields: [
      approachField('baselineMetrics', 'Baseline metrics', {
        rows: 2,
        wide: true,
        required: true,
        description: 'Weight, BP, HbA1c, pain score, or other tracked values.',
        placeholder: 'e.g. Weight 72 kg, HbA1c 7.2%, pain 6/10…',
        promptKey: 'integrative.baselineMetrics'
      }),
      approachField('subjectiveMarkers', 'Subjective markers', {
        rows: 2,
        wide: true,
        description: 'Energy, sleep quality, mood, functional capacity.',
        placeholder: 'Energy, sleep, mood, daily function…',
        promptKey: 'integrative.subjectiveMarkers',
        extractFrom: ['intake']
      }),
      approachField('objectiveReports', 'Objective reports', {
        rows: 2,
        wide: true,
        description: 'Labs, imaging, vitals from this visit or recent reports.',
        placeholder: 'Recent labs, imaging, vitals…',
        promptKey: 'integrative.objectiveReports',
        extractFrom: ['intake', 'media']
      }),
      approachField('safetyRedFlags', 'Safety red flags', {
        rows: 2,
        wide: true,
        required: true,
        description: 'Symptoms requiring urgent referral or co-management.',
        placeholder: 'Chest pain, neuro deficits, suicidal ideation…',
        promptKey: 'integrative.safetyRedFlags',
        suggestEndpoint: 'ai-complete'
      }),
      approachField('referralEscalation', 'Referral / escalation', {
        rows: 2,
        wide: true,
        description: 'Specialist referral or emergency guidance given.',
        placeholder: 'Refer to cardiology / ER if…',
        promptKey: 'integrative.referralEscalation'
      }),
      approachField('nextReviewPlan', 'Next review plan', {
        rows: 2,
        wide: true,
        required: true,
        description: 'When to review and what to monitor before next visit.',
        placeholder: 'Review in 2 weeks; track sleep and pain diary…',
        promptKey: 'integrative.nextReviewPlan'
      })
    ]
  },
  'organon-lm-dosing': {
    title: 'LM dosing plan (Organon 6th ed.)',
    hint: 'Plan LM potency, dilution glass, and repetition after remedy selection.',
    aiPanelPromptKey: 'organon.lmDosing',
    fields: [
      approachField('baselineVitality', 'Baseline vitality', {
        rows: 2,
        description: 'Energy, resilience, and recovery pattern before LM dosing.',
        placeholder: 'Energy, resilience, recovery pattern…',
        promptKey: 'organon.baselineVitality',
        extractFrom: ['intake']
      }),
      approachField('sensitivityProfile', 'Sensitivity profile', {
        rows: 2,
        required: true,
        description: 'Hypersensitivity, proving tendency, previous aggravations.',
        placeholder: 'Hypersensitive, proving tendency, previous aggravations…',
        promptKey: 'organon.sensitivityProfile'
      }),
      approachField('selectedLmPotency', 'Selected LM potency', {
        fieldType: 'text',
        multiline: false,
        required: true,
        placeholder: 'e.g. LM1, LM2…',
        promptKey: 'organon.selectedLmPotency'
      }),
      approachField('dilutionGlass', 'Dilution glass #', {
        fieldType: 'select',
        multiline: false,
        options: ORGANON_LM_DILUTION_OPTIONS,
        promptKey: 'organon.dilutionGlass'
      }),
      approachField('repetitionSchedule', 'Repetition schedule', {
        rows: 3,
        wide: true,
        required: true,
        description: 'How often to dose and when to stop on aggravation.',
        placeholder: 'e.g. daily succussion, every 3 days, stop on aggravation…',
        promptKey: 'organon.repetitionSchedule'
      }),
      approachField('responseMonitoring', 'Response monitoring', {
        rows: 2,
        wide: true,
        description: 'What to watch between doses.',
        placeholder: 'Sleep, energy, symptom shift, aggravation…',
        promptKey: 'organon.responseMonitoring'
      }),
      approachField('adjustmentNotes', 'Adjustment notes', {
        rows: 2,
        wide: true,
        description: 'When to raise potency, pause, or antidote.',
        placeholder: 'When to raise potency, pause, or antidote…',
        promptKey: 'organon.adjustmentNotes'
      })
    ]
  }
};

export function specializedPanelDef(component: ApproachStepComponent): SpecializedPanelDef | null {
  return SPECIALIZED_PANEL_DEFS[component] ?? null;
}

export function specializedPanelRequiredKeys(component: ApproachStepComponent): string[] {
  const def = specializedPanelDef(component);
  if (!def) return [];
  return def.fields.filter((field) => field.required).map((field) => field.key);
}
