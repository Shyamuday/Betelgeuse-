import type express from 'express';
import { prisma } from '../db.js';
import { asyncRoute } from '../middleware/async-route.js';
import { ensureBillingPlans } from '../services/billing-plans.js';

export function registerCatalogRoutes(app: express.Application) {
  app.get(
    '/diseases',
    asyncRoute(async (_req, res) => {
      const diseases = await prisma.disease.findMany({
        where: { isActive: true },
        orderBy: { feeInPaise: 'asc' }
      });

      res.json({ diseases });
    })
  );

  app.get(
    '/billing/plans',
    asyncRoute(async (_req, res) => {
      await ensureBillingPlans();
      const plans = await prisma.billingPlan.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { priceInPaise: 'asc' }]
      });
      res.json({ plans });
    })
  );

  app.get(
    '/locations',
    asyncRoute(async (_req, res) => {
      const locations = await prisma.clinicLocation.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          pincode: true,
          phone: true,
          timezone: true
        }
      });
      res.json({ locations });
    })
  );
}
