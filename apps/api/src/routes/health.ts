import type express from 'express';

export function registerHealthRoutes(app: express.Application) {
  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'clinic-api' });
  });
}
