import type express from 'express';
import { DoseEventStatus, PrescriptionStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { allowRoles, authRequired } from '../auth.js';
import { prisma } from '../db.js';
import { includePrescriptionRelations } from '../db/prisma-includes.js';
import { asyncRoute } from '../middleware/async-route.js';
import { routeParam } from '../lib/http-params.js';
import { defaultReminderPreference } from '../server/config.js';

export function registerPatientCareRoutes(app: express.Application) {
  app.get(
    '/patient/prescriptions',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const prescriptions = await prisma.prescription.findMany({
        where: {
          patientId: req.user!.id,
          status: PrescriptionStatus.PUBLISHED
        },
        include: includePrescriptionRelations(),
        orderBy: { createdAt: 'desc' }
      });

      res.json({ prescriptions });
    })
  );

  app.get(
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

  app.get(
    '/patient/prescriptions/:id/pdf',
    authRequired,
    asyncRoute(async (req, res) => {
      const prescription = await prisma.prescription.findUnique({
        where: { id: routeParam(req, 'id') },
        include: {
          ...includePrescriptionRelations(),
          patient: { select: { name: true, mobile: true } }
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

      const rxPatient = (prescription as { patient?: { name?: string | null } }).patient;
      const items = prescription.items || [];
      const date = new Date(prescription.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const followUp = prescription.followUpDate
        ? new Date(prescription.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : null;

      const medicineRows = items
        .map(
          (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${item.medicineName}</strong>${item.strength ? ` <small>(${item.strength})</small>` : ''}</td>
        <td>${item.dose || '—'}</td>
        <td>${item.frequency || '—'}</td>
        <td>${item.duration || '—'}</td>
        <td>${item.instructions || '—'}</td>
      </tr>`
        )
        .join('');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Prescription — Vitalis Care</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; }
  .clinic-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
  .clinic-name { font-size: 18px; font-weight: bold; color: #1d4ed8; }
  .clinic-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .rx-symbol { font-size: 40px; color: #1d4ed8; font-style: italic; line-height: 1; }
  .divider { border: none; border-top: 2px solid #1d4ed8; margin: 8px 0 16px; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 32px; margin-bottom: 16px; }
  .meta-item label { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: .05em; }
  .meta-item p { font-size: 13px; font-weight: 600; margin-top: 2px; }
  .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin-bottom: 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #1d4ed8; color: #fff; font-size: 11px; text-align: left; padding: 6px 8px; }
  td { border-bottom: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8faff; }
  .notes-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; margin-bottom: 16px; font-size: 12px; }
  .footer { margin-top: 32px; display: flex; justify-content: flex-end; }
  .sig-box { text-align: center; border-top: 1px solid #374151; padding-top: 6px; min-width: 180px; font-size: 11px; color: #6b7280; }
  .followup { background: #dbeafe; border-radius: 6px; padding: 8px 12px; font-size: 12px; margin-bottom: 16px; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
  <div class="clinic-header">
    <div>
      <div class="clinic-name">Vitalis Care and Research Centre</div>
      <div class="clinic-sub">Doctor-led digital consultations &nbsp;|&nbsp; vitaliscare.in</div>
    </div>
    <div class="rx-symbol">&#x211E;</div>
  </div>
  <hr class="divider" />

  <div class="meta-grid">
    <div class="meta-item"><label>Patient</label><p>${rxPatient?.name || 'Patient'}</p></div>
    <div class="meta-item"><label>Date</label><p>${date}</p></div>
    <div class="meta-item"><label>Diagnosis</label><p>${prescription.diagnosis || '—'}</p></div>
    <div class="meta-item"><label>Doctor</label><p>${prescription.uploadedBy?.name || '—'}</p></div>
    ${prescription.methodOption ? `<div class="meta-item"><label>Method</label><p>${prescription.methodOption.label}</p></div>` : ''}
    ${prescription.diagnosedDiseaseOption ? `<div class="meta-item"><label>Condition</label><p>${prescription.diagnosedDiseaseOption.label}</p></div>` : ''}
  </div>

  <p class="section-title">Medicines</p>
  <table>
    <thead><tr><th>#</th><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
    <tbody>${medicineRows || '<tr><td colspan="6" style="color:#9ca3af">No items</td></tr>'}</tbody>
  </table>

  ${prescription.notes ? `<p class="section-title">Clinical Notes</p><div class="notes-box">${prescription.notes}</div>` : ''}
  ${prescription.advice ? `<p class="section-title">Advice</p><div class="notes-box">${prescription.advice}</div>` : ''}
  ${followUp ? `<div class="followup">&#x1F4C5; <strong>Follow-up due:</strong> ${followUp}</div>` : ''}

  <div class="footer">
    <div class="sig-box">
      ${prescription.uploadedBy?.name || 'Doctor'}<br />Vitalis Care
    </div>
  </div>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="prescription-${prescription.id.slice(0, 8)}.html"`);
      res.send(html);
    })
  );

  app.get(
    '/patient/today-doses',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      const doses = await prisma.medicineDoseEvent.findMany({
        where: {
          patientId: req.user!.id,
          scheduledFor: { gte: start, lt: end }
        },
        include: {
          prescriptionItem: true,
          prescription: {
            include: {
              methodOption: true,
              diagnosedDiseaseOption: true
            }
          }
        },
        orderBy: { scheduledFor: 'asc' }
      });

      res.json({ doses });
    })
  );

  app.get(
    '/patient/reminder-preferences',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const stored = await prisma.reminderPreference.findUnique({
        where: { userId: req.user!.id },
        select: {
          inApp: true,
          sms: true,
          whatsapp: true,
          push: true,
          quietHoursStart: true,
          quietHoursEnd: true
        }
      });
      const preferences = stored || defaultReminderPreference;
      res.json({ preferences });
    })
  );

  app.put(
    '/patient/reminder-preferences',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const body = z
        .object({
          inApp: z.boolean(),
          sms: z.boolean(),
          whatsapp: z.boolean(),
          push: z.boolean(),
          quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/),
          quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/)
        })
        .parse(req.body);

      await prisma.reminderPreference.upsert({
        where: { userId: req.user!.id },
        create: { userId: req.user!.id, ...body },
        update: body
      });

      res.json({ preferences: body, message: 'Reminder preferences saved.' });
    })
  );

  app.post(
    '/patient/dose-events/:id/take',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const event = await prisma.medicineDoseEvent.findUnique({
        where: { id: routeParam(req, 'id') }
      });

      if (!event || event.patientId !== req.user!.id) {
        return res.status(404).json({ message: 'Dose event not found' });
      }

      const updated = await prisma.medicineDoseEvent.update({
        where: { id: event.id },
        data: {
          status: DoseEventStatus.TAKEN,
          takenAt: new Date()
        }
      });

      res.json({ doseEvent: updated });
    })
  );

  app.post(
    '/patient/dose-events/:id/snooze',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const body = z.object({ minutes: z.number().int().min(5).max(120).optional() }).parse(req.body);
      const event = await prisma.medicineDoseEvent.findUnique({
        where: { id: routeParam(req, 'id') }
      });

      if (!event || event.patientId !== req.user!.id) {
        return res.status(404).json({ message: 'Dose event not found' });
      }
      if (event.status !== DoseEventStatus.PENDING) {
        return res.status(400).json({ message: 'Only pending doses can be snoozed.' });
      }

      const minutes = body.minutes || 15;
      const scheduledFor = new Date(event.scheduledFor.getTime() + minutes * 60 * 1000);
      const updated = await prisma.medicineDoseEvent.update({
        where: { id: event.id },
        data: {
          scheduledFor,
          note: `Snoozed by ${minutes} min at ${new Date().toISOString()}`
        }
      });

      res.json({ doseEvent: updated, message: `Dose snoozed by ${minutes} minutes.` });
    })
  );

  app.post(
    '/patient/dose-events/:id/skip',
    authRequired,
    allowRoles(Role.PATIENT),
    asyncRoute(async (req, res) => {
      const body = z.object({ note: z.string().max(300).optional() }).parse(req.body);
      const event = await prisma.medicineDoseEvent.findUnique({
        where: { id: routeParam(req, 'id') }
      });

      if (!event || event.patientId !== req.user!.id) {
        return res.status(404).json({ message: 'Dose event not found' });
      }

      const updated = await prisma.medicineDoseEvent.update({
        where: { id: event.id },
        data: {
          status: DoseEventStatus.SKIPPED,
          skippedAt: new Date(),
          note: body.note
        }
      });

      res.json({ doseEvent: updated });
    })
  );
}
