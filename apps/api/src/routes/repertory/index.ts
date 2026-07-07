import { Router } from 'express';
import { registerRepertoryCatalogRoutes } from './catalog.js';
import { registerCaseAnalysisRoutes } from './case-analyses.js';
import { registerClinicalMediaRoutes } from './clinical-media.js';

export function createRepertoryRouter() {
  const router = Router();
  registerRepertoryCatalogRoutes(router);
  registerCaseAnalysisRoutes(router);
  registerClinicalMediaRoutes(router);
  return router;
}
