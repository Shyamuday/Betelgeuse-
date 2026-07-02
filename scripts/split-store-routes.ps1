$root = "C:\Users\Admin\Documents\Betelgeuse-\apps\api\src"
$srcPath = Join-Path $root "store-routes.ts"
$outDir = Join-Path $root "routes\store"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$lines = [System.IO.File]::ReadAllLines($srcPath)

function Get-Lines([int]$start, [int]$end) {
  return ($lines[($start - 1)..($end - 1)] -join "`n")
}

function Convert-RouteBody([string]$body) {
  return $body.Replace('storeRouter.', 'router.')
}

$shared = @'
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
'@

[System.IO.File]::WriteAllText((Join-Path $outDir "shared.ts"), $shared)

$modules = @(
  @{
    File = "auth.ts"
    Fn = "registerStoreAuthRoutes"
    Start = 97
    End = 201
    Imports = @"
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { STORE_API_ROUTES, STORE_ROLES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, signStoreToken, storeAuthMiddleware } from './shared.js';
"@
  },
  @{
    File = "medicines.ts"
    Fn = "registerStoreMedicineRoutes"
    Start = 203
    End = 407
    Imports = @"
import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { StockStatus } from '@prisma/client';
import { STORE_API_ROUTES, STORE_PAGINATION } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { computeStockStatus, enrichBatch, getStoreStaff, requireManager, storeAuthMiddleware } from './shared.js';
"@
  },
  @{
    File = "racks.ts"
    Fn = "registerStoreRackRoutes"
    Start = 409
    End = 472
    Imports = @"
import { Router } from 'express';
import { z } from 'zod';
import { STORE_API_ROUTES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, requireManager, storeAuthMiddleware } from './shared.js';
"@
  },
  @{
    File = "stock.ts"
    Fn = "registerStoreStockRoutes"
    Start = 474
    End = 670
    Imports = @"
import { Router } from 'express';
import { z } from 'zod';
import { StockMovementType, StockStatus } from '@prisma/client';
import { STORE_API_ROUTES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { computeStockStatus, getStoreStaff, requireManager, storeAuthMiddleware } from './shared.js';
"@
  },
  @{
    File = "alerts.ts"
    Fn = "registerStoreAlertRoutes"
    Start = 672
    End = 759
    Imports = @"
import { Router } from 'express';
import { StockStatus } from '@prisma/client';
import { STORE_API_ROUTES, STORE_EXPIRY } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { enrichBatch, getStoreStaff, storeAuthMiddleware } from './shared.js';
"@
  },
  @{
    File = "dashboard.ts"
    Fn = "registerStoreDashboardRoutes"
    Start = 761
    End = 895
    Imports = @"
import { Router } from 'express';
import { STORE_API_ROUTES, STORE_EXPIRY, STORE_PAGINATION } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, storeAuthMiddleware } from './shared.js';
"@
  },
  @{
    File = "setup.ts"
    Fn = "registerStoreSetupRoutes"
    Start = 897
    End = 1001
    Imports = @"
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { STORE_ROLES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, requireManager, signStoreToken, storeAuthMiddleware } from './shared.js';
"@
  },
  @{
    File = "staff.ts"
    Fn = "registerStoreStaffRoutes"
    Start = 1003
    End = 1162
    Imports = @"
import { Router } from 'express';
import { STORE_API_ROUTES } from '../../constants/store-api-routes.constants.js';
import { prisma } from '../../db.js';
import { buildPayslipHistory, buildStoreStaffPayslip } from '../../services/payroll.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, periodToDate, requireManager, storeAuthMiddleware } from './shared.js';
"@
  },
  @{
    File = "expenses.ts"
    Fn = "registerStoreExpenseRoutes"
    Start = 1164
    End = 1229
    Imports = @"
import { Router } from 'express';
import { z } from 'zod';
import { ExpenseCategory, ExpenseLevel } from '@prisma/client';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getStoreStaff, requireManager, storeAuthMiddleware } from './shared.js';
"@
  }
)

foreach ($mod in $modules) {
  $body = Convert-RouteBody (Get-Lines $mod.Start $mod.End)
  $content = @"
$($mod.Imports)

export function $($mod.Fn)(router: Router) {
$body
}

"@
  [System.IO.File]::WriteAllText((Join-Path $outDir $mod.File), $content)
}

$index = @'
import { Router } from 'express';
import { registerStoreAlertRoutes } from './alerts.js';
import { registerStoreAuthRoutes } from './auth.js';
import { registerStoreDashboardRoutes } from './dashboard.js';
import { registerStoreExpenseRoutes } from './expenses.js';
import { registerStoreMedicineRoutes } from './medicines.js';
import { registerStoreRackRoutes } from './racks.js';
import { registerStoreSetupRoutes } from './setup.js';
import { registerStoreStaffRoutes } from './staff.js';
import { registerStoreStockRoutes } from './stock.js';

export const storeRouter = Router();

registerStoreAuthRoutes(storeRouter);
registerStoreMedicineRoutes(storeRouter);
registerStoreRackRoutes(storeRouter);
registerStoreStockRoutes(storeRouter);
registerStoreAlertRoutes(storeRouter);
registerStoreDashboardRoutes(storeRouter);
registerStoreSetupRoutes(storeRouter);
registerStoreStaffRoutes(storeRouter);
registerStoreExpenseRoutes(storeRouter);
'@

[System.IO.File]::WriteAllText((Join-Path $outDir "index.ts"), $index)
Write-Output "Generated store route modules"
