import type { BanerjiProtocol } from './types';

/** Banerji-style protocol catalog — extend via admin later. */
export const BANERJI_PROTOCOL_CATALOG: BanerjiProtocol[] = [
  {
    id: 'banerji-hair-fall',
    disease: 'Hair Fall',
    name: 'Hair fall protocol',
    primaryRemedy: 'Natrum muriaticum',
    companionRemedy: 'Phosphoricum acidum',
    notes: 'Common Banerji-style combination; personalize after case review.'
  },
  {
    id: 'banerji-dandruff',
    disease: 'Dandruff',
    name: 'Dandruff protocol',
    primaryRemedy: 'Arsenicum album',
    companionRemedy: 'Sulphur',
    notes: 'Scalp scaling with itching; adjust if oily vs dry pattern differs.'
  },
  {
    id: 'banerji-alopecia',
    disease: 'Alopecia',
    name: 'Alopecia protocol',
    primaryRemedy: 'Fluoricum acidum',
    companionRemedy: 'Phosphorus',
    notes: 'Patchy hair loss presentations; rule out scarring alopecia.'
  },
  {
    id: 'banerji-eczema',
    disease: 'Eczema',
    name: 'Eczema protocol',
    primaryRemedy: 'Graphites',
    companionRemedy: 'Psorinum',
    notes: 'Use when skin dryness and oozing pattern match protocol indications.'
  },
  {
    id: 'banerji-acne',
    disease: 'Acne',
    name: 'Acne protocol',
    primaryRemedy: 'Hepar sulphuris',
    companionRemedy: 'Silicea',
    notes: 'Suppurative or slow-healing acne lesions.'
  },
  {
    id: 'banerji-psoriasis',
    disease: 'Psoriasis',
    name: 'Psoriasis protocol',
    primaryRemedy: 'Arsenicum album',
    companionRemedy: 'Petroleum',
    notes: 'Dry scaly plaques with itching; confirm constitutional fit.'
  },
  {
    id: 'banerji-migraine',
    disease: 'Migraine',
    name: 'Migraine protocol',
    primaryRemedy: 'Belladonna',
    companionRemedy: 'Glonoinum',
    notes: 'Acute throbbing presentations; adjust if gastric or visual aura dominates.'
  },
  {
    id: 'banerji-sinusitis',
    disease: 'Sinusitis',
    name: 'Sinusitis protocol',
    primaryRemedy: 'Kali bichromicum',
    companionRemedy: 'Pulsatilla',
    notes: 'Thick discharge and frontal pressure pattern.'
  },
  {
    id: 'banerji-hypertension',
    disease: 'Hypertension',
    name: 'Hypertension protocol',
    primaryRemedy: 'Rauwolfia serpentina',
    companionRemedy: 'Crataegus oxyacantha',
    notes: 'Adjunctive protocol; continue standard medical monitoring.'
  },
  {
    id: 'banerji-diabetes',
    disease: 'Diabetes Mellitus',
    name: 'Diabetes support protocol',
    primaryRemedy: 'Syzygium jambolanum',
    companionRemedy: 'Uranium nitricum',
    notes: 'Supportive protocol alongside glucose monitoring and medical care.'
  },
  {
    id: 'banerji-piles',
    disease: 'Piles',
    name: 'Piles protocol',
    primaryRemedy: 'Aesculus hippocastanum',
    companionRemedy: 'Nux vomica',
    notes: 'Bleeding / congestive piles with rectal fullness.'
  },
  {
    id: 'banerji-gastritis',
    disease: 'Chronic Gastritis',
    name: 'Chronic gastritis protocol',
    primaryRemedy: 'Arsenicum album',
    companionRemedy: 'Lycopodium',
    notes: 'Burning and dyspepsia-heavy presentations.'
  }
];

export function protocolsForDisease(diseaseName?: string | null): BanerjiProtocol[] {
  const query = diseaseName?.trim().toLowerCase();
  if (!query) return BANERJI_PROTOCOL_CATALOG;
  const matches = BANERJI_PROTOCOL_CATALOG.filter((item) => item.disease.toLowerCase().includes(query));
  return matches.length ? matches : BANERJI_PROTOCOL_CATALOG;
}

export function findProtocolById(protocolId?: string | null): BanerjiProtocol | undefined {
  if (!protocolId?.trim()) return undefined;
  return BANERJI_PROTOCOL_CATALOG.find((item) => item.id === protocolId);
}
