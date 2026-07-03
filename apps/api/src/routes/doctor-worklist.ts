import { Router } from 'express';
import { z } from 'zod';
import { ConsultationStatus, ProductEventCategory, Role } from '@prisma/client';
import { authRequired, allowRoles } from '../auth.js';
import { prisma } from '../db.js';
import { asyncRoute, includeConsultationRelations } from '../utils/helpers.js';
import {
  compareWorklistItems,
  matchesWorklistSearch,
  publishedFollowUpDate,
  resolveFollowUpUrgency,
  worklistSections,
  type WorklistSection,
  type WorklistView
} from '../services/doctor-worklist.js';
import { PRODUCT_EVENTS, trackProductEvent } from '../services/product-analytics.js';

function toWorklistItem(consultation: Awaited<ReturnType<typeof loadDoctorConsultations>>[number]) {
  const followUpDate = publishedFollowUpDate(consultation);
  return {
    id: consultation.id,
    status: consultation.status,
    createdAt: consultation.createdAt,
    patient: consultation.patient,
    disease: consultation.disease,
    followUpDate,
    followUpUrgency: resolveFollowUpUrgency(followUpDate),
    sections: worklistSections(consultation)
  };
}

async function loadDoctorConsultations(doctorId: string) {
  return prisma.consultation.findMany({
    where: {
      assignedDoctorId: doctorId,
      status: { notIn: [ConsultationStatus.COMPLETED, ConsultationStatus.CANCELLED] }
    },
    include: includeConsultationRelations(),
    orderBy: { createdAt: 'desc' }
  });
}

function sectionItems(
  items: ReturnType<typeof toWorklistItem>[],
  section: WorklistSection,
  view: WorklistView
) {
  const filtered = items.filter((item) => item.sections.includes(section));
  if (view !== 'ALL' && view !== section) {
    return [];
  }
  return [...filtered].sort(compareWorklistItems);
}

export const doctorWorklistRouter = Router();

doctorWorklistRouter.get(
  '/doctor/worklist',
  authRequired,
  allowRoles(Role.DOCTOR),
  asyncRoute(async (req, res) => {
    const query = z
      .object({
        view: z.enum(['ALL', 'ASSIGNED', 'IN_PROGRESS', 'FOLLOW_UP_DUE']).optional().default('ALL'),
        q: z.string().optional().default('')
      })
      .parse(req.query);

    const consultations = await loadDoctorConsultations(req.user!.id);
    const items = consultations
      .filter((consultation) => matchesWorklistSearch(consultation, query.q))
      .map(toWorklistItem);

    const assigned = sectionItems(items, 'ASSIGNED', query.view);
    const inProgress = sectionItems(items, 'IN_PROGRESS', query.view);
    const followUpDue = sectionItems(items, 'FOLLOW_UP_DUE', query.view);

    void trackProductEvent({
      name: PRODUCT_EVENTS.DOCTOR_WORKLIST_VIEWED,
      category: ProductEventCategory.ENGAGEMENT,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      properties: { view: query.view, itemCount: items.length }
    });

    res.json({
      view: query.view,
      counts: {
        assigned: items.filter((item) => item.sections.includes('ASSIGNED')).length,
        inProgress: items.filter((item) => item.sections.includes('IN_PROGRESS')).length,
        followUpDue: items.filter((item) => item.sections.includes('FOLLOW_UP_DUE')).length
      },
      sections: {
        assigned,
        inProgress,
        followUpDue
      }
    });
  })
);
