import { Router, type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { DEFAULT_JWT_SECRET, HR_JWT_EXPIRY } from '../constants/auth.constants.js';
import { HR_ROLES } from '../constants/hr-api-routes.constants.js';
import { STORE_ROLES } from '../constants/store-api-routes.constants.js';
import {
  DEV_DEMO_ACCOUNTS,
  DEV_DEMO_ALL_ACCOUNTS,
  DEV_DEMO_APPS,
  DEV_DEMO_OTP,
  DEV_DEMO_PASSWORD,
  DEV_DEMO_PERSONAS,
  DEV_DEMO_SCENARIOS,
  DEV_PATIENT_MOBILE,
  getPersonaById,
  getPersonaCredentials,
  getPersonaEmail,
  getPersonaLoginLabel,
  isDevDemoEnabled,
  personaMatchesApp,
  personasForApp,
  personasWithCredentialsForApp
} from '../dev/demo-manifest.js';
import { prisma } from '../db.js';
import { asyncRoute, publicUserSelect, toAuthResponse } from '../utils/helpers.js';
import { sessionPayloadForStoreStaff } from '../constants/rbac-helpers.js';
import { signStoreToken } from './store/shared.js';

const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

function devOnly(_req: Request, res: Response, next: NextFunction) {
  if (!isDevDemoEnabled()) {
    return res.status(404).json({ message: 'Not found' });
  }
  next();
}

export const devRouter = Router();

devRouter.use(devOnly);

devRouter.get(
  '/dev/demo-guide',
  asyncRoute(async (_req, res) => {
    res.json({
      enabled: true,
      password: DEV_DEMO_PASSWORD,
      otp: DEV_DEMO_OTP,
      patientMobile: DEV_PATIENT_MOBILE,
      apps: DEV_DEMO_APPS,
      personas: DEV_DEMO_PERSONAS.map((persona) => ({
        ...persona,
        credentials: getPersonaCredentials(persona.id),
        loginLabel: getPersonaLoginLabel(persona.id)
      })),
      allAccounts: DEV_DEMO_ALL_ACCOUNTS,
      scenarios: DEV_DEMO_SCENARIOS,
      seedCommand: 'npm run seed --prefix apps/api',
      migrateCommand: 'npm run prisma:migrate --prefix apps/api'
    });
  })
);

devRouter.get(
  '/dev/demo-guide/:appId',
  asyncRoute(async (req, res) => {
    const appId = z.string().min(1).parse(req.params['appId']);
    const app = DEV_DEMO_APPS.find((entry) => entry.id === appId);
    if (!app) {
      return res.status(404).json({ message: 'Unknown app id.' });
    }

    res.json({
      enabled: true,
      app,
      password: DEV_DEMO_PASSWORD,
      otp: DEV_DEMO_OTP,
      patientMobile: DEV_PATIENT_MOBILE,
      personas: personasWithCredentialsForApp(appId),
      allAccounts: DEV_DEMO_ALL_ACCOUNTS
    });
  })
);

devRouter.post(
  '/dev/quick-login',
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        persona: z.string().min(1),
        app: z.string().min(1).optional()
      })
      .parse(req.body);

    const persona = getPersonaById(body.persona);
    if (!persona) {
      return res.status(400).json({ message: 'Unknown demo persona.' });
    }
    if (body.app && !personaMatchesApp(persona, body.app)) {
      return res.status(400).json({ message: 'This persona is not valid for the current app.' });
    }

    switch (persona.authKind) {
      case 'platform': {
        const email = getPersonaEmail(persona.id);
        if (!email) {
          return res.status(400).json({ message: 'Persona email is not configured.' });
        }
        const user = await prisma.user.findUnique({
          where: { email },
          select: publicUserSelect
        });
        if (user) {
          return res.json(toAuthResponse(user));
        }

        const staff = await prisma.storeStaff.findFirst({
          where: { email, isActive: true },
          include: { store: { select: { id: true, name: true } } }
        });
        if (!staff) {
          return res.status(404).json({
            message: 'Demo account not found. Run: npm run seed --prefix apps/api'
          });
        }

        const token = signStoreToken({
          staffId: staff.id,
          storeId: staff.storeId,
          role: staff.role as typeof STORE_ROLES.MANAGER | typeof STORE_ROLES.STAFF,
          name: staff.name
        });
        const session = sessionPayloadForStoreStaff({
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          staffCode: staff.staffCode,
          storeId: staff.storeId,
          storeName: staff.store.name
        });
        return res.json({ token, ...session });
      }

      case 'hr': {
        const user = await prisma.user.findUnique({
          where: { email: DEV_DEMO_ACCOUNTS.hr.email },
          include: { hrProfile: true }
        });
        if (!user || user.role !== HR_ROLES.HR) {
          return res.status(404).json({
            message: 'Demo HR user not found. Run: npm run seed --prefix apps/api'
          });
        }
        const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: HR_JWT_EXPIRY });
        return res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            hrProfile: user.hrProfile
          }
        });
      }

      default:
        return res.status(400).json({ message: 'Unsupported persona auth kind.' });
    }
  })
);
