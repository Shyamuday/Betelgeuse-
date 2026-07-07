/** Maps PrescriptionOption.label / normalizedLabel to registry keys. */
export function normalizeMethodLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}
