/** Client-side slug helper — mirrors API `resolveDiseaseSlug` for display links. */
export function slugifyDiseaseName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return slug || 'disease';
}

export function diseaseDetailPath(disease: { slug?: string | null; name: string }): string[] {
  const slug = disease.slug?.trim() || slugifyDiseaseName(disease.name);
  return ['/treatments', slug];
}
