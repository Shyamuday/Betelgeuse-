import type { ApproachStep, ApproachStepComponent, ApproachWorkflowKind } from './types';

/** Workflow panels that belong in Case Analysis / repertory — not inline on Create Prescription. */
export const PRESCRIPTION_EXCLUDED_WORKFLOW_COMPONENTS = new Set<ApproachStepComponent>([
  'approach-overview',
  'intake-panel',
  'repertory-workspace',
  'remedy-results',
  'prescription-handoff'
]);

export function prescriptionInputSteps(steps: ApproachStep[]): ApproachStep[] {
  return steps.filter((step) => !PRESCRIPTION_EXCLUDED_WORKFLOW_COMPONENTS.has(step.component));
}

export function caseSheetTitleForSchema(
  schemaId: string,
  workflowKind?: ApproachWorkflowKind
): string {
  const titles: Record<string, string> = {
    'eight-box': '8-Box case structure',
    'organon-lm': 'Baseline case (Organon LM)',
    keynote: 'Totality review',
    scholten: 'Scholten case sheet',
    sehgal: 'Sehgal case sheet',
    pathological: 'Pathology case sheet',
    'integrative-follow-up': 'Integrative care plan',
    fibonacci: 'Fibonacci baseline case',
    tautopathy: 'Tautopathy case context',
    eizayaga: 'Eizayaga layer case sheet',
    vithoulkas: 'Vithoulkas essence case sheet',
    drainage: 'Drainage case sheet',
    hering: 'Follow-up baseline',
    'acute-fast': 'Acute case notes',
    combination: 'Combination notes',
    boenninghausen: 'Boenninghausen case sheet',
    boger: 'Boger case sheet',
    constitutional: 'Constitutional case sheet',
    clinical: 'Clinical case notes',
    kentian: 'Kentian case sheet',
    miasmatic: 'Miasmatic case sheet',
    sensation: 'Sensation case sheet',
    hybrid: 'Integration plan',
    protocol: 'Protocol notes',
    classical: 'Structured case sheet'
  };
  if (titles[schemaId]) return titles[schemaId];
  if (workflowKind === 'PROTOCOL_DRIVEN') return 'Protocol notes';
  return 'Structured case sheet';
}
