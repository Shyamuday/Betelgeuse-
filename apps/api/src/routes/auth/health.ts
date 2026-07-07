import { Router } from 'express';
import { asyncRoute } from '../../utils/helpers.js';
import { prisma } from '../../db.js';

export function registerAuthHealthRoutes(router: Router) {
// ─── Health check ──────────────────────────────────────────────────────────────

router.get(
  '/health',
  asyncRoute(async (_req, res) => {
    let dbOk = false;
    let dbLatencyMs: number | undefined;
    try {
      const t0 = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - t0;
      dbOk = true;
    } catch { /* DB unreachable */ }

    const status = dbOk ? 200 : 503;
    res.status(status).json({
      ok: dbOk,
      service: 'clinic-api',
      database: dbOk ? 'connected' : 'unreachable',
      dbLatencyMs,
      timestamp: new Date().toISOString()
    });
  })
);

}
