import type { CaseSheetFieldDef, CaseSheetSchemaId } from './types';
import { approachField } from './approach-field-helpers';

const CLASSICAL_FIELDS: CaseSheetFieldDef[] = [
  approachField('chiefComplaint', 'Chief complaint', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Main reason for consultation in patient’s words.',
    placeholder: 'e.g. Recurrent headaches worse in sun…',
    rubricSearchable: true,
    promptKey: 'classical.chiefComplaint',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('onset', 'Onset & duration', {
    rows: 2,
    description: 'When it started, sudden vs gradual, progression.',
    placeholder: 'Sudden after grief / gradual over 2 years…',
    promptKey: 'classical.onset'
  }),
  approachField('location', 'Location / side', {
    rows: 2,
    description: 'Site, laterality, radiation.',
    placeholder: 'Left temple, extending to neck…',
    rubricSearchable: true,
    promptKey: 'classical.location'
  }),
  approachField('sensation', 'Sensation & character', {
    rows: 2,
    wide: true,
    description: 'Burning, stitching, throbbing, numbness, etc.',
    placeholder: 'Throbbing, bursting, burning…',
    rubricSearchable: true,
    promptKey: 'classical.sensation'
  }),
  approachField('modalitiesBetter', 'Better from', {
    rows: 2,
    description: 'Factors that ameliorate symptoms.',
    placeholder: 'Rest, warmth, pressure, open air…',
    rubricSearchable: true,
    promptKey: 'classical.modalitiesBetter'
  }),
  approachField('modalitiesWorse', 'Worse from', {
    rows: 2,
    description: 'Factors that aggravate symptoms.',
    placeholder: 'Motion, cold, morning, consolation…',
    rubricSearchable: true,
    promptKey: 'classical.modalitiesWorse'
  }),
  approachField('concomitants', 'Concomitants', {
    rows: 2,
    wide: true,
    description: 'Associated symptoms occurring with the chief complaint.',
    placeholder: 'Nausea with headache, thirst with fever…',
    rubricSearchable: true,
    promptKey: 'classical.concomitants'
  }),
  approachField('mentalEmotional', 'Mental / emotional', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Mind symptoms: mood, fears, dreams, coping style.',
    hint: 'Include changes since illness began.',
    placeholder: 'Anxiety, irritability, weeping, fear of death…',
    rubricSearchable: true,
    promptKey: 'classical.mentalEmotional',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake', 'chat']
  }),
  approachField('pastHistory', 'Past history', {
    rows: 2,
    description: 'Prior illnesses, surgeries, suppressions, traumas.',
    placeholder: 'Malaria 2019, appendectomy, steroid course…',
    promptKey: 'classical.pastHistory',
    extractFrom: ['intake', 'priorCase']
  }),
  approachField('familyHistory', 'Family history', {
    rows: 2,
    description: 'Hereditary or family disease patterns.',
    placeholder: 'Diabetes, TB, cancer, heart disease…',
    promptKey: 'classical.familyHistory',
    extractFrom: ['intake']
  }),
  approachField('examination', 'Examination / investigations', {
    rows: 2,
    wide: true,
    description: 'Physical findings and relevant reports.',
    placeholder: 'BP, labs, imaging, local examination…',
    promptKey: 'classical.examination',
    extractFrom: ['intake', 'media']
  })
];

const EIGHT_BOX_FIELDS: CaseSheetFieldDef[] = [
  approachField('patientInfo', 'Patient identity & constitution', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Age, sex, build, temperament, baseline vitality.',
    placeholder: 'Lean, chilly, anxious temperament…',
    promptKey: 'eightBox.patientInfo',
    extractFrom: ['intake']
  }),
  approachField('chiefComplaints', 'Chief complaints (duration & modalities)', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Primary complaints with onset, duration, better/worse.',
    placeholder: 'Headache 6 months, worse sun, better rest…',
    rubricSearchable: true,
    promptKey: 'eightBox.chiefComplaints',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('presentHistory', 'Present illness progression & triggers', {
    rows: 3,
    wide: true,
    description: 'How symptoms evolved and what triggered them.',
    placeholder: 'Started after grief, gradually worsening…',
    promptKey: 'eightBox.presentHistory'
  }),
  approachField('pastHistory', 'Past history', {
    rows: 2,
    description: 'Prior illnesses, surgeries, suppressions.',
    placeholder: 'Malaria, appendectomy, steroid course…',
    promptKey: 'eightBox.pastHistory',
    extractFrom: ['intake', 'priorCase']
  }),
  approachField('familyHistory', 'Family history', {
    rows: 2,
    description: 'Hereditary patterns and family disease load.',
    placeholder: 'TB, diabetes, cancer, heart disease…',
    promptKey: 'eightBox.familyHistory',
    extractFrom: ['intake']
  }),
  approachField('mentalState', 'Mental / emotional state', {
    rows: 3,
    required: true,
    description: 'Mood, fears, coping, emotional reactivity.',
    placeholder: 'Anxiety, irritability, weeping, fear of death…',
    rubricSearchable: true,
    promptKey: 'eightBox.mentalState',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake', 'chat']
  }),
  approachField('physicalGenerals', 'Physical generals', {
    rows: 3,
    required: true,
    description: 'Thermal state, appetite, thirst, sleep, sweat.',
    placeholder: 'Chilly, thirstless, profuse night sweat…',
    rubricSearchable: true,
    promptKey: 'eightBox.physicalGenerals'
  }),
  approachField('particularsAndDiagnosis', 'Particulars & clinical diagnosis', {
    rows: 3,
    wide: true,
    description: 'Localized symptoms and working diagnosis.',
    placeholder: 'Right-sided headache, URTI, gastritis…',
    rubricSearchable: true,
    promptKey: 'eightBox.particularsAndDiagnosis'
  })
];

const CONSTITUTIONAL_FIELDS: CaseSheetFieldDef[] = [
  approachField('temperament', 'Temperament & constitution', {
    rows: 2,
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
  }),
  approachField('chiefComplaint', 'Chief complaint', {
    rows: 2,
    description: 'Main presenting complaint in context of constitution.',
    placeholder: 'Chronic fatigue with anxiety…',
    rubricSearchable: true,
    promptKey: 'constitutional.chiefComplaint'
  }),
  approachField('modalities', 'Modalities', {
    rows: 2,
    description: 'General better/worse factors across the case.',
    placeholder: 'Better rest, worse cold damp weather…',
    rubricSearchable: true,
    promptKey: 'constitutional.modalities'
  }),
  approachField('pastFamilyHistory', 'Past & family history', {
    rows: 3,
    description: 'Personal and family disease background.',
    placeholder: 'Suppressed skin eruptions, family TB…',
    promptKey: 'constitutional.pastFamilyHistory',
    extractFrom: ['intake']
  })
];

const KENTIAN_FIELDS: CaseSheetFieldDef[] = [
  approachField('mentalGenerals', 'Mental generals (priority)', {
    rows: 4,
    wide: true,
    required: true,
    hint: 'Fears, anxieties, delusions, will/affection/intellect.',
    description: 'Kent’s highest hierarchy — mind symptoms first.',
    placeholder: 'Fear of poverty, irritability, weeping alone…',
    rubricSearchable: true,
    promptKey: 'kentian.mentalGenerals',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('physicalGenerals', 'Physical generals', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Thermal state, appetite, thirst, sleep, perspiration.',
    placeholder: 'Chilly, thirstless, profuse night sweat…',
    rubricSearchable: true,
    promptKey: 'kentian.physicalGenerals'
  }),
  approachField('particularSymptoms', 'Particular symptoms', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Localized symptoms with sensation and modality.',
    placeholder: 'Right-sided headache, stitching pain…',
    rubricSearchable: true,
    promptKey: 'kentian.particularSymptoms'
  }),
  approachField('strikingKeynotes', 'Striking / peculiar keynotes', {
    rows: 3,
    wide: true,
    description: 'Strange, rare, and peculiar symptoms.',
    placeholder: 'Desires head covered, cannot bear tight clothing…',
    rubricSearchable: true,
    promptKey: 'kentian.strikingKeynotes'
  }),
  approachField('causation', 'Causation & timeline', {
    rows: 2,
    description: 'Ailments from grief, fright, injury, suppression.',
    placeholder: 'After bereavement / head injury / vaccination…',
    promptKey: 'kentian.causation'
  }),
  approachField('potencyStrategy', 'Potency strategy notes', {
    rows: 2,
    description: 'Working notes on potency selection for this case.',
    placeholder: 'Sensitive patient — start low; chronic deep case…',
    promptKey: 'kentian.potencyStrategy'
  })
];

const BOENNINGHAUSEN_FIELDS: CaseSheetFieldDef[] = [
  approachField('location', 'Location', {
    rows: 2,
    required: true,
    description: 'Anatomical site, laterality, radiation.',
    placeholder: 'Left temple, extending to neck…',
    rubricSearchable: true,
    promptKey: 'boenninghausen.location'
  }),
  approachField('sensation', 'Sensation', {
    rows: 2,
    required: true,
    description: 'Quality of the symptom (LSM framework).',
    placeholder: 'Burning, stitching, numbness…',
    rubricSearchable: true,
    promptKey: 'boenninghausen.sensation'
  }),
  approachField('modalities', 'Modalities (better / worse)', {
    rows: 3,
    description: 'What ameliorates or aggravates the symptom.',
    placeholder: 'Better rest / worse motion…',
    rubricSearchable: true,
    promptKey: 'boenninghausen.modalities'
  }),
  approachField('concomitants', 'Concomitants', {
    rows: 2,
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
  }),
  approachField('extensions', 'Extensions / radiation', {
    rows: 2,
    description: 'How the symptom spreads or radiates.',
    placeholder: 'Pain from occiput to forehead…',
    rubricSearchable: true,
    promptKey: 'boenninghausen.extensions'
  })
];

const BOGER_FIELDS: CaseSheetFieldDef[] = [
  approachField('pathologicalTotality', 'Pathological totality', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Pathological generals that define the case.',
    placeholder: 'Chronic inflammation, periodicity, tissue affinity…',
    rubricSearchable: true,
    promptKey: 'boger.pathologicalTotality'
  }),
  approachField('timePatterns', 'Time patterns', {
    rows: 2,
    description: 'Clock-time, seasonal, or periodic aggravations.',
    placeholder: 'Worse 2–4 a.m., every spring…',
    promptKey: 'boger.timePatterns'
  }),
  approachField('modalities', 'Modalities', {
    rows: 2,
    description: 'Better/worse factors across pathological totality.',
    placeholder: 'Better warmth, worse damp cold…',
    rubricSearchable: true,
    promptKey: 'boger.modalities'
  }),
  approachField('concomitants', 'Concomitants', {
    rows: 2,
    description: 'Associated symptoms in Boger’s concomitant sense.',
    placeholder: 'Thirst with chill, restlessness with pain…',
    rubricSearchable: true,
    promptKey: 'boger.concomitants'
  }),
  approachField('clinicalFindings', 'Clinical findings', {
    rows: 2,
    description: 'Objective findings supporting pathological totality.',
    placeholder: 'Labs, imaging, physical exam…',
    promptKey: 'boger.clinicalFindings',
    extractFrom: ['intake', 'media']
  })
];

const SENSATION_FIELDS: CaseSheetFieldDef[] = [
  approachField('patientLanguage', 'Patient’s own words', {
    rows: 4,
    wide: true,
    required: true,
    description: 'Metaphors and exact phrases — do not paraphrase.',
    placeholder: 'Patient says: “I feel crushed, suffocated…”',
    promptKey: 'sensation.patientLanguage',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake', 'chat']
  }),
  approachField('coreSensation', 'Core sensation theme', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Central sensation image or word.',
    placeholder: 'Crushed, split, stuck, bound…',
    promptKey: 'sensation.coreSensation'
  }),
  approachField('activePassive', 'Active / passive experience', {
    rows: 2,
    description: 'Whether patient experiences sensation actively or passively.',
    placeholder: 'Active fight vs passive victim…',
    promptKey: 'sensation.activePassive'
  }),
  approachField('kingdomClues', 'Kingdom clues', {
    rows: 2,
    description: 'Plant, mineral, animal, or nosode indicators.',
    placeholder: 'Competition, structure, victim–predator…',
    promptKey: 'sensation.kingdomClues'
  }),
  approachField('miasmHints', 'Miasm hints', {
    rows: 2,
    description: 'Underlying miasmatic tone in sensation language.',
    placeholder: 'Persecution, growth, destruction…',
    promptKey: 'sensation.miasmHints'
  }),
  approachField('remedyFamilyNotes', 'Remedy family notes', {
    rows: 3,
    wide: true,
    description: 'Working hypothesis for remedy family/group.',
    placeholder: 'Snake, Carbon, Muriaticum group…',
    promptKey: 'sensation.remedyFamilyNotes'
  })
];

const MIASMATIC_FIELDS: CaseSheetFieldDef[] = [
  approachField('presentingLayer', 'Presenting layer', {
    rows: 2,
    required: true,
    description: 'Which miasmatic layer is active now.',
    placeholder: 'Functional overlay on sycotic base…',
    promptKey: 'miasmatic.presentingLayer'
  }),
  approachField('dominantMiasm', 'Dominant miasm', {
    rows: 2,
    required: true,
    description: 'Primary miasm driving the case.',
    placeholder: 'Psora / Sycosis / Syphilis / Tubercular…',
    promptKey: 'miasmatic.dominantMiasm'
  }),
  approachField('psoraSigns', 'Psora signs', {
    rows: 3,
    description: 'Functional, hypersensitive, changeable symptoms.',
    placeholder: 'Itching, anxiety, periodicity…',
    promptKey: 'miasmatic.psoraSigns'
  }),
  approachField('sycosisSigns', 'Sycosis signs', {
    rows: 3,
    description: 'Growth, retention, rheumatic, warty tendencies.',
    placeholder: 'Warts, cysts, rheumatism, overproduction…',
    promptKey: 'miasmatic.sycosisSigns'
  }),
  approachField('syphilisSigns', 'Syphilis signs', {
    rows: 3,
    description: 'Destructive, ulcerative, night aggravation.',
    placeholder: 'Ulcers, bone pains, deformity…',
    promptKey: 'miasmatic.syphilisSigns'
  }),
  approachField('familyMiasm', 'Family miasm pattern', {
    rows: 2,
    description: 'Inherited disease patterns in family.',
    placeholder: 'TB, cancer, diabetes, addictions…',
    promptKey: 'miasmatic.familyMiasm',
    extractFrom: ['intake']
  }),
  approachField('constitutionalOverlay', 'Constitutional overlay', {
    rows: 3,
    wide: true,
    description: 'Constitutional symptoms modifying miasmatic expression.',
    placeholder: 'Chilly, thirsty, timid constitution…',
    promptKey: 'miasmatic.constitutionalOverlay'
  })
];

const PROTOCOL_FIELDS: CaseSheetFieldDef[] = [
  approachField('confirmedDiagnosis', 'Confirmed diagnosis', {
    rows: 2,
    required: true,
    description: 'Established diagnosis guiding protocol selection.',
    placeholder: 'Allergic rhinitis, PCOS, migraine prophylaxis…',
    promptKey: 'protocol.confirmedDiagnosis'
  }),
  approachField('protocolNotes', 'Protocol personalization', {
    rows: 3,
    wide: true,
    required: true,
    description: 'How the standard protocol is adapted for this patient.',
    placeholder: 'Mild variant — reduce repetition; add drainage support…',
    promptKey: 'protocol.protocolNotes'
  }),
  approachField('contraindications', 'Contraindications / cautions', {
    rows: 2,
    description: 'Safety limits, pregnancy, drug interactions.',
    placeholder: 'Pregnancy, liver impairment, known allergy…',
    promptKey: 'protocol.contraindications',
    extractFrom: ['intake']
  }),
  approachField('followUpPlan', 'Follow-up plan', {
    rows: 2,
    description: 'Review interval and success markers.',
    placeholder: 'Review in 2 weeks; track symptom score…',
    promptKey: 'protocol.followUpPlan'
  })
];

const CLINICAL_FIELDS: CaseSheetFieldDef[] = [
  approachField('clinicalDiagnosis', 'Clinical diagnosis', {
    rows: 2,
    required: true,
    description: 'Working or confirmed clinical diagnosis.',
    placeholder: 'Viral fever, URTI, gastritis…',
    promptKey: 'clinical.clinicalDiagnosis'
  }),
  approachField('pathologyFindings', 'Pathology / investigation findings', {
    rows: 3,
    description: 'Labs, imaging, and objective findings.',
    placeholder: 'CRP elevated, X-ray clear, Hb low…',
    promptKey: 'clinical.pathologyFindings',
    extractFrom: ['intake', 'media']
  }),
  approachField('keySymptoms', 'Key prescribing symptoms', {
    rows: 3,
    required: true,
    description: 'Symptoms that will drive remedy choice.',
    placeholder: 'Restlessness, thirst, profuse sweat…',
    rubricSearchable: true,
    promptKey: 'clinical.keySymptoms',
    suggestEndpoint: 'ai-complete'
  }),
  approachField('organAffinity', 'Organ affinity', {
    rows: 2,
    description: 'Primary organ or system involved.',
    placeholder: 'Respiratory, GI, musculoskeletal…',
    rubricSearchable: true,
    promptKey: 'clinical.organAffinity'
  }),
  approachField('acuteChronicContext', 'Acute vs chronic context', {
    rows: 2,
    description: 'Whether this is acute flare, chronic maintenance, or mixed.',
    placeholder: 'Acute URTI on chronic asthma base…',
    promptKey: 'clinical.acuteChronicContext'
  })
];

const HYBRID_FIELDS: CaseSheetFieldDef[] = [
  approachField('primaryPath', 'Primary approach path used', {
    rows: 2,
    required: true,
    description: 'Main method driving remedy selection.',
    placeholder: 'Kentian hierarchy with sensation overlay…',
    promptKey: 'hybrid.primaryPath'
  }),
  approachField('secondaryPath', 'Secondary / supportive path', {
    rows: 2,
    description: 'Supporting method for confirmation or dosing.',
    placeholder: 'Miasmatic layer for potency; Scholten for mineral hint…',
    promptKey: 'hybrid.secondaryPath'
  }),
  approachField('integrationNotes', 'How approaches are integrated', {
    rows: 4,
    wide: true,
    required: true,
    description: 'Explain how multiple methods inform one prescription.',
    placeholder: 'Mental generals from Kent + core sensation from Sankaran…',
    promptKey: 'hybrid.integrationNotes'
  }),
  approachField('chiefComplaint', 'Chief complaint summary', {
    rows: 2,
    description: 'Brief complaint summary anchoring the hybrid analysis.',
    placeholder: 'Chronic anxiety with recurrent headaches…',
    promptKey: 'hybrid.chiefComplaint',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  })
];

const ORGANON_LM_FIELDS: CaseSheetFieldDef[] = [
  approachField('baselineTotality', 'Baseline totality summary', {
    rows: 4,
    wide: true,
    required: true,
    description: 'Complete symptom picture before LM dosing begins.',
    placeholder: 'Mental + physical generals + key particulars…',
    rubricSearchable: true,
    promptKey: 'organonLm.baselineTotality',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('vitalitySensitivity', 'Vitality & sensitivity profile', {
    rows: 3,
    wide: true,
    required: true,
    hint: 'Assess if patient is hypersensitive, depleted, or robust before LM dosing.',
    description: 'Guides starting LM potency and repetition.',
    placeholder: 'Hypersensitive, easily aggravated, low vitality…',
    promptKey: 'organonLm.vitalitySensitivity'
  }),
  approachField('previousPotencyResponse', 'Previous potency / remedy response', {
    rows: 3,
    description: 'How patient responded to prior potencies or remedies.',
    placeholder: 'Aggravation on 200C, brief amelioration on 30C…',
    promptKey: 'organonLm.previousPotencyResponse',
    extractFrom: ['priorCase']
  }),
  approachField('aggravationHistory', 'Aggravation / proving history', {
    rows: 2,
    description: 'Past homeopathic aggravations or provings.',
    placeholder: 'Severe skin aggravation after Sulphur 1M…',
    promptKey: 'organonLm.aggravationHistory'
  }),
  approachField('followUpObservations', 'Follow-up observations to monitor', {
    rows: 3,
    description: 'What to track between LM doses.',
    placeholder: 'Sleep, energy, old symptoms returning, aggravation window…',
    promptKey: 'organonLm.followUpObservations'
  })
];

const KEYNOTE_FIELDS: CaseSheetFieldDef[] = [
  approachField('totalitySummary', 'Full totality summary', {
    rows: 4,
    wide: true,
    required: true,
    description: 'Complete case picture before keynote selection.',
    placeholder: 'Mind, generals, particulars with modalities…',
    rubricSearchable: true,
    promptKey: 'keynote.totalitySummary',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('generalsReview', 'Generals supporting the case', {
    rows: 3,
    description: 'Physical and mental generals confirming the keynote.',
    placeholder: 'Chilly, thirstless, timid, weeping…',
    rubricSearchable: true,
    promptKey: 'keynote.generalsReview'
  }),
  approachField('particularsReview', 'Particulars & modalities', {
    rows: 3,
    description: 'Localized symptoms with sensation and modality.',
    placeholder: 'Right-sided headache, worse sun, better pressure…',
    rubricSearchable: true,
    promptKey: 'keynote.particularsReview'
  }),
  approachField('consistencyCheck', 'Consistency check notes', {
    rows: 2,
    hint: 'Does the keynote fit the broader totality?',
    description: 'Verify keynote is not isolated from the whole case.',
    placeholder: 'Keynote confirmed by generals and causation…',
    promptKey: 'keynote.consistencyCheck'
  })
];

const PATHOLOGICAL_FIELDS: CaseSheetFieldDef[] = [
  approachField('pathologyStage', 'Pathology stage / disease process', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Stage and nature of underlying disease process.',
    placeholder: 'Early functional / established structural / degenerative…',
    promptKey: 'pathological.pathologyStage'
  }),
  approachField('clinicalDiagnosis', 'Clinical diagnosis', {
    rows: 2,
    required: true,
    description: 'Working or confirmed diagnosis.',
    placeholder: 'Rheumatoid arthritis, chronic sinusitis…',
    promptKey: 'pathological.clinicalDiagnosis'
  }),
  approachField('investigationFindings', 'Investigation / report findings', {
    rows: 3,
    description: 'Labs, imaging, biopsy, and trends.',
    placeholder: 'RF positive, MRI shows degeneration…',
    promptKey: 'pathological.investigationFindings',
    extractFrom: ['intake', 'media']
  }),
  approachField('pathologyCorrelatedSymptoms', 'Symptoms correlating with pathology', {
    rows: 3,
    description: 'Subjective symptoms matching objective pathology.',
    placeholder: 'Morning stiffness matching inflammatory markers…',
    rubricSearchable: true,
    promptKey: 'pathological.pathologyCorrelatedSymptoms'
  }),
  approachField('prescribingAnchor', 'Prescribing anchor symptoms', {
    rows: 3,
    required: true,
    description: 'Symptoms that anchor remedy choice to pathology.',
    placeholder: 'Burning pains, night aggravation, restlessness…',
    rubricSearchable: true,
    promptKey: 'pathological.prescribingAnchor',
    suggestEndpoint: 'ai-complete'
  })
];

const SEHGAL_FIELDS: CaseSheetFieldDef[] = [
  approachField('presentingComplaint', 'Presenting complaint', {
    rows: 2,
    required: true,
    description: 'Main complaint as patient presents in clinic.',
    placeholder: 'Chest tightness with anxiety attacks…',
    promptKey: 'sehgal.presentingComplaint',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('emotionalPresentation', 'Emotional presentation in clinic', {
    rows: 3,
    wide: true,
    required: true,
    description: 'How emotion shows in the consultation room.',
    placeholder: 'Weeping easily, suppressed anger, fear of abandonment…',
    promptKey: 'sehgal.emotionalPresentation',
    extractFrom: ['intake', 'chat']
  }),
  approachField('physicalCorrelation', 'Physical symptom correlation', {
    rows: 3,
    description: 'Body symptoms linked to emotional disturbance.',
    placeholder: 'Palpitation when anxious, headache after anger…',
    rubricSearchable: true,
    promptKey: 'sehgal.physicalCorrelation'
  }),
  approachField('timelineTrigger', 'Timeline & emotional trigger', {
    rows: 2,
    description: 'When it started and what emotional event triggered it.',
    placeholder: 'After divorce / job loss / bereavement…',
    promptKey: 'sehgal.timelineTrigger'
  })
];

const INTEGRATIVE_FOLLOW_UP_FIELDS: CaseSheetFieldDef[] = [
  approachField('chronicDiagnosisContext', 'Chronic diagnosis context', {
    rows: 2,
    required: true,
    description: 'Established chronic conditions being followed.',
    placeholder: 'Type 2 diabetes, hypothyroidism, hypertension…',
    promptKey: 'integrative.chronicDiagnosisContext',
    extractFrom: ['intake']
  }),
  approachField('comorbidityNotes', 'Comorbidities & medications', {
    rows: 3,
    description: 'Concurrent conditions and allopathic medications.',
    placeholder: 'Metformin 500mg, levothyroxine; GERD, anxiety…',
    promptKey: 'integrative.comorbidityNotes',
    extractFrom: ['intake']
  }),
  approachField('homeopathyPlan', 'Homeopathy plan summary', {
    rows: 3,
    required: true,
    description: 'Current remedy, potency, and repetition plan.',
    placeholder: 'Lycopodium 30C weekly; monitor liver enzymes…',
    promptKey: 'integrative.homeopathyPlan'
  }),
  approachField('followUpCadence', 'Follow-up cadence', {
    rows: 2,
    description: 'How often patient is reviewed.',
    placeholder: 'Every 4 weeks; sooner if aggravation…',
    promptKey: 'integrative.followUpCadence'
  }),
  approachField('patientReportedGoals', 'Patient-reported goals', {
    rows: 2,
    description: 'What the patient wants to improve.',
    placeholder: 'Better sleep, less joint pain, reduce anxiety…',
    promptKey: 'integrative.patientReportedGoals',
    extractFrom: ['intake', 'chat']
  })
];

const SCHOLTEN_FIELDS: CaseSheetFieldDef[] = [
  approachField('lifeTheme', 'Life theme / pattern', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Recurring life pattern or central issue.',
    placeholder: 'Responsibility, performance, isolation, betrayal…',
    promptKey: 'scholten.lifeTheme',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake', 'chat']
  }),
  approachField('mineralAffinity', 'Mineral affinity clues', {
    rows: 2,
    description: 'Hints pointing to a mineral series or group.',
    placeholder: 'Structure, duty, control → Iron series…',
    promptKey: 'scholten.mineralAffinity'
  }),
  approachField('confirmatorySymptoms', 'Confirmatory symptoms from totality', {
    rows: 3,
    wide: true,
    description: 'Totality symptoms confirming mineral hypothesis.',
    placeholder: 'Chilly, conscientious, fear of failure…',
    rubricSearchable: true,
    promptKey: 'scholten.confirmatorySymptoms'
  }),
  approachField('differentialMinerals', 'Differential mineral remedies', {
    rows: 2,
    description: 'Shortlist of mineral remedies under consideration.',
    placeholder: 'Calc carb vs Calc phos vs Kali carb…',
    promptKey: 'scholten.differentialMinerals'
  })
];

const FIBONACCI_FIELDS: CaseSheetFieldDef[] = [
  approachField('baselineTotality', 'Baseline totality', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Symptom picture before Fibonacci potency ladder.',
    placeholder: 'Key generals and particulars for remedy selection…',
    rubricSearchable: true,
    promptKey: 'fibonacci.baselineTotality',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('selectedRemedy', 'Selected remedy', {
    rows: 1,
    required: true,
    description: 'Remedy chosen for Fibonacci dosing.',
    placeholder: 'e.g. Silica, Nat mur…',
    promptKey: 'fibonacci.selectedRemedy'
  }),
  approachField('sensitivityNotes', 'Sensitivity notes', {
    rows: 2,
    wide: true,
    description: 'Patient sensitivity guiding potency steps.',
    placeholder: 'Highly sensitive — start low, extend intervals…',
    promptKey: 'fibonacci.sensitivityNotes'
  })
];

const TAUTOPATHY_FIELDS: CaseSheetFieldDef[] = [
  approachField('causalAgent', 'Causal agent summary', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Drug, vaccine, toxin, or substance causing illness.',
    placeholder: 'Fluoroquinolone course, HPV vaccine, mercury exposure…',
    promptKey: 'tautopathy.causalAgent',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('symptomPicture', 'Symptom picture', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Symptoms arising from or linked to the causal agent.',
    placeholder: 'Tendon pain after antibiotic, fatigue after vaccine…',
    rubricSearchable: true,
    promptKey: 'tautopathy.symptomPicture'
  }),
  approachField('previousInterventions', 'Previous interventions', {
    rows: 2,
    description: 'Prior detox, tautopathic, or isopathic attempts.',
    placeholder: 'Prior potentized antibiotic 30C with brief relief…',
    promptKey: 'tautopathy.previousInterventions',
    extractFrom: ['priorCase']
  })
];

const EIZAYAGA_FIELDS: CaseSheetFieldDef[] = [
  approachField('lesionSummary', 'Lesion layer summary', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Structural/organic damage layer.',
    placeholder: 'Joint deformity, fibrosis, organ damage…',
    promptKey: 'eizayaga.lesionSummary'
  }),
  approachField('functionalSummary', 'Functional layer summary', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Functional disturbance without fixed lesion.',
    placeholder: 'Dyspepsia, functional pain, reversible inflammation…',
    promptKey: 'eizayaga.functionalSummary'
  }),
  approachField('constitutionalSummary', 'Constitutional summary', {
    rows: 2,
    wide: true,
    description: 'Deep constitutional and inherited tendencies.',
    placeholder: 'Chilly, timid, family TB, suppressed eruptions…',
    promptKey: 'eizayaga.constitutionalSummary',
    extractFrom: ['intake']
  })
];

const VITHOULKAS_FIELDS: CaseSheetFieldDef[] = [
  approachField('essenceSummary', 'Essence summary', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Central essence or theme of the patient.',
    placeholder: 'Need for approval, fear of failure, victimhood…',
    promptKey: 'vithoulkas.essenceSummary',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake', 'chat']
  }),
  approachField('levelOfHealthNotes', 'Level of health notes', {
    rows: 2,
    wide: true,
    description: 'Estimated level of health and defense capacity.',
    placeholder: 'Level C — good vitality, moderate pathology…',
    promptKey: 'vithoulkas.levelOfHealthNotes'
  }),
  approachField('totalitySupport', 'Supporting totality', {
    rows: 3,
    wide: true,
    description: 'Generals and particulars supporting essence match.',
    placeholder: 'Chilly, thirstless, weeping, right-sided complaints…',
    rubricSearchable: true,
    promptKey: 'vithoulkas.totalitySupport'
  })
];

const DRAINAGE_FIELDS: CaseSheetFieldDef[] = [
  approachField('organImpairment', 'Organ impairment summary', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Organs or systems needing drainage support.',
    placeholder: 'Sluggish liver, congested lymph, weak kidneys…',
    promptKey: 'drainage.organImpairment'
  }),
  approachField('simillimumNotes', 'Simillimum notes', {
    rows: 3,
    wide: true,
    description: 'Working simillimum and how drainage supports it.',
    placeholder: 'Lycopodium simillimum; liver drainage before repeat…',
    promptKey: 'drainage.simillimumNotes'
  }),
  approachField('supportPlan', 'Support plan summary', {
    rows: 2,
    wide: true,
    description: 'Drainage remedies, organ support, and sequencing.',
    placeholder: 'Chelidonium drainage → wait → simillimum repeat…',
    promptKey: 'drainage.supportPlan'
  })
];

const HERING_FIELDS: CaseSheetFieldDef[] = [
  approachField('prescriptionBaseline', 'Prescription baseline', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Remedy and potency given at baseline.',
    placeholder: 'Nat mur 200C single dose on 1 Mar…',
    promptKey: 'hering.prescriptionBaseline'
  }),
  approachField('chiefComplaintSnapshot', 'Chief complaint snapshot', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Chief complaint state at time of prescription.',
    placeholder: 'Headache 8/10, daily, worse morning…',
    promptKey: 'hering.chiefComplaintSnapshot'
  }),
  approachField('followUpFocus', 'Follow-up focus', {
    rows: 2,
    description: 'What to monitor for Hering’s direction of cure.',
    placeholder: 'Old skin eruption returning, sleep improving, energy…',
    promptKey: 'hering.followUpFocus'
  })
];

const ACUTE_FAST_FIELDS: CaseSheetFieldDef[] = [
  approachField('acuteSummary', 'Acute summary', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Quick snapshot of the acute presentation.',
    placeholder: 'Sudden high fever with chill since yesterday…',
    rubricSearchable: true,
    promptKey: 'acuteFast.acuteSummary',
    suggestEndpoint: 'ai-extract-intake',
    extractFrom: ['intake']
  }),
  approachField('keySymptoms', 'Key symptoms', {
    rows: 2,
    wide: true,
    required: true,
    description: 'Minimum symptoms needed for acute prescribing.',
    placeholder: 'Restlessness, thirst, profuse sweat…',
    rubricSearchable: true,
    promptKey: 'acuteFast.keySymptoms',
    suggestEndpoint: 'ai-complete'
  }),
  approachField('safetyNotes', 'Safety notes', {
    rows: 2,
    description: 'Red flags or referral triggers.',
    placeholder: 'Chest pain, altered consciousness, dehydration…',
    promptKey: 'acuteFast.safetyNotes'
  })
];

const COMBINATION_FIELDS: CaseSheetFieldDef[] = [
  approachField('indicationSummary', 'Indication summary', {
    rows: 3,
    wide: true,
    required: true,
    description: 'Why a combination/complex remedy fits this case.',
    placeholder: 'Acute URTI with cough and congestion — complex X…',
    promptKey: 'combination.indicationSummary'
  }),
  approachField('personalization', 'Personalization notes', {
    rows: 2,
    wide: true,
    description: 'How the complex is adapted for this patient.',
    placeholder: 'Reduce frequency in sensitive patient…',
    promptKey: 'combination.personalization'
  }),
  approachField('durationReview', 'Duration & review', {
    rows: 2,
    description: 'How long to use and when to review.',
    placeholder: '5 days, review if no improvement in 48h…',
    promptKey: 'combination.durationReview'
  })
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
