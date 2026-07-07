import { Router } from 'express';
import { Role } from '@prisma/client';
import { authRequired, allowRoles } from '../auth.js';
import { asyncRoute, routeParam } from '../utils/helpers.js';
import { getPatientMedicineDelivery, listMedicineDeliveries } from '../services/medicine-deliveries.js';

export function registerPatientDeliveryRoutes(router: Router) {
  router.get(
    '/patient/deliveries',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const deliveries = await listMedicineDeliveries({ patientId: req.user!.id });
      res.json({ deliveries });
    })
  );

  router.get(
    '/patient/deliveries/:id',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const delivery = await getPatientMedicineDelivery(req.user!.id, routeParam(req, 'id'));
      if (!delivery) return res.status(404).json({ message: 'Delivery not found.' });
      res.json({ delivery });
    })
  );
}
