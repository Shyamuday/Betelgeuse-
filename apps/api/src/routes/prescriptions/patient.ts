import { Router } from 'express';
import { PrescriptionStatus, Role } from '@prisma/client';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam, includePrescriptionRelations } from '../../utils/helpers.js';

export function registerPatientPrescriptionRoutes(router: Router) {
  // ─── Prescriptions (patient) ───────────────────────────────────────────────────

  router.get(
    '/patient/prescriptions',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const prescriptions = await prisma.prescription.findMany({
        where: { patientId: req.user!.id, status: PrescriptionStatus.PUBLISHED },
        include: includePrescriptionRelations(),
        orderBy: { createdAt: 'desc' }
      });
      res.json({ prescriptions });
    })
  );

  router.get(
    '/patient/prescriptions/:id',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const prescription = await prisma.prescription.findUnique({
        where: { id: routeParam(req, 'id') },
        include: includePrescriptionRelations()
      });

      if (!prescription || prescription.patientId !== req.user!.id || prescription.status !== PrescriptionStatus.PUBLISHED) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      res.json({ prescription });
    })
  );

}
