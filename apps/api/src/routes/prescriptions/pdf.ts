import { Router } from 'express';
import { PrescriptionStatus, Role } from '@prisma/client';
import { authRequired } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam, queryText, includePrescriptionRelations } from '../../utils/helpers.js';
import { buildPrescriptionShareText, streamPrescriptionPdf } from '../../services/prescription-pdf.js';

export function registerPrescriptionPdfRoutes(router: Router) {
  router.get(
    '/patient/prescriptions/:id/pdf',
    authRequired,
    asyncRoute(async (req, res) => {
      const prescription = await prisma.prescription.findUnique({
        where: { id: routeParam(req, 'id') },
        include: {
          ...includePrescriptionRelations(),
          patient: { select: { name: true, mobile: true, patientCode: true } }
        }
      });

      if (!prescription || prescription.status !== PrescriptionStatus.PUBLISHED) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      const isOwner = prescription.patientId === req.user!.id;
      const isDoctor = prescription.consultation.assignedDoctorId === req.user!.id;
      const isAdmin = req.user!.role === Role.ADMIN;
      if (!isOwner && !isDoctor && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const disposition = queryText(req, 'disposition').toLowerCase() === 'inline' ? 'inline' : 'attachment';
      streamPrescriptionPdf(res, { prescription, disposition });
    })
  );

  router.get(
    '/patient/prescriptions/:id/share',
    authRequired,
    asyncRoute(async (req, res) => {
      const prescription = await prisma.prescription.findUnique({
        where: { id: routeParam(req, 'id') },
        include: {
          consultation: { select: { assignedDoctorId: true } },
          patient: { select: { name: true, patientCode: true } },
          uploadedBy: { select: { name: true } }
        }
      });

      if (!prescription || prescription.status !== PrescriptionStatus.PUBLISHED) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      const isOwner = prescription.patientId === req.user!.id;
      const isDoctor = prescription.consultation.assignedDoctorId === req.user!.id;
      const isAdmin = req.user!.role === Role.ADMIN;
      if (!isOwner && !isDoctor && !isAdmin) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const shareText = buildPrescriptionShareText({
        patientName: prescription.patient?.name,
        diagnosis: prescription.diagnosis,
        version: prescription.version,
        createdAt: prescription.createdAt
      });

      res.json({
        prescriptionId: prescription.id,
        shareText,
        pdfPath: `/patient/prescriptions/${prescription.id}/pdf`,
        patientName: prescription.patient?.name ?? null,
        patientCode: prescription.patient?.patientCode ?? null,
        doctorName: prescription.uploadedBy?.name ?? null,
        diagnosis: prescription.diagnosis,
        version: prescription.version,
        createdAt: prescription.createdAt
      });
    })
  );
}
