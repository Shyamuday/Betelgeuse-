import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { WorkShift } from '@prisma/client';
import { DEFAULT_JWT_SECRET } from '../../constants/auth.constants.js';
import { HR_ROLES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

export interface AuthPayload {
  userId: string;
  role: string;
}

/** Platform admin JWT uses `id`; HR login uses `userId`. */
type JwtHrClaims = AuthPayload & { id?: string };

function normalizeHrPayload(decoded: JwtHrClaims): AuthPayload | null {
  const userId = decoded.userId ?? decoded.id;
  if (!userId || !decoded.role) return null;
  return { userId, role: decoded.role };
}

export interface HrRequest extends Request {
  hrPayload: AuthPayload;
  accessibleStoreIds: string[] | null;
}

interface StorePayload {
  staffId: string;
  storeId: string;
  role: string;
}

export function hrAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as JwtHrClaims;
    const payload = normalizeHrPayload(decoded);
    if (!payload) { res.status(401).json({ error: 'Invalid token' }); return; }
    if (payload.role !== HR_ROLES.ADMIN && payload.role !== HR_ROLES.HR) {
      res.status(403).json({ error: 'HR or Admin access required' }); return;
    }
    const hrReq = req as HrRequest;
    hrReq.hrPayload = payload;

    if (payload.role === HR_ROLES.ADMIN) {
      hrReq.accessibleStoreIds = null;
      next();
    } else {
      prisma.hrStoreAccess.findMany({
        where: { hrUserId: payload.userId },
        select: { storeId: true }
      }).then(rows => {
        hrReq.accessibleStoreIds = rows.map(r => r.storeId);
        next();
      }).catch(() => { res.status(500).json({ error: 'Failed to load store access' }); });
    }
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as JwtHrClaims;
    const payload = normalizeHrPayload(decoded);
    if (!payload) { res.status(401).json({ error: 'Invalid token' }); return; }
    if (payload.role !== HR_ROLES.ADMIN) { res.status(403).json({ error: 'Admin only' }); return; }
    (req as HrRequest).hrPayload = payload;
    (req as HrRequest).accessibleStoreIds = null;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

export function getAccess(req: Request): { userId: string; storeIds: string[] | null } {
  const hrReq = req as HrRequest;
  return { userId: hrReq.hrPayload.userId, storeIds: hrReq.accessibleStoreIds };
}

export function storeManagerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as StorePayload;
    if (payload.role !== HR_ROLES.MANAGER) { res.status(403).json({ error: 'Manager only' }); return; }
    (req as Request & { storePayload: StorePayload }).storePayload = payload;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

export function generateLetterNumber(prefix: string): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${y}${m}-${rand}`;
}

export function formatSalary(paise: number | null | undefined): string {
  if (!paise) return 'As discussed';
  return `₹${(paise / 100).toLocaleString('en-IN')} per month`;
}

export function formatShift(shift: WorkShift, start?: string | null, end?: string | null): string {
  const names: Record<WorkShift, string> = {
    MORNING: 'Morning Shift', AFTERNOON: 'Afternoon Shift', EVENING: 'Evening Shift',
    NIGHT: 'Night Shift', FULL_DAY: 'Full Day', CUSTOM: 'Custom Hours'
  };
  const label = names[shift] ?? shift;
  if (start && end) return `${label} (${start} – ${end})`;
  return label;
}
