import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../auth.js';
import { asyncRoute } from '../utils/helpers.js';
import { getReferralSummary } from '../services/referral-codes.js';
import { getWalletBalance, listWalletLedger } from '../services/patient-wallet.js';
import { quoteConsultationCheckoutForPatient } from '../services/reward-settlement.js';

export function registerPatientRewardsRoutes(router: Router) {
  router.get(
    '/patient/referrals/summary',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const summary = await getReferralSummary(req.user!.id);
      res.json(summary);
    })
  );

  router.get(
    '/patient/rewards',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const [balanceInPaise, ledger] = await Promise.all([
        getWalletBalance(req.user!.id),
        listWalletLedger(req.user!.id, 50)
      ]);
      res.json({ balanceInPaise, ledger });
    })
  );

  router.post(
    '/patient/rewards/checkout-quote',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const body = z
        .object({
          diseaseId: z.string().min(1),
          serviceId: z.string().min(1).optional(),
          serviceSlug: z.string().min(2).max(100).optional(),
          purchaseType: z.enum(['ONE_TIME', 'PLAN']).default('ONE_TIME'),
          planCode: z.string().optional(),
          promoCode: z.string().optional(),
          walletRedeemInPaise: z.number().int().min(0).optional(),
          clinicStoreId: z.string().min(1).nullable().optional()
        })
        .parse(req.body);

      const quote = await quoteConsultationCheckoutForPatient({
        patientId: req.user!.id,
        ...body
      });
      res.json({ quote });
    })
  );
}
