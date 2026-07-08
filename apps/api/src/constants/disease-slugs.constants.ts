/** Maps canonical DB disease names to marketing detail-page slugs (`/treatments/:slug`). */
export const DISEASE_MARKETING_SLUG_BY_NAME: Record<string, string> = {
  'Hair Fall Treatment': 'hair-fall',
  'Hair fall': 'hair-fall',
  'Skin Issues': 'skin-care',
  'Chronic care (general)': 'chronic-care',
  'Diabetes mellitus support': 'diabetes-mellitus',
  'Hypertension': 'hypertension',
  'Chronic kidney disease support': 'chronic-kidney-disease',
  'Gallstone tendency': 'gallstone',
  'Liver cirrhosis support': 'liver-cirrhosis',
  'Piles': 'piles'
};

export function slugifyDiseaseName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'disease';
}

export function resolveDiseaseSlug(name: string): string {
  return DISEASE_MARKETING_SLUG_BY_NAME[name] ?? slugifyDiseaseName(name);
}
