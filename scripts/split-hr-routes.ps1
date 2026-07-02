$root = "C:\Users\Admin\Documents\Betelgeuse-\apps\api\src"
$srcPath = Join-Path $root "hr-routes.ts"
$outDir = Join-Path $root "routes\hr"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$lines = [System.IO.File]::ReadAllLines($srcPath)

function Get-Slice([int]$start, [int]$end) {
  return ($lines[($start - 1)..($end - 1)] -join "`n")
}

function Get-Body([int[][]]$ranges) {
  $chunks = foreach ($range in $ranges) {
    Get-Slice $range[0] $range[1]
  }
  return (($chunks -join "`n") -replace 'hrRouter\.', 'router.')
}

$shared = @'
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
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
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
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
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
'@

[System.IO.File]::WriteAllText((Join-Path $outDir "shared.ts"), $shared)

function Write-Module([string]$file, [string]$fn, [string]$imports, [int[][]]$ranges) {
  $body = Get-Body $ranges
  $content = "$imports`n`nexport function ${fn}(router: Router) {`n$body`n}`n"
  [System.IO.File]::WriteAllText((Join-Path $outDir $file), $content)
  Write-Output "Wrote $file ($($body.Length) chars)"
}

Write-Module "auth.ts" "registerHrAuthRoutes" @"
import { Router, Request } from 'express';
import jwt from 'jsonwebtoken';
import { HR_API_ROUTES, HR_ROLES } from '../../constants/hr-api-routes.constants.js';
import { HR_JWT_EXPIRY } from '../../constants/auth.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { AuthPayload, hrAuthMiddleware, JWT_SECRET } from './shared.js';
"@ @(@(107,152))

Write-Module "dashboard.ts" "registerHrDashboardRoutes" @"
import { Router } from 'express';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';
"@ @(@(154,203))

Write-Module "employees.ts" "registerHrEmployeeRoutes" @"
import { Router } from 'express';
import { EmployeeStatus } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';
"@ @(@(205,275))

Write-Module "doctors.ts" "registerHrDoctorRoutes" @"
import { Router } from 'express';
import { EmployeeStatus, WorkShift } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { formatSalary, formatShift, generateLetterNumber, getAccess, hrAuthMiddleware } from './shared.js';
"@ @(@(277,381), @(800,822))

Write-Module "store-staff.ts" "registerHrStoreStaffRoutes" @"
import { Router } from 'express';
import { EmployeeStatus, WorkShift } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { formatSalary, formatShift, generateLetterNumber, getAccess, hrAuthMiddleware } from './shared.js';
"@ @(@(383,473))

Write-Module "leaves.ts" "registerHrLeaveRoutes" @"
import { Router, Request } from 'express';
import { EmployeeStatus, EmployeeType, LeaveStatus, LeaveType } from '@prisma/client';
import { HR_API_ROUTES, HR_DEFAULT_PAGE_SIZE } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { AuthPayload, hrAuthMiddleware } from './shared.js';
"@ @(@(475,564))

Write-Module "stores.ts" "registerHrStoreRoutes" @"
import { Router } from 'express';
import { EmployeeStatus } from '@prisma/client';
import { HR_API_ROUTES, HR_ROLES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';
"@ @(@(566,699))

Write-Module "users.ts" "registerHrUserRoutes" @"
import { Router } from 'express';
import { HR_API_ROUTES, HR_ROLES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { adminOnly } from './shared.js';
"@ @(@(701,798))

Write-Module "payroll.ts" "registerHrPayrollRoutes" @"
import { Router } from 'express';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';
"@ @(@(824,907))

Write-Module "self-service.ts" "registerHrSelfServiceRoutes" @"
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { LeaveType } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { JWT_SECRET } from './shared.js';
"@ @(@(909,995))

$index = @'
import { Router } from 'express';
import { registerHrAuthRoutes } from './auth.js';
import { registerHrDashboardRoutes } from './dashboard.js';
import { registerHrDoctorRoutes } from './doctors.js';
import { registerHrEmployeeRoutes } from './employees.js';
import { registerHrLeaveRoutes } from './leaves.js';
import { registerHrPayrollRoutes } from './payroll.js';
import { registerHrSelfServiceRoutes } from './self-service.js';
import { registerHrStoreStaffRoutes } from './store-staff.js';
import { registerHrStoreRoutes } from './stores.js';
import { registerHrUserRoutes } from './users.js';

export const hrRouter = Router();

registerHrAuthRoutes(hrRouter);
registerHrDashboardRoutes(hrRouter);
registerHrEmployeeRoutes(hrRouter);
registerHrDoctorRoutes(hrRouter);
registerHrStoreStaffRoutes(hrRouter);
registerHrLeaveRoutes(hrRouter);
registerHrStoreRoutes(hrRouter);
registerHrUserRoutes(hrRouter);
registerHrPayrollRoutes(hrRouter);
registerHrSelfServiceRoutes(hrRouter);
'@

[System.IO.File]::WriteAllText((Join-Path $outDir "index.ts"), $index)
Write-Output "Done"
