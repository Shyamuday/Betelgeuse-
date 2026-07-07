/** Body/system groupings for clinic diseases — keys match `Disease.publicCategory`. */
export const DISEASE_PUBLIC_CATEGORIES = [
  { key: 'mental-disease', label: 'Mental disease' },
  { key: 'nervous-system', label: 'Nervous system' },
  { key: 'eye-vision', label: 'Eye and vision' },
  { key: 'ear-hearing', label: 'Ear and hearing' },
  { key: 'nose-throat-larynx', label: 'Nose throat larynx' },
  { key: 'gums-mouth-teeth-tongue', label: 'Gums mouth teeth tongue' },
  { key: 'chest-lungs-cough', label: 'Chest lungs cough' },
  { key: 'heart-blood-vessel', label: 'Heart blood vessel' },
  { key: 'digestive-system', label: 'Digestive system' },
  { key: 'urinary-system', label: 'Urinary system' },
  { key: 'genitals', label: 'Genitals' },
  { key: 'bones-joints-muscles', label: 'Bones joints muscles' },
  { key: 'skin-hair-nail', label: 'Skin hair nail' },
  { key: 'fever', label: 'Fever' },
  { key: 'miscellaneous', label: 'Miscellaneous' }
] as const;

export type DiseasePublicCategoryKey = (typeof DISEASE_PUBLIC_CATEGORIES)[number]['key'];

export const DISEASE_PUBLIC_CATEGORY_KEYS = DISEASE_PUBLIC_CATEGORIES.map((item) => item.key);

export const DEFAULT_DOCTOR_DISEASE_FEE_PAISE = 50_000;

export const DEFAULT_DISEASE_INTAKE_QUESTIONS = [
  'Please describe your main symptoms and how long you have had them.'
];
