import type { ApproachFieldDef } from './types';

export function approachField(
  key: string,
  label: string,
  extra: Partial<ApproachFieldDef> = {}
): ApproachFieldDef {
  const multiline = extra.multiline ?? (extra.fieldType !== 'text' && extra.fieldType !== 'select');
  return {
    key,
    label,
    rows: multiline ? extra.rows ?? 2 : undefined,
    multiline,
    ...extra
  };
}

export function requiredFieldKeys(fields: ApproachFieldDef[]): string[] {
  return fields.filter((field) => field.required).map((field) => field.key);
}
