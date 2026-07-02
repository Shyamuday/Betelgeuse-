import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute } from '../../utils/helpers.js';

export function registerAuthProfileRoutes(router: Router) {
// ─── Patient profile ───────────────────────────────────────────────────────────

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

router.get(
  '/patient/profile',
  authRequired,
  allowRoles(Role.PATIENT),
  asyncRoute(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        allergies: true,
        currentMedications: true,
        chronicConditions: true
      }
    });
    res.json({ profile: user });
  })
);

router.put(
  '/patient/profile',
  authRequired,
  allowRoles(Role.PATIENT),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1).max(100),
        allergies: z.string().max(1000).optional(),
        currentMedications: z.string().max(1000).optional(),
        chronicConditions: z.string().max(1000).optional()
      })
      .parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: body,
      select: { id: true, name: true, email: true, mobile: true, allergies: true, currentMedications: true, chronicConditions: true }
    });

    res.json({ profile: updated });
  })
);
}
