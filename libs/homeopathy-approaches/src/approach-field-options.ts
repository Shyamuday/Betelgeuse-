export const SENSATION_KINGDOM_OPTIONS = [
  { value: 'Plant', label: 'Plant' },
  { value: 'Mineral', label: 'Mineral' },
  { value: 'Animal', label: 'Animal' },
  { value: 'Nosode', label: 'Nosode' },
  { value: 'Mixed / unclear', label: 'Mixed / unclear' }
] as const;

export const MIASM_OPTIONS = [
  { value: 'Psora', label: 'Psora' },
  { value: 'Sycosis', label: 'Sycosis' },
  { value: 'Syphilis', label: 'Syphilis' },
  { value: 'Tubercular', label: 'Tubercular' },
  { value: 'Cancer miasm', label: 'Cancer miasm' },
  { value: 'Mixed / layered', label: 'Mixed / layered' }
] as const;

export const SCHOLTEN_SERIES_OPTIONS = [
  { value: 'Hydrogen', label: 'Hydrogen series' },
  { value: 'Carbon', label: 'Carbon series' },
  { value: 'Silicium', label: 'Silicium series' },
  { value: 'Ferrum', label: 'Ferrum series' },
  { value: 'Silver', label: 'Silver series' },
  { value: 'Lanthanides', label: 'Lanthanides' },
  { value: 'Unknown', label: 'Unknown / to confirm' }
] as const;

export const SCHOLTEN_STAGE_OPTIONS = Array.from({ length: 18 }, (_, index) => {
  const stage = String(index + 1);
  return { value: stage, label: `Stage ${stage}` };
});

export const ORGANON_LM_DILUTION_OPTIONS = Array.from({ length: 8 }, (_, index) => {
  const glass = String(index + 1);
  return { value: glass, label: `Glass ${glass}` };
});
