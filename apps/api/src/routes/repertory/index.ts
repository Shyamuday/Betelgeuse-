import { Router } from 'express';
import { registerRepertoryCatalogRoutes } from './catalog.js';
import { registerCaseAnalysisRoutes } from './case-analyses.js';

export function createRepertoryRouter() {
  const router = Router();
  registerRepertoryCatalogRoutes(router);
  registerCaseAnalysisRoutes(router);
  return router;
}
