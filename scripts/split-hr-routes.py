from pathlib import Path

root = Path(__file__).resolve().parent.parent / "apps" / "api" / "src"
src_path = root / "hr-routes.ts"
out_dir = root / "routes" / "hr"
out_dir.mkdir(parents=True, exist_ok=True)
lines = src_path.read_text(encoding="utf-8").splitlines()


def slice_lines(start: int, end: int) -> str:
    return "\n".join(lines[start - 1 : end])


def route_body(ranges: list[tuple[int, int]]) -> str:
    chunks = [slice_lines(start, end) for start, end in ranges]
    return "\n".join(chunks).replace("hrRouter.", "router.")


def write_module(filename: str, fn_name: str, imports: str, ranges: list[tuple[int, int]]) -> None:
    content = f"{imports}\n\nexport function {fn_name}(router: Router) {{\n{route_body(ranges)}\n}}\n"
    (out_dir / filename).write_text(content, encoding="utf-8")
    print(f"Wrote {filename}")


(out_dir / "shared.ts").write_text((Path(__file__).parent / "hr-shared.ts").read_text(encoding="utf-8"), encoding="utf-8")
print("Wrote shared.ts")

write_module(
    "auth.ts",
    "registerHrAuthRoutes",
    """import { Router, Request } from 'express';
import jwt from 'jsonwebtoken';
import { HR_API_ROUTES, HR_ROLES } from '../../constants/hr-api-routes.constants.js';
import { HR_JWT_EXPIRY } from '../../constants/auth.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { AuthPayload, hrAuthMiddleware, JWT_SECRET } from './shared.js';""",
    [(107, 152)],
)

write_module(
    "dashboard.ts",
    "registerHrDashboardRoutes",
    """import { Router } from 'express';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';""",
    [(154, 203)],
)

write_module(
    "employees.ts",
    "registerHrEmployeeRoutes",
    """import { Router } from 'express';
import { EmployeeStatus } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';""",
    [(205, 275)],
)

write_module(
    "doctors.ts",
    "registerHrDoctorRoutes",
    """import { Router } from 'express';
import { EmployeeStatus, WorkShift } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { formatSalary, formatShift, generateLetterNumber, getAccess, hrAuthMiddleware } from './shared.js';""",
    [(277, 381), (800, 822)],
)

write_module(
    "store-staff.ts",
    "registerHrStoreStaffRoutes",
    """import { Router } from 'express';
import { EmployeeStatus, WorkShift } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { formatSalary, formatShift, generateLetterNumber, getAccess, hrAuthMiddleware } from './shared.js';""",
    [(383, 473)],
)

write_module(
    "leaves.ts",
    "registerHrLeaveRoutes",
    """import { Router, Request } from 'express';
import { EmployeeStatus, EmployeeType, LeaveStatus, LeaveType } from '@prisma/client';
import { HR_API_ROUTES, HR_DEFAULT_PAGE_SIZE } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { AuthPayload, hrAuthMiddleware } from './shared.js';""",
    [(475, 564)],
)

write_module(
    "stores.ts",
    "registerHrStoreRoutes",
    """import { Router } from 'express';
import { EmployeeStatus } from '@prisma/client';
import { HR_API_ROUTES, HR_ROLES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';""",
    [(566, 699)],
)

write_module(
    "users.ts",
    "registerHrUserRoutes",
    """import { Router } from 'express';
import { HR_API_ROUTES, HR_ROLES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { adminOnly, HrRequest } from './shared.js';""",
    [(701, 798)],
)

write_module(
    "payroll.ts",
    "registerHrPayrollRoutes",
    """import { Router } from 'express';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { getAccess, hrAuthMiddleware } from './shared.js';""",
    [(824, 907)],
)

write_module(
    "self-service.ts",
    "registerHrSelfServiceRoutes",
    """import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { LeaveType } from '@prisma/client';
import { HR_API_ROUTES } from '../../constants/hr-api-routes.constants.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';
import { JWT_SECRET } from './shared.js';""",
    [(909, 995)],
)

index = """import { Router } from 'express';
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
"""

(out_dir / "index.ts").write_text(index, encoding="utf-8")
print("Wrote index.ts")
print("Done")
