import type { DetailFieldDef, DetailRow } from './detail-rows.types';

export function buildDetailRows<T>(item: T, fields: readonly DetailFieldDef<T>[]): DetailRow[] {
  const rows: DetailRow[] = [];

  for (const field of fields) {
    if (field.show && !field.show(item)) {
      continue;
    }

    const raw = field.getValue(item);
    const text =
      raw === null || raw === undefined || raw === ''
        ? (field.emptyText ?? '')
        : String(raw);

    if (field.omitWhenEmpty && !text.trim()) {
      continue;
    }

    rows.push({
      label: field.getLabel?.(item) ?? field.label,
      value: text.trim() ? text : field.emptyText ?? 'N/A',
      highlight: field.highlight?.(item)
    });
  }

  return rows;
}
