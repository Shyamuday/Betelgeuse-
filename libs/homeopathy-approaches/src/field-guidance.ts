import type { ApproachFieldDef } from './types';

export type FieldOptionGroup = NonNullable<ApproachFieldDef['optionGroups']>[number];

const OPTION_BANKS = {
  constitution: [
    {
      title: 'Build',
      options: [
        'lean',
        'stout',
        'flabby',
        'muscular',
        'emaciated',
        'obese',
        'tall thin',
        'short stocky'
      ]
    },
    {
      title: 'Vitality',
      options: [
        'high vitality',
        'low vitality',
        'tires easily',
        'morning low',
        'evening low',
        'post-illness weakness'
      ]
    },
    {
      title: 'Temperament',
      options: [
        'anxious',
        'hurried',
        'reserved',
        'sensitive',
        'irritable',
        'yielding',
        'obstinate',
        'perfectionist'
      ]
    }
  ],
  lsmc: [
    {
      title: 'Location',
      options: [
        'right-sided',
        'left-sided',
        'alternating sides',
        'radiating',
        'localized',
        'shifting',
        'deep',
        'superficial'
      ]
    },
    {
      title: 'Sensation',
      options: [
        'burning',
        'stitching',
        'throbbing',
        'pressing',
        'cramping',
        'cutting',
        'numbness',
        'heaviness'
      ]
    },
    {
      title: 'Modalities',
      options: [
        'worse morning',
        'worse evening',
        'worse night',
        'worse heat',
        'worse cold',
        'better rest',
        'better motion',
        'better pressure'
      ]
    },
    {
      title: 'Concomitants',
      options: ['nausea', 'sweat', 'chill', 'anxiety', 'vertigo', 'weakness', 'thirst', 'urination']
    }
  ],
  mind: [
    {
      title: 'Fears',
      options: [
        'fear of death',
        'fear of disease',
        'fear of alone',
        'fear of dark',
        'fear of failure',
        'fear of poverty',
        'anticipatory anxiety'
      ]
    },
    {
      title: 'Reactions',
      options: [
        'anger suppressed',
        'anger explosive',
        'weeps easily',
        'consolation better',
        'consolation worse',
        'jealousy',
        'guilt',
        'humiliation'
      ]
    },
    {
      title: 'State',
      options: [
        'hurried',
        'indecisive',
        'perfectionist',
        'responsibility heavy',
        'suspicious',
        'sensitive to criticism',
        'desires company',
        'aversion company'
      ]
    }
  ],
  generals: [
    {
      title: 'Thermal',
      options: [
        'chilly',
        'hot patient',
        'cold hands/feet',
        'heat in palms/soles',
        'worse sun',
        'worse damp',
        'worse cold wind',
        'better warmth'
      ]
    },
    {
      title: 'Food',
      options: [
        'thirstless',
        'large thirst',
        'desire sweets',
        'desire salt',
        'desire sour',
        'desire spicy',
        'aversion milk',
        'aggravation fatty food'
      ]
    },
    {
      title: 'Sleep/Sweat',
      options: [
        'sleepless before midnight',
        'wakes 3 am',
        'unrefreshing sleep',
        'profuse sweat',
        'night sweat',
        'offensive sweat',
        'dreams vivid'
      ]
    }
  ],
  miasm: [
    {
      title: 'Miasm',
      options: [
        'psoric',
        'sycotic',
        'syphilitic',
        'tubercular',
        'cancerinic',
        'mixed miasm',
        'suppressed eruption',
        'drug layer'
      ]
    },
    {
      title: 'Family Load',
      options: [
        'diabetes',
        'hypertension',
        'asthma',
        'TB',
        'cancer',
        'autoimmune',
        'mental illness',
        'skin disease'
      ]
    },
    {
      title: 'Suppression',
      options: [
        'steroids',
        'antibiotics repeated',
        'hormonal pills',
        'surgery',
        'topical ointments',
        'vaccination layer',
        'painkiller overuse'
      ]
    }
  ],
  sensation: [
    {
      title: 'Sensation',
      options: [
        'stuck',
        'compressed',
        'expanding',
        'floating',
        'bound',
        'split',
        'empty',
        'heavy',
        'fragile',
        'attacked'
      ]
    },
    {
      title: 'Reaction',
      options: [
        'fight',
        'flight',
        'freeze',
        'withdrawal',
        'control',
        'panic',
        'collapse',
        'compensation'
      ]
    },
    {
      title: 'Kingdom Clue',
      options: [
        'mineral structure',
        'plant sensitivity',
        'animal competition',
        'nosode history',
        'sarcode organ affinity'
      ]
    }
  ],
  pathology: [
    {
      title: 'Stage',
      options: [
        'functional',
        'inflammatory',
        'recurrent',
        'structural',
        'degenerative',
        'destructive',
        'post-surgical',
        'drug-dependent'
      ]
    },
    {
      title: 'Risk',
      options: [
        'red flag absent',
        'red flag present',
        'needs lab',
        'needs imaging',
        'refer urgently',
        'co-management needed',
        'monitor vitals'
      ]
    },
    {
      title: 'Markers',
      options: ['pain score', 'BP', 'HbA1c', 'TSH', 'CBC', 'ESR/CRP', 'weight', 'sleep hours']
    }
  ],
  remedy: [
    {
      title: 'Strategy',
      options: [
        'constitutional remedy',
        'acute remedy',
        'intercurrent',
        'nosode',
        'sarcode',
        'drainage support',
        'organ support',
        'combination support'
      ]
    },
    {
      title: 'Potency',
      options: [
        'low potency',
        'medium potency',
        'high potency',
        'LM potency',
        'single dose',
        'repetition needed',
        'wait and watch',
        'sensitive patient'
      ]
    },
    {
      title: 'Follow-up',
      options: [
        'review in 48 hours',
        'review in 7 days',
        'review in 15 days',
        'track aggravation',
        'track amelioration',
        'stop on improvement'
      ]
    }
  ]
} satisfies Record<string, FieldOptionGroup[]>;

export function fieldOptionGroupsForField(field: ApproachFieldDef): FieldOptionGroup[] {
  if (field.optionGroups?.length) return field.optionGroups;

  const haystack =
    `${field.key} ${field.label} ${field.description || ''} ${field.promptKey || ''}`.toLowerCase();
  const groups: FieldOptionGroup[] = [];
  const add = (key: keyof typeof OPTION_BANKS) => {
    for (const group of OPTION_BANKS[key]) {
      if (!groups.some((item) => item.title === group.title)) groups.push(group);
    }
  };

  if (/(constitution|temperament|vitality|thermal|profile|personality)/.test(haystack))
    add('constitution');
  if (
    /(location|sensation|modality|modalities|concomitant|particular|complaint|symptom|rubric|keynote)/.test(
      haystack
    )
  )
    add('lsmc');
  if (/(mind|mental|emotion|fear|dream|delusion|sehgal|essence|state)/.test(haystack)) add('mind');
  if (/(general|appetite|thirst|sleep|sweat|stool|urine|food|desire|aversion)/.test(haystack))
    add('generals');
  if (/(miasm|family|past|suppression|layer|tautopathy|isopathy|eizayaga)/.test(haystack))
    add('miasm');
  if (/(sensation|kingdom|source|vital|sankaran|scholten|mineral|plant|animal)/.test(haystack))
    add('sensation');
  if (
    /(pathology|diagnosis|clinical|stage|lesion|organ|acute|risk|investigation|marker|objective)/.test(
      haystack
    )
  )
    add('pathology');
  if (
    /(remedy|potency|dose|prescription|plan|follow|lm|fibonacci|protocol|drainage|repetition|handoff)/.test(
      haystack
    )
  )
    add('remedy');

  return groups.slice(0, 4);
}

export function fieldDoctorGuidanceLines(field: ApproachFieldDef): string[] {
  const lines: string[] = [];

  if (field.description) {
    lines.push(field.description);
  }
  if (field.hint) {
    lines.push(`Tip: ${field.hint}`);
  }
  if (field.placeholder) {
    lines.push(`Example: ${field.placeholder}`);
  }
  if (field.required) {
    lines.push('Required — fill this before moving to the next step.');
  }
  if (fieldOptionGroupsForField(field).length) {
    lines.push(
      'Use the option chips below the field to quickly add common clinical clues, then edit the final wording.'
    );
  }

  switch (field.suggestEndpoint) {
    case 'ai-extract-intake':
      lines.push('Click “From intake” to pull matching answers from the patient questionnaire.');
      break;
    case 'ai-complete':
      lines.push(
        'Click “Suggest” to draft text from intake and fields already captured in this case.'
      );
      break;
    case 'ai-extract-media':
      lines.push('Click “From photos” to use observations from clinical images on this case.');
      break;
    default:
      break;
  }

  if (field.rubricSearchable) {
    lines.push('After entering symptoms, use “Search rubrics” to jump to the repertory.');
  }

  if (!lines.length) {
    lines.push('Enter clinical notes relevant to this part of the case.');
  }

  return lines;
}

export function fieldDoctorGuidance(field: ApproachFieldDef): string {
  return fieldDoctorGuidanceLines(field).join('\n\n');
}
