import { Router } from 'express';
import type { Server as SocketIoServer } from 'socket.io';
import { registerDoctorPrescriptionRoutes } from './doctor.js';
import { registerPrescriptionOptionRoutes } from './options.js';
import { registerPatientPrescriptionRoutes } from './patient.js';
import { registerPrescriptionPdfRoutes } from './pdf.js';
import { registerPrescriptionTemplateRoutes } from './templates.js';

export function createPrescriptionsRouter(io: SocketIoServer) {
  const router = Router();

  registerPrescriptionOptionRoutes(router);
  registerPrescriptionTemplateRoutes(router);
  registerDoctorPrescriptionRoutes(router, io);
  registerPatientPrescriptionRoutes(router);
  registerPrescriptionPdfRoutes(router);

  return router;
}
