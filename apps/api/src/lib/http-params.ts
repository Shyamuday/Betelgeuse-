import type express from 'express';

export function routeParam(req: express.Request, key: string) {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function queryText(req: express.Request, key: string) {
  const value = req.query[key];
  if (Array.isArray(value)) {
    return String(value[0] || '');
  }

  return typeof value === 'string' ? value : '';
}

export function queryPositiveInt(req: express.Request, key: string, fallback: number, min = 1, max = 100) {
  const parsed = Number(queryText(req, key));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}
