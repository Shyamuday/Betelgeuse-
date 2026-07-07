import type { BanerjiProtocol } from './types';

/** Starter Banerji-style protocol catalog — extend via admin later. */
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
    id: 'banerji-eczema',
    disease: 'Eczema',
    name: 'Eczema protocol',
    primaryRemedy: 'Graphites',
    companionRemedy: 'Psorinum',
    notes: 'Use when skin dryness and oozing pattern match protocol indications.'
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
  }
];

export function protocolsForDisease(diseaseName?: string | null): BanerjiProtocol[] {
  if (!diseaseName?.trim()) return BANERJI_PROTOCOL_CATALOG;
  const needle = diseaseName.trim().toLowerCase();
  const matched = BANERJI_PROTOCOL_CATALOG.filter(
    (item) => item.disease.toLowerCase().includes(needle) || needle.includes(item.disease.toLowerCase())
  );
  return matched.length ? matched : BANERJI_PROTOCOL_CATALOG;
}

export function findProtocolById(protocolId: string): BanerjiProtocol | undefined {
  return BANERJI_PROTOCOL_CATALOG.find((item) => item.id === protocolId);
}
