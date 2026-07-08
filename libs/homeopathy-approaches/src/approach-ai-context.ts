import { caseSheetFieldsForSchema } from './case-sheet-schemas';
import { structuredPanelForComponent } from './approach-structured-panels';
import { specializedPanelDef } from './specialized-panel-defs';
import type { ApproachDataPayload, ApproachDefinition, ApproachFieldDef, ApproachStepComponent } from './types';

export type ApproachAiFieldContext = {
  key: string;
  label: string;
  value: string;
  promptKey?: string;
  suggestEndpoint?: string;
};

export type ApproachAiContext = {
  approachSlug: string;
  approachTitle: string;
  methodRationale?: string;
  panelPromptKeys: string[];
  fields: ApproachAiFieldContext[];
};

function pushField(
  target: ApproachAiFieldContext[],
  field: ApproachFieldDef,
  value: string | undefined,
  prefix?: string
) {
  const trimmed = value?.trim();
  if (!trimmed) return;
  target.push({
    key: prefix ? `${prefix}.${field.key}` : field.key,
    label: field.label,
    value: trimmed,
    promptKey: field.promptKey,
    suggestEndpoint: field.suggestEndpoint
  });
}

function collectFromFields(
  target: ApproachAiFieldContext[],
  fields: ApproachFieldDef[],
  data: Record<string, string> | undefined,
  prefix?: string
) {
  if (!data) return;
  for (const field of fields) {
    pushField(target, field, data[field.key], prefix);
  }
}

export function fieldsForStepComponent(component: ApproachStepComponent): ApproachFieldDef[] {
  const structured = structuredPanelForComponent(component);
  if (structured) return structured.def.fields;
  const specialized = specializedPanelDef(component);
  if (specialized) return specialized.fields;
  return [];
}

export function buildApproachAiContext(input: {
  approach: ApproachDefinition;
  methodRationale?: string | null;
  caseSheet?: Record<string, string> | null;
  approachData?: ApproachDataPayload | null;
}): ApproachAiContext {
  const fields: ApproachAiFieldContext[] = [];
  const panelPromptKeys: string[] = [];

  if (input.methodRationale?.trim()) {
    fields.push({
      key: 'methodRationale',
      label: 'Why this approach',
      value: input.methodRationale.trim(),
      promptKey: 'approach.methodRationale'
    });
  }

  const caseSheetFields = caseSheetFieldsForSchema(input.approach.caseSheetSchemaId);
  collectFromFields(fields, caseSheetFields, input.caseSheet || undefined, 'caseSheet');

  for (const step of input.approach.steps) {
    const structured = structuredPanelForComponent(step.component);
    if (structured) {
      if (structured.def.title) panelPromptKeys.push(step.component);
      collectFromFields(
        fields,
        structured.def.fields,
        (input.approachData?.[structured.dataKey] as Record<string, string> | undefined) || undefined,
        String(structured.dataKey)
      );
      continue;
    }

    const specialized = specializedPanelDef(step.component);
    if (!specialized) continue;
    if (specialized.aiPanelPromptKey) panelPromptKeys.push(specialized.aiPanelPromptKey);
    const dataKey = dataKeyForSpecializedComponent(step.component);
    if (!dataKey) continue;
    collectFromFields(
      fields,
      specialized.fields,
      (input.approachData?.[dataKey] as Record<string, string> | undefined) || undefined,
      dataKey
    );
  }

  return {
    approachSlug: input.approach.slug,
    approachTitle: input.approach.title,
    methodRationale: input.methodRationale?.trim() || undefined,
    panelPromptKeys,
    fields
  };
}

function dataKeyForSpecializedComponent(component: ApproachStepComponent): keyof ApproachDataPayload | null {
  switch (component) {
    case 'kent-hierarchy':
      return 'kentHierarchy';
    case 'sensation-mapper':
      return 'sensation';
    case 'miasm-selector':
      return 'miasmatic';
    case 'keynote-striking':
      return 'keynote';
    case 'scholten-mapper':
      return 'scholten';
    case 'sehgal-emotion':
      return 'sehgal';
    case 'integrative-follow-up':
      return 'integrativeFollowUp';
    case 'organon-lm-dosing':
      return 'organonLm';
    default:
      return null;
  }
}
