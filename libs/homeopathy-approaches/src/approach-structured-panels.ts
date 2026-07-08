import type { ApproachDataPayload, ApproachStepComponent, ApproachFieldDef } from './types';
import { approachField } from './approach-field-helpers';

export type StructuredPanelFieldDef = ApproachFieldDef;

export type ApproachStructuredPanelDef = {
  title: string;
  hint: string;
  fields: StructuredPanelFieldDef[];
  requiredKeys?: string[];
  combinationCatalog?: boolean;
};

export type StructuredPanelBinding = {
  dataKey: keyof ApproachDataPayload;
  def: ApproachStructuredPanelDef;
};

function fields(...items: StructuredPanelFieldDef[]): StructuredPanelFieldDef[] {
  return items;
}

export const STRUCTURED_APPROACH_PANELS: Record<ApproachStepComponent, StructuredPanelBinding | undefined> = {
  'approach-overview': undefined,
  'intake-panel': undefined,
  'case-sheet': undefined,
  'kent-hierarchy': undefined,
  'sensation-mapper': undefined,
  'miasm-selector': undefined,
  'protocol-selector': undefined,
  'repertory-workspace': undefined,
  'remedy-results': undefined,
  'prescription-handoff': undefined,
  'analysis-notes': undefined,
  'organon-lm-dosing': undefined,
  'keynote-striking': undefined,
  'scholten-mapper': undefined,
  'sehgal-emotion': undefined,
  'integrative-follow-up': undefined,
  'boenninghausen-lsm': {
    dataKey: 'boenninghausenLsm',
    def: {
      title: 'Boenninghausen symptom set',
      hint: 'Capture location, sensation, modality, and concomitant relationships before repertorization.',
      fields: fields(
        approachField('location', 'Location', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Anatomical site, laterality, radiation.',
          placeholder: 'Site, side, radiation…',
          rubricSearchable: true,
          promptKey: 'boenninghausen.location'
        }),
        approachField('sensation', 'Sensation', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Quality of the symptom (LSM framework).',
          placeholder: 'Burning, stitching, numbness…',
          rubricSearchable: true,
          promptKey: 'boenninghausen.sensation'
        }),
        approachField('modalities', 'Modalities (better / worse)', {
          rows: 3,
          wide: true,
          description: 'What ameliorates or aggravates the symptom.',
          placeholder: 'Better rest / worse motion…',
          rubricSearchable: true,
          promptKey: 'boenninghausen.modalities'
        }),
        approachField('concomitants', 'Concomitants', {
          rows: 2,
          wide: true,
          description: 'Symptoms accompanying the main complaint.',
          placeholder: 'Thirst with fever, nausea with pain…',
          rubricSearchable: true,
          promptKey: 'boenninghausen.concomitants'
        }),
        approachField('timeAggravation', 'Time aggravation', {
          rows: 2,
          description: 'Periodic or clock-time patterns.',
          placeholder: '3 a.m. waking, every 14 days…',
          promptKey: 'boenninghausen.timeAggravation'
        })
      ),
      requiredKeys: ['location', 'sensation']
    }
  },
  'boger-totality': {
    dataKey: 'bogerTotality',
    def: {
      title: 'Boger pathological totality',
      hint: 'Define pathological generals, time patterns, and concomitants for Boger-style analysis.',
      fields: fields(
        approachField('pathologicalTotality', 'Pathological totality', {
          rows: 4,
          wide: true,
          required: true,
          description: 'Pathological generals that define the case.',
          placeholder: 'Chronic inflammation, periodicity, tissue affinity…',
          rubricSearchable: true,
          promptKey: 'boger.pathologicalTotality'
        }),
        approachField('timePatterns', 'Time patterns', {
          rows: 2,
          wide: true,
          description: 'Clock-time, seasonal, or periodic aggravations.',
          placeholder: 'Worse 2–4 a.m., every spring…',
          promptKey: 'boger.timePatterns'
        }),
        approachField('concomitants', 'Concomitants', {
          rows: 2,
          wide: true,
          description: 'Associated symptoms in Boger’s concomitant sense.',
          placeholder: 'Thirst with chill, restlessness with pain…',
          rubricSearchable: true,
          promptKey: 'boger.concomitants'
        }),
        approachField('clinicalCorrelation', 'Clinical / investigation correlation', {
          rows: 3,
          wide: true,
          description: 'Objective findings supporting pathological totality.',
          placeholder: 'Labs, imaging, physical exam…',
          promptKey: 'boger.clinicalCorrelation',
          extractFrom: ['intake', 'media']
        })
      ),
      requiredKeys: ['pathologicalTotality']
    }
  },
  'constitutional-profile': {
    dataKey: 'constitutionalProfile',
    def: {
      title: 'Constitutional profile',
      hint: 'Map temperament, thermal state, and generals before particulars.',
      fields: fields(
        approachField('temperament', 'Temperament & constitution', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Innate constitution and reactive style.',
          placeholder: 'Sanguine, phlegmatic, lean, stout…',
          promptKey: 'constitutional.temperament'
        }),
        approachField('thermalState', 'Thermal preference', {
          rows: 2,
          required: true,
          description: 'Heat/cold tolerance and weather sensitivity.',
          placeholder: 'Chilly, wants covers, worse summer…',
          rubricSearchable: true,
          promptKey: 'constitutional.thermalState'
        }),
        approachField('appetiteThirst', 'Appetite & thirst', {
          rows: 2,
          description: 'Hunger patterns, cravings, aversions, thirst.',
          placeholder: 'Loss of appetite, desires sweets, thirstless…',
          rubricSearchable: true,
          promptKey: 'constitutional.appetiteThirst'
        }),
        approachField('sleepDreams', 'Sleep & dreams', {
          rows: 2,
          wide: true,
          description: 'Sleep quality, position, dreams, nightmares.',
          placeholder: 'Sleepless after 3 a.m., vivid dreams of water…',
          rubricSearchable: true,
          promptKey: 'constitutional.sleepDreams'
        }),
        approachField('mentalPicture', 'Mental picture', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Core mental/emotional portrait of the patient.',
          placeholder: 'Timid, conscientious, fear of poverty…',
          rubricSearchable: true,
          promptKey: 'constitutional.mentalPicture',
          suggestEndpoint: 'ai-extract-intake',
          extractFrom: ['intake', 'chat']
        })
      ),
      requiredKeys: ['temperament', 'thermalState', 'mentalPicture']
    }
  },
  'clinical-acute': {
    dataKey: 'clinicalAcute',
    def: {
      title: 'Acute clinical snapshot',
      hint: 'Fast OPD capture: diagnosis context, key symptoms, and organ affinity.',
      fields: fields(
        approachField('acutePresentation', 'Acute presentation', {
          rows: 2,
          wide: true,
          required: true,
          description: 'How the acute illness presents right now.',
          placeholder: 'Sudden high fever with chill and body ache…',
          rubricSearchable: true,
          promptKey: 'clinical.acutePresentation',
          suggestEndpoint: 'ai-extract-intake',
          extractFrom: ['intake']
        }),
        approachField('clinicalDiagnosis', 'Working clinical diagnosis', {
          rows: 2,
          description: 'Provisional or confirmed diagnosis.',
          placeholder: 'Viral fever / URTI / gastritis…',
          promptKey: 'clinical.clinicalDiagnosis'
        }),
        approachField('keyPrescribingSymptoms', 'Key prescribing symptoms', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Symptoms that will drive remedy choice.',
          placeholder: 'Restlessness, thirst, profuse sweat…',
          rubricSearchable: true,
          promptKey: 'clinical.keyPrescribingSymptoms',
          suggestEndpoint: 'ai-complete'
        }),
        approachField('organAffinity', 'Organ affinity', {
          rows: 2,
          description: 'Primary organ or system involved.',
          placeholder: 'Respiratory, GI, musculoskeletal…',
          rubricSearchable: true,
          promptKey: 'clinical.organAffinity'
        }),
        approachField('urgencyNotes', 'Urgency / red flags', {
          rows: 2,
          wide: true,
          description: 'Safety concerns or referral triggers.',
          placeholder: 'Chest pain, neuro deficit, dehydration…',
          promptKey: 'clinical.urgencyNotes'
        })
      ),
      requiredKeys: ['acutePresentation', 'keyPrescribingSymptoms']
    }
  },
  'predictive-pathology': {
    dataKey: 'predictivePathology',
    def: {
      title: 'Predictive pathology map',
      hint: 'Vijayakar-style pathology layering with expected response and follow-up forecast.',
      fields: fields(
        approachField('pathologyStage', 'Pathology stage', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Stage and nature of underlying disease process.',
          placeholder: 'Early functional / established structural…',
          promptKey: 'predictive.pathologyStage'
        }),
        approachField('tissueAffinity', 'Tissue / organ affinity', {
          rows: 2,
          wide: true,
          description: 'Primary tissue or organ involved.',
          placeholder: 'Connective tissue, liver, nervous system…',
          rubricSearchable: true,
          promptKey: 'predictive.tissueAffinity'
        }),
        approachField('predictedResponse', 'Predicted remedy response', {
          rows: 3,
          wide: true,
          description: 'Expected direction and pace of cure.',
          placeholder: 'Slow structural recovery, quick functional shift…',
          promptKey: 'predictive.predictedResponse'
        }),
        approachField('followUpForecast', 'Follow-up forecast', {
          rows: 3,
          wide: true,
          description: 'What to expect at each follow-up milestone.',
          placeholder: 'Aggravation window 3–7 days, then energy lift…',
          promptKey: 'predictive.followUpForecast'
        }),
        approachField('suppressionHistory', 'Suppression / palliation history', {
          rows: 2,
          wide: true,
          description: 'Prior suppressive treatments affecting prognosis.',
          placeholder: 'Long steroid course, suppressed skin eruptions…',
          promptKey: 'predictive.suppressionHistory',
          extractFrom: ['intake', 'priorCase']
        })
      ),
      requiredKeys: ['pathologyStage']
    }
  },
  'pathological-anchor': {
    dataKey: 'pathologicalAnchor',
    def: {
      title: 'Pathology prescribing anchor',
      hint: 'Anchor remedy selection on pathology stage and correlated objective findings.',
      fields: fields(
        approachField('pathologyStage', 'Pathology stage', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Stage and nature of disease process.',
          placeholder: 'Degenerative joint disease, chronic inflammation…',
          promptKey: 'pathologicalAnchor.pathologyStage'
        }),
        approachField('investigationTrends', 'Investigation trends', {
          rows: 3,
          wide: true,
          description: 'Lab/imaging trends over time.',
          placeholder: 'CRP declining, MRI stable, Hb improving…',
          promptKey: 'pathologicalAnchor.investigationTrends',
          extractFrom: ['intake', 'media']
        }),
        approachField('anchorSymptoms', 'Anchor prescribing symptoms', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Symptoms anchoring remedy to pathology.',
          placeholder: 'Burning pains, night aggravation, restlessness…',
          rubricSearchable: true,
          promptKey: 'pathologicalAnchor.anchorSymptoms',
          suggestEndpoint: 'ai-complete'
        }),
        approachField('differentialPathology', 'Differential pathology notes', {
          rows: 2,
          wide: true,
          description: 'Alternative pathological interpretations considered.',
          placeholder: 'Autoimmune vs degenerative vs infective…',
          promptKey: 'pathologicalAnchor.differentialPathology'
        })
      ),
      requiredKeys: ['pathologyStage', 'anchorSymptoms']
    }
  },
  'eight-box-guided': {
    dataKey: 'eightBoxGuided',
    def: {
      title: '8-box guided capture',
      hint: 'Walk through each clinical box before moving to repertorization.',
      fields: fields(
        approachField('patientConstitution', '1. Patient identity & constitution', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Age, sex, build, temperament, baseline vitality.',
          placeholder: 'Lean, chilly, anxious temperament…',
          promptKey: 'eightBox.patientConstitution',
          extractFrom: ['intake']
        }),
        approachField('chiefComplaints', '2. Chief complaints', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Primary complaints with onset and modalities.',
          placeholder: 'Headache 6 months, worse sun…',
          rubricSearchable: true,
          promptKey: 'eightBox.chiefComplaints',
          suggestEndpoint: 'ai-extract-intake',
          extractFrom: ['intake']
        }),
        approachField('presentIllness', '3. Present illness', {
          rows: 2,
          wide: true,
          description: 'Progression and triggers of current illness.',
          placeholder: 'Started after grief, gradually worsening…',
          promptKey: 'eightBox.presentIllness'
        }),
        approachField('pastFamilyHistory', '4. Past & family history', {
          rows: 2,
          wide: true,
          description: 'Personal and family disease background.',
          placeholder: 'Malaria, family TB, diabetes…',
          promptKey: 'eightBox.pastFamilyHistory',
          extractFrom: ['intake']
        }),
        approachField('mentalEmotional', '5. Mental / emotional', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Mood, fears, coping, emotional reactivity.',
          placeholder: 'Anxiety, irritability, weeping…',
          rubricSearchable: true,
          promptKey: 'eightBox.mentalEmotional',
          suggestEndpoint: 'ai-extract-intake',
          extractFrom: ['intake', 'chat']
        }),
        approachField('physicalGenerals', '6. Physical generals', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Thermal state, appetite, thirst, sleep, sweat.',
          placeholder: 'Chilly, thirstless, profuse night sweat…',
          rubricSearchable: true,
          promptKey: 'eightBox.physicalGenerals'
        }),
        approachField('particulars', '7. Particular symptoms', {
          rows: 2,
          wide: true,
          description: 'Localized symptoms with sensation and modality.',
          placeholder: 'Right-sided headache, stitching pain…',
          rubricSearchable: true,
          promptKey: 'eightBox.particulars'
        }),
        approachField('diagnosisPlan', '8. Diagnosis & plan', {
          rows: 2,
          wide: true,
          description: 'Working diagnosis and next clinical steps.',
          placeholder: 'Chronic migraine, plan repertorization…',
          promptKey: 'eightBox.diagnosisPlan'
        })
      ),
      requiredKeys: ['patientConstitution', 'chiefComplaints', 'mentalEmotional', 'physicalGenerals']
    }
  },
  'fibonacci-potency': {
    dataKey: 'fibonacciPotency',
    def: {
      title: 'Fibonacci potency plan',
      hint: 'Plan potency ladder, interval, and response checkpoints using Fibonacci sequencing.',
      fields: fields(
        approachField('startingPotency', 'Starting potency', {
          rows: 2,
          required: true,
          description: 'First potency in the Fibonacci ladder.',
          placeholder: '6C, 12C, 30C…',
          promptKey: 'fibonacci.startingPotency'
        }),
        approachField('fibonacciSequence', 'Fibonacci sequence plan', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Planned potency progression following Fibonacci numbers.',
          placeholder: 'e.g. 6C → 10C → 16C → 26C…',
          promptKey: 'fibonacci.fibonacciSequence'
        }),
        approachField('doseInterval', 'Dose interval', {
          rows: 2,
          description: 'Time between potency steps.',
          placeholder: 'Weekly, every 10 days, monthly…',
          promptKey: 'fibonacci.doseInterval'
        }),
        approachField('responseCheckpoints', 'Response checkpoints', {
          rows: 3,
          wide: true,
          description: 'Markers to assess before advancing potency.',
          placeholder: 'Energy up, sleep better, old symptoms return…',
          promptKey: 'fibonacci.responseCheckpoints'
        }),
        approachField('adjustmentRules', 'Adjustment rules', {
          rows: 2,
          wide: true,
          description: 'When to pause, repeat, or step back.',
          placeholder: 'Hold if aggravation > 3 days; repeat same if plateau…',
          promptKey: 'fibonacci.adjustmentRules'
        })
      ),
      requiredKeys: ['startingPotency', 'fibonacciSequence']
    }
  },
  'tautopathy-isopathy': {
    dataKey: 'tautopathyIsopathy',
    def: {
      title: 'Tautopathy / isopathy',
      hint: 'Document causal substance, potency rationale, and clearing timeline.',
      fields: fields(
        approachField('causalSubstance', 'Causal substance / agent', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Drug, vaccine, toxin, or substance causing illness.',
          placeholder: 'Fluoroquinolone, HPV vaccine, mercury exposure…',
          promptKey: 'tautopathy.causalSubstance',
          suggestEndpoint: 'ai-extract-intake',
          extractFrom: ['intake']
        }),
        approachField('exposureTimeline', 'Exposure timeline', {
          rows: 2,
          wide: true,
          description: 'When exposure occurred and duration.',
          placeholder: 'Ciprofloxacin course March 2024, 10 days…',
          promptKey: 'tautopathy.exposureTimeline'
        }),
        approachField('potencyRationale', 'Potency rationale', {
          rows: 2,
          wide: true,
          description: 'Why this potency and repetition for clearing.',
          placeholder: 'Start 30C tautopathic, sensitive patient…',
          promptKey: 'tautopathy.potencyRationale'
        }),
        approachField('clearingPlan', 'Clearing / detox plan', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Step-by-step tautopathic/isopathic plan.',
          placeholder: 'Potentized agent 30C weekly × 4, then assess…',
          promptKey: 'tautopathy.clearingPlan'
        }),
        approachField('followUpMarkers', 'Follow-up markers', {
          rows: 2,
          wide: true,
          description: 'Signs of clearing or aggravation to monitor.',
          placeholder: 'Tendon pain reducing, energy returning…',
          promptKey: 'tautopathy.followUpMarkers'
        })
      ),
      requiredKeys: ['causalSubstance', 'clearingPlan']
    }
  },
  'eizayaga-layers': {
    dataKey: 'eizayagaLayers',
    def: {
      title: 'Eizayaga layers of health',
      hint: 'Map lesion, functional, constitutional, and fundamental layers.',
      fields: fields(
        approachField('lesionLayer', 'Lesion layer', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Structural/organic damage layer.',
          placeholder: 'Joint deformity, fibrosis, organ damage…',
          promptKey: 'eizayaga.lesionLayer'
        }),
        approachField('functionalLayer', 'Functional layer', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Functional disturbance without fixed lesion.',
          placeholder: 'Dyspepsia, functional pain, reversible inflammation…',
          promptKey: 'eizayaga.functionalLayer'
        }),
        approachField('constitutionalLayer', 'Constitutional layer', {
          rows: 2,
          wide: true,
          description: 'Deep constitutional and inherited tendencies.',
          placeholder: 'Chilly, timid, family TB, suppressed eruptions…',
          promptKey: 'eizayaga.constitutionalLayer',
          extractFrom: ['intake']
        }),
        approachField('fundamentalLayer', 'Fundamental / miasmatic layer', {
          rows: 2,
          wide: true,
          description: 'Underlying miasmatic or fundamental layer.',
          placeholder: 'Sycotic base, tubercular inheritance…',
          promptKey: 'eizayaga.fundamentalLayer'
        }),
        approachField('layerPrescribingPlan', 'Layer-wise prescribing plan', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Which layer to treat first and sequencing.',
          placeholder: 'Functional layer first, then constitutional…',
          promptKey: 'eizayaga.layerPrescribingPlan'
        })
      ),
      requiredKeys: ['lesionLayer', 'functionalLayer', 'layerPrescribingPlan']
    }
  },
  'vithoulkas-essences': {
    dataKey: 'vithoulkasEssences',
    def: {
      title: 'Vithoulkas essences & levels',
      hint: 'Capture essence themes, level of health, and defense mechanism.',
      fields: fields(
        approachField('essenceTheme', 'Essence / central theme', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Central essence or theme of the patient.',
          placeholder: 'Need for approval, fear of failure, victimhood…',
          promptKey: 'vithoulkas.essenceTheme',
          suggestEndpoint: 'ai-extract-intake',
          extractFrom: ['intake', 'chat']
        }),
        approachField('levelOfHealth', 'Level of health', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Estimated level of health (A–F scale).',
          placeholder: 'Level C — good vitality, moderate pathology…',
          promptKey: 'vithoulkas.levelOfHealth'
        }),
        approachField('defenseMechanism', 'Defense mechanism', {
          rows: 2,
          wide: true,
          description: 'How the organism defends against stress.',
          placeholder: 'Suppression to skin, anxiety, somatization…',
          promptKey: 'vithoulkas.defenseMechanism'
        }),
        approachField('stressTimeline', 'Stress / shock timeline', {
          rows: 2,
          wide: true,
          description: 'Major shocks or stresses affecting health.',
          placeholder: 'Grief 2023, financial shock, surgery…',
          promptKey: 'vithoulkas.stressTimeline'
        }),
        approachField('remedyEssenceMatch', 'Remedy essence match', {
          rows: 2,
          wide: true,
          description: 'Remedy whose essence matches the patient.',
          placeholder: 'Lycopodium — performance anxiety, fear of failure…',
          promptKey: 'vithoulkas.remedyEssenceMatch'
        })
      ),
      requiredKeys: ['essenceTheme', 'levelOfHealth']
    }
  },
  'drainage-support': {
    dataKey: 'drainageSupport',
    def: {
      title: 'Drainage & organ support',
      hint: 'Plan drainage remedies, organ support, and sequencing with the simillimum.',
      fields: fields(
        approachField('targetOrgans', 'Target organs / systems', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Organs or systems needing drainage support.',
          placeholder: 'Sluggish liver, congested lymph, weak kidneys…',
          promptKey: 'drainage.targetOrgans'
        }),
        approachField('drainageRemedies', 'Drainage remedies', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Remedies chosen for drainage.',
          placeholder: 'Chelidonium, Berberis, lymphatic combo…',
          promptKey: 'drainage.drainageRemedies'
        }),
        approachField('supportRemedies', 'Organ support remedies', {
          rows: 2,
          wide: true,
          description: 'Tissue or organ support remedies.',
          placeholder: 'Carduus marianus for liver, Solidago for kidney…',
          promptKey: 'drainage.supportRemedies'
        }),
        approachField('sequencingNotes', 'Sequencing with simillimum', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Order of drainage, support, and simillimum.',
          placeholder: 'Drainage 2 weeks → simillimum → reassess…',
          promptKey: 'drainage.sequencingNotes'
        }),
        approachField('monitoringPlan', 'Monitoring plan', {
          rows: 2,
          wide: true,
          description: 'What to monitor during drainage phase.',
          placeholder: 'LFTs, energy, stool, skin eruptions…',
          promptKey: 'drainage.monitoringPlan'
        })
      ),
      requiredKeys: ['targetOrgans', 'drainageRemedies', 'sequencingNotes']
    }
  },
  'hering-tracking': {
    dataKey: 'heringTracking',
    def: {
      title: "Hering's law & aggravation tracker",
      hint: 'Track direction of cure, aggravations, and ameliorations after prescribing.',
      fields: fields(
        approachField('prePrescriptionState', 'Pre-prescription state', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Symptom baseline before the prescription.',
          placeholder: 'Headache 8/10 daily, poor sleep, low energy…',
          promptKey: 'hering.prePrescriptionState'
        }),
        approachField('aggravationPhase', 'Aggravation phase', {
          rows: 2,
          wide: true,
          description: 'Initial aggravation after remedy.',
          placeholder: 'Mild headache aggravation days 2–4, then easing…',
          promptKey: 'hering.aggravationPhase'
        }),
        approachField('directionOfCure', "Direction of cure (Hering's law)", {
          rows: 3,
          wide: true,
          required: true,
          description: 'Whether cure follows Hering’s law (above→below, within→out, recent→old).',
          placeholder: 'Skin eruption returning, old joint pain resurfaced…',
          promptKey: 'hering.directionOfCure'
        }),
        approachField('ameliorations', 'Ameliorations observed', {
          rows: 2,
          wide: true,
          description: 'Improvements noted since prescription.',
          placeholder: 'Sleep better, energy up, headache less frequent…',
          promptKey: 'hering.ameliorations'
        }),
        approachField('nextAction', 'Next action / potency decision', {
          rows: 2,
          wide: true,
          description: 'Whether to wait, repeat, change potency, or antidote.',
          placeholder: 'Wait — clear direction of cure; repeat 30C if plateau…',
          promptKey: 'hering.nextAction'
        })
      ),
      requiredKeys: ['prePrescriptionState', 'directionOfCure']
    }
  },
  'acute-fast-track': {
    dataKey: 'acuteFastTrack',
    def: {
      title: 'Acute fast-track',
      hint: 'Minimal acute workflow: complaint → key rubrics → remedy → potency.',
      fields: fields(
        approachField('acuteComplaint', 'Acute complaint', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Quick snapshot of the acute presentation.',
          placeholder: 'Sudden high fever with chill since yesterday…',
          rubricSearchable: true,
          promptKey: 'acuteFast.acuteComplaint',
          suggestEndpoint: 'ai-extract-intake',
          extractFrom: ['intake']
        }),
        approachField('onsetIntensity', 'Onset & intensity', {
          rows: 2,
          description: 'How sudden and how severe.',
          placeholder: 'Sudden onset, intensity 8/10…',
          promptKey: 'acuteFast.onsetIntensity'
        }),
        approachField('keyRubricSummary', 'Key rubric summary', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Minimum rubrics driving acute remedy choice.',
          placeholder: 'Restlessness, thirst, profuse sweat…',
          rubricSearchable: true,
          promptKey: 'acuteFast.keyRubricSummary',
          suggestEndpoint: 'ai-complete'
        }),
        approachField('selectedRemedy', 'Selected remedy', {
          rows: 1,
          required: true,
          description: 'Acute remedy chosen.',
          placeholder: 'e.g. Aconite, Belladonna, Arsenicum…',
          promptKey: 'acuteFast.selectedRemedy'
        }),
        approachField('potencyPlan', 'Potency & repetition plan', {
          rows: 2,
          wide: true,
          description: 'Potency and how often to repeat.',
          placeholder: '30C every 2 hours × 3 doses, then assess…',
          promptKey: 'acuteFast.potencyPlan'
        })
      ),
      requiredKeys: ['acuteComplaint', 'keyRubricSummary', 'selectedRemedy']
    }
  },
  'combination-remedy': {
    dataKey: 'combinationRemedy',
    def: {
      title: 'Combination / complex remedy',
      hint: 'Document complex remedy composition, indications, and personalization.',
      fields: fields(
        approachField('combinationName', 'Combination / complex name', {
          rows: 2,
          wide: true,
          required: true,
          description: 'Name of the complex or combination remedy.',
          placeholder: 'Complex for URTI, joint formula, etc.',
          promptKey: 'combination.combinationName'
        }),
        approachField('componentRemedies', 'Component remedies', {
          rows: 3,
          wide: true,
          description: 'Individual remedies in the combination.',
          placeholder: 'Aconite + Bryonia + Eupatorium…',
          promptKey: 'combination.componentRemedies'
        }),
        approachField('indicationMatch', 'Indication match', {
          rows: 3,
          wide: true,
          required: true,
          description: 'Why this combination fits the case.',
          placeholder: 'Acute URTI with cough, congestion, fever…',
          promptKey: 'combination.indicationMatch'
        }),
        approachField('personalizationNotes', 'Personalization notes', {
          rows: 2,
          wide: true,
          description: 'Adaptations for this specific patient.',
          placeholder: 'Reduce frequency in sensitive patient…',
          promptKey: 'combination.personalizationNotes'
        }),
        approachField('durationPlan', 'Duration & review plan', {
          rows: 2,
          wide: true,
          description: 'How long to use and when to review.',
          placeholder: '5 days, review if no improvement in 48h…',
          promptKey: 'combination.durationPlan'
        })
      ),
      requiredKeys: ['combinationName', 'indicationMatch']
    }
  }
};

export function structuredPanelForComponent(component: ApproachStepComponent | null | undefined) {
  if (!component) return null;
  return STRUCTURED_APPROACH_PANELS[component] ?? null;
}

export function emptyStructuredPanelData(binding: StructuredPanelBinding): Record<string, string> {
  const data: Record<string, string> = {};
  for (const field of binding.def.fields) {
    data[field.key] = '';
  }
  return data;
}

export function hasStructuredPanelContent(
  dataKey: keyof ApproachDataPayload,
  approachData?: Record<string, unknown> | null
) {
  const binding = Object.values(STRUCTURED_APPROACH_PANELS).find((item) => item?.dataKey === dataKey);
  const block = approachData?.[dataKey] as Record<string, string> | undefined;
  if (!block) return false;
  const requiredKeys = binding?.def.requiredKeys?.length
    ? binding.def.requiredKeys
    : binding?.def.fields.filter((field) => field.required).map((field) => field.key);
  if (!requiredKeys?.length) {
    return Object.values(block).some((value) => !!value?.trim());
  }
  return requiredKeys.every((key) => !!block[key]?.trim());
}

export function structuredPanelFieldLabels(): Map<string, string> {
  const labels = new Map<string, string>();
  for (const binding of Object.values(STRUCTURED_APPROACH_PANELS)) {
    if (!binding) continue;
    const prefix = humanizeDataKey(String(binding.dataKey));
    for (const field of binding.def.fields) {
      labels.set(`${binding.dataKey}.${field.key}`, `${prefix} · ${field.label}`);
      labels.set(field.key, field.label);
    }
  }
  return labels;
}

function humanizeDataKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (char) => char.toUpperCase());
}
