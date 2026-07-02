import express from 'express';
import jwt from 'jsonwebtoken';
import { StockStatus } from '@prisma/client';
import { DEFAULT_JWT_SECRET, STORE_TOKEN_EXPIRY } from '../../constants/auth.constants.js';
import { STORE_AUTH_MESSAGES, STORE_EXPIRY, STORE_ROLES } from '../../constants/store-api-routes.constants.js';

const STORE_JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

export type StoreTokenPayload = {
  staffId: string;
  storeId: string;
  role: typeof STORE_ROLES.MANAGER | typeof STORE_ROLES.STAFF;
  name: string;
};

export function signStoreToken(payload: StoreTokenPayload) {
  return jwt.sign(payload, STORE_JWT_SECRET, { expiresIn: STORE_TOKEN_EXPIRY });
}

export async function storeAuthMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) {
    return res.status(401).json({ message: STORE_AUTH_MESSAGES.REQUIRED });
  }

  try {
    const decoded = jwt.verify(token, STORE_JWT_SECRET) as StoreTokenPayload;
    (req as express.Request & { storeStaff?: StoreTokenPayload }).storeStaff = decoded;
    next();
  } catch {
    return res.status(401).json({ message: STORE_AUTH_MESSAGES.INVALID_TOKEN });
  }
}

export function requireManager(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const staff = (req as express.Request & { storeStaff?: StoreTokenPayload }).storeStaff;
  if (staff?.role !== STORE_ROLES.MANAGER) {
    return res.status(403).json({ message: STORE_AUTH_MESSAGES.MANAGER_REQUIRED });
  }

  next();
}

export function getStoreStaff(req: express.Request): StoreTokenPayload {
  return (req as express.Request & { storeStaff?: StoreTokenPayload }).storeStaff!;
}

export function computeStockStatus(qty: number, minStockLevel: number): StockStatus {
  if (qty === 0) return StockStatus.OUT_OF_STOCK;
  if (qty < minStockLevel) return StockStatus.LOW_STOCK;
  return StockStatus.ACTIVE;
}

function daysUntilExpiry(expiryDate: Date) {
  return Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function enrichBatch(batch: { expiryDate: Date; [key: string]: unknown }) {
  const days = daysUntilExpiry(batch.expiryDate);
  return {
    ...batch,
    daysToExpiry: days,
    isExpired: days <= 0,
    isExpiringSoon: days > 0 && days <= STORE_EXPIRY.SOON_THRESHOLD_DAYS
  };
}

export function periodToDate(period: string): Date {
  const now = new Date();
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'all':
      return new Date(0);
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
}