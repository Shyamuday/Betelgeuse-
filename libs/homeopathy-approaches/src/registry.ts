import { APPROACH_DEFINITIONS, DEFAULT_APPROACH } from './approach-definitions';
import { normalizeMethodLabel } from './normalize-method-label';
import type { ApproachDefinition } from './types';

const byNormalizedLabel = new Map<string, ApproachDefinition>(
  APPROACH_DEFINITIONS.map((item) => [item.methodNormalizedLabel, item])
);

export function resolveApproachByMethodLabel(label?: string | null): ApproachDefinition {
  if (!label?.trim()) return DEFAULT_APPROACH;
  const normalized = normalizeMethodLabel(label);
  return byNormalizedLabel.get(normalized) || DEFAULT_APPROACH;
}

export function resolveApproachBySlug(slug?: string | null): ApproachDefinition {
  if (!slug?.trim()) return DEFAULT_APPROACH;
  return APPROACH_DEFINITIONS.find((item) => item.slug === slug) || DEFAULT_APPROACH;
}

export function allApproachDefinitions(): ApproachDefinition[] {
  return APPROACH_DEFINITIONS;
}

export function approachOptionsForSelect(): Array<{ slug: string; label: string; workflowKind: string }> {
  return APPROACH_DEFINITIONS.map((item) => ({
    slug: item.slug,
    label: item.title,
    workflowKind: item.workflowKind
  }));
}
