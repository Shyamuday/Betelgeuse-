import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../auth.js';
import {
  DISEASE_PUBLIC_CATEGORIES,
  DISEASE_PUBLIC_CATEGORY_KEYS
} from '../constants/disease-categories.constants.js';
import {
  createDoctorDisease,
  DiseaseCatalogError,
  groupDiseasesByCategory,
  listDiseasesForDoctor
} from '../services/disease-catalog.js';
import { asyncRoute, queryText } from '../utils/helpers.js';

export const doctorDiseasesRouter = Router();

doctorDiseasesRouter.get(
  '/doctor/diseases/categories',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (_req, res) => {
    res.json({ categories: DISEASE_PUBLIC_CATEGORIES });
  })
);

doctorDiseasesRouter.get(
  '/doctor/diseases',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const q = queryText(req, 'q').trim() || undefined;
    const category = queryText(req, 'category').trim() || undefined;
    const grouped = queryText(req, 'grouped') !== 'false';

    const diseases = await listDiseasesForDoctor({ q, category });
    const payload = grouped
      ? {
          diseases,
          ...groupDiseasesByCategory(diseases, { includeEmpty: !q && !category })
        }
      : { diseases };

    res.json(payload);
  })
);

doctorDiseasesRouter.post(
  '/doctor/diseases',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).max(120),
        publicCategory: z.enum(DISEASE_PUBLIC_CATEGORY_KEYS as [string, ...string[]]),
        description: z.string().max(500).optional(),
        feeInPaise: z.number().int().positive().optional()
      })
      .parse(req.body);

    try {
      const disease = await createDoctorDisease({
        name: body.name,
        publicCategory: body.publicCategory,
        description: body.description,
        feeInPaise: body.feeInPaise,
        createdById: req.user!.id
      });
      res.status(201).json({ disease });
    } catch (error) {
      if (error instanceof DiseaseCatalogError) {
        const status = error.code === 'DISEASE_EXISTS' ? 409 : 400;
        return res.status(status).json({ message: error.message, code: error.code });
      }
      throw error;
    }
  })
);
