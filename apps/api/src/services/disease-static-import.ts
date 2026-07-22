import type { StaticDiseasePageImport } from '../types/disease-public-page.js';

export async function loadStaticDiseasePageImports(): Promise<StaticDiseasePageImport[]> {
  // Static disease content now lives in the database; keep the old import command harmless.
  return [];
}
