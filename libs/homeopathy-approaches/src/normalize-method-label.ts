/** Maps PrescriptionOption.label / normalizedLabel to registry keys. */
export function normalizeMethodLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, '')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
