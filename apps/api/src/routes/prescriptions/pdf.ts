import { Router } from 'express';
import { PrescriptionStatus, Role } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { authRequired } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam, includePrescriptionRelations } from '../../utils/helpers.js';

export function registerPrescriptionPdfRoutes(router: Router) {
  // ─── PDF prescription ──────────────────────────────────────────────────────────

  router.get(
    '/patient/prescriptions/:id/pdf',
    authRequired,
    asyncRoute(async (req, res) => {
      const prescription = await prisma.prescription.findUnique({
        where: { id: routeParam(req, 'id') },
        include: { ...includePrescriptionRelations(), patient: { select: { name: true, mobile: true } } }
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rxPatient = (prescription as any).patient;
      const items = prescription.items || [];
      const date = new Date(prescription.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const followUp = prescription.followUpDate
        ? new Date(prescription.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const filename = `prescription-${prescription.id.slice(0, 8)}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      doc.pipe(res);

      const PRIMARY = '#1d4ed8';
      const GRAY = '#6b7280';
      const W = doc.page.width - 100;

      doc.fontSize(18).fillColor(PRIMARY).font('Helvetica-Bold').text('Vitalis Care and Research Centre', 50, 50);
      doc.fontSize(10).fillColor(GRAY).font('Helvetica').text('Doctor-led digital consultations  |  vitaliscare.in', 50, 72);
      doc.fontSize(36).fillColor(PRIMARY).font('Helvetica-Oblique').text('Rx', doc.page.width - 90, 45, { width: 60, align: 'right' });
      doc.moveTo(50, 98).lineTo(doc.page.width - 50, 98).strokeColor(PRIMARY).lineWidth(1.5).stroke();

      let y = 110;
      const metaCol = (label: string, value: string, x: number, cy: number) => {
        doc.fontSize(8).fillColor(GRAY).font('Helvetica').text(label.toUpperCase(), x, cy);
        doc.fontSize(11).fillColor('#111').font('Helvetica-Bold').text(value || '—', x, cy + 11, { width: W / 2 - 10 });
      };
      metaCol('Patient', rxPatient?.name || 'Patient', 50, y);
      metaCol('Date', date, 50 + W / 2, y);
      y += 35;
      metaCol('Diagnosis', prescription.diagnosis || '—', 50, y);
      metaCol('Doctor', prescription.uploadedBy?.name || '—', 50 + W / 2, y);
      y += 35;
      if (prescription.methodOption) { metaCol('Method', prescription.methodOption.label, 50, y); y += 28; }
      if (prescription.diagnosedDiseaseOption) { metaCol('Condition', prescription.diagnosedDiseaseOption.label, 50, y); y += 28; }
      y += 5;
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      y += 10;

      doc.fontSize(9).fillColor(GRAY).font('Helvetica').text('MEDICINES', 50, y);
      y += 14;
      const colWidths = [24, 140, 60, 80, 70, W - 374];
      const colX = colWidths.reduce<number[]>((acc, w, i) => { acc.push(i === 0 ? 50 : acc[i - 1] + colWidths[i - 1]); return acc; }, []);
      const headers = ['#', 'Medicine', 'Dose', 'Frequency', 'Duration', 'Instructions'];

      doc.rect(50, y, W, 18).fillColor(PRIMARY).fill();
      headers.forEach((h, i) => {
        doc.fontSize(9).fillColor('white').font('Helvetica-Bold').text(h, colX[i] + 3, y + 4, { width: colWidths[i] - 6, ellipsis: true });
      });
      y += 18;

      if (items.length === 0) {
        doc.rect(50, y, W, 20).fillColor('#f8faff').fill();
        doc.fontSize(10).fillColor(GRAY).font('Helvetica').text('No items', 50, y + 5, { width: W, align: 'center' });
        y += 20;
      } else {
        items.forEach((item, i) => {
          const bg = i % 2 === 0 ? 'white' : '#f8faff';
          doc.rect(50, y, W, 20).fillColor(bg).fill();
          const rowData = [
            String(i + 1),
            item.medicineName + (item.strength ? ` (${item.strength})` : ''),
            item.dose || '—',
            item.frequency || '—',
            item.duration || '—',
            item.instructions || '—'
          ];
          rowData.forEach((val, ci) => {
            doc.fontSize(9).fillColor('#111').font('Helvetica').text(val, colX[ci] + 3, y + 5, { width: colWidths[ci] - 6, ellipsis: true });
          });
          y += 20;
        });
      }
      doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
      y += 14;

      const infoBox = (title: string, text: string) => {
        if (!text) return;
        doc.fontSize(9).fillColor(GRAY).font('Helvetica').text(title, 50, y);
        y += 12;
        doc.rect(50, y, W, 0).fillColor('#f9fafb').fill();
        doc.fontSize(10);
        const textH = doc.heightOfString(text, { width: W - 16 });
        doc.rect(50, y, W, textH + 14).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
        doc.fontSize(10).fillColor('#374151').font('Helvetica').text(text, 58, y + 7, { width: W - 16 });
        y += textH + 20;
      };
      if (prescription.notes) infoBox('CLINICAL NOTES', prescription.notes);
      if (prescription.advice) infoBox('ADVICE', prescription.advice);

      if (followUp) {
        doc.rect(50, y, W, 22).fillColor('#dbeafe').fill();
        doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Bold').text(`Follow-up due: ${followUp}`, 58, y + 6);
        y += 30;
      }

      const sigY = doc.page.height - 80;
      doc.moveTo(doc.page.width - 200, sigY).lineTo(doc.page.width - 50, sigY).strokeColor('#374151').lineWidth(0.5).stroke();
      doc.fontSize(10).fillColor(GRAY).font('Helvetica').text(prescription.uploadedBy?.name || 'Doctor', doc.page.width - 200, sigY + 5, { width: 150, align: 'center' });
      doc.fontSize(9).text('Vitalis Care', doc.page.width - 200, sigY + 17, { width: 150, align: 'center' });

      doc.end();
    })
  );
}
