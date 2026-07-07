import { Router } from 'express';
import { z } from 'zod';
import { ClinicalMediaType, Role } from '@prisma/client';
import {
  CLINICAL_MEDIA_TYPE_LABELS,
  observationHintsForMediaType,
  suggestRubricSearchPhrases,
  type ClinicalMediaType as OntologyMediaType
} from '@vitalis/homeopathy-approaches';
import { authRequired, allowRoles } from '../../auth.js';
import { prisma } from '../../db.js';
import { asyncRoute, routeParam } from '../../utils/helpers.js';
import {
  deleteClinicalMediaFile,
  readClinicalMediaFile,
  saveClinicalMediaFile
} from '../../services/clinical-media-storage.js';
import { analysisIdFromReq, loadCaseAnalysisForDoctor } from './shared.js';

const mediaTypeSchema = z.nativeEnum(ClinicalMediaType);

const createMediaSchema = z.object({
  mediaType: mediaTypeSchema,
  bodyRegion: z.string().max(120).optional(),
  observations: z.string().max(4000).optional(),
  patientConsent: z.boolean().optional().default(false),
  mimeType: z.string().min(3).max(80),
  fileName: z.string().max(200).optional(),
  dataBase64: z.string().min(1)
});

const updateMediaSchema = z.object({
  bodyRegion: z.string().max(120).optional(),
  observations: z.string().max(4000).optional(),
  patientConsent: z.boolean().optional()
});

const suggestPhrasesSchema = z.object({
  mediaType: mediaTypeSchema,
  observations: z.string().max(4000).optional(),
  bodyRegion: z.string().max(120).optional()
});

function serializeMedia(item: {
  id: string;
  caseAnalysisId: string;
  uploadedById: string;
  mediaType: ClinicalMediaType;
  bodyRegion: string | null;
  mimeType: string;
  fileName: string | null;
  observations: string | null;
  patientConsent: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    caseAnalysisId: item.caseAnalysisId,
    uploadedById: item.uploadedById,
    mediaType: item.mediaType,
    mediaTypeLabel: CLINICAL_MEDIA_TYPE_LABELS[item.mediaType as OntologyMediaType],
    bodyRegion: item.bodyRegion,
    mimeType: item.mimeType,
    fileName: item.fileName,
    observations: item.observations,
    patientConsent: item.patientConsent,
    fileUrl: `/doctor/case-analyses/${item.caseAnalysisId}/clinical-media/${item.id}/file`,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

export function registerClinicalMediaRoutes(router: Router) {
  router.get(
    '/doctor/clinical-media/observation-hints',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const raw = req.query.mediaType;
      const mediaType = mediaTypeSchema.parse(typeof raw === 'string' ? raw : '');
      res.json({
        mediaType,
        label: CLINICAL_MEDIA_TYPE_LABELS[mediaType as OntologyMediaType],
        hints: observationHintsForMediaType(mediaType as OntologyMediaType)
      });
    })
  );

  router.post(
    '/doctor/clinical-media/suggest-rubric-phrases',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = suggestPhrasesSchema.parse(req.body);
      const phrases = suggestRubricSearchPhrases({
        mediaType: body.mediaType as OntologyMediaType,
        observations: body.observations,
        bodyRegion: body.bodyRegion
      });
      res.json({ phrases });
    })
  );

  router.get(
    '/doctor/case-analyses/:analysisId/clinical-media',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const analysisId = analysisIdFromReq(req);
      const analysis = await loadCaseAnalysisForDoctor(req, res, analysisId);
      if (!analysis) return;

      const media = await prisma.clinicalMedia.findMany({
        where: { caseAnalysisId: analysisId },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ media: media.map(serializeMedia) });
    })
  );

  router.post(
    '/doctor/case-analyses/:analysisId/clinical-media',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const analysisId = analysisIdFromReq(req);
      const analysis = await loadCaseAnalysisForDoctor(req, res, analysisId);
      if (!analysis) return;

      const body = createMediaSchema.parse(req.body);
      if (!body.patientConsent) {
        return res.status(400).json({ message: 'Patient consent is required before attaching clinical images.' });
      }

      let storageKey: string;
      try {
        ({ storageKey } = await saveClinicalMediaFile({
          analysisId,
          mimeType: body.mimeType,
          fileName: body.fileName,
          dataBase64: body.dataBase64
        }));
      } catch (error) {
        const code = error instanceof Error ? error.message : 'UPLOAD_FAILED';
        if (code === 'UNSUPPORTED_MIME') {
          return res.status(400).json({ message: 'Only JPEG, PNG, WebP, and GIF images are supported.' });
        }
        if (code === 'FILE_TOO_LARGE') {
          return res.status(400).json({ message: 'Image must be 5 MB or smaller.' });
        }
        return res.status(400).json({ message: 'Could not save image.' });
      }

      const media = await prisma.clinicalMedia.create({
        data: {
          caseAnalysisId: analysisId,
          uploadedById: req.user!.id,
          mediaType: body.mediaType,
          bodyRegion: body.bodyRegion?.trim() || null,
          storageKey,
          mimeType: body.mimeType,
          fileName: body.fileName?.trim() || null,
          observations: body.observations?.trim() || null,
          patientConsent: true
        }
      });

      res.status(201).json({ media: serializeMedia(media) });
    })
  );

  router.patch(
    '/doctor/case-analyses/:analysisId/clinical-media/:mediaId',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const analysisId = analysisIdFromReq(req);
      const mediaId = routeParam(req, 'mediaId');
      const analysis = await loadCaseAnalysisForDoctor(req, res, analysisId);
      if (!analysis) return;

      const existing = await prisma.clinicalMedia.findFirst({
        where: { id: mediaId, caseAnalysisId: analysisId }
      });
      if (!existing) return res.status(404).json({ message: 'Clinical media not found' });

      const body = updateMediaSchema.parse(req.body);
      const media = await prisma.clinicalMedia.update({
        where: { id: mediaId },
        data: {
          ...(body.bodyRegion !== undefined ? { bodyRegion: body.bodyRegion.trim() || null } : {}),
          ...(body.observations !== undefined ? { observations: body.observations.trim() || null } : {}),
          ...(body.patientConsent !== undefined ? { patientConsent: body.patientConsent } : {})
        }
      });

      res.json({ media: serializeMedia(media) });
    })
  );

  router.delete(
    '/doctor/case-analyses/:analysisId/clinical-media/:mediaId',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const analysisId = analysisIdFromReq(req);
      const mediaId = routeParam(req, 'mediaId');
      const analysis = await loadCaseAnalysisForDoctor(req, res, analysisId);
      if (!analysis) return;

      const existing = await prisma.clinicalMedia.findFirst({
        where: { id: mediaId, caseAnalysisId: analysisId }
      });
      if (!existing) return res.status(404).json({ message: 'Clinical media not found' });

      await deleteClinicalMediaFile(existing.storageKey);
      await prisma.clinicalMedia.delete({ where: { id: mediaId } });
      res.json({ ok: true });
    })
  );

  router.get(
    '/doctor/case-analyses/:analysisId/clinical-media/:mediaId/file',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const analysisId = analysisIdFromReq(req);
      const mediaId = routeParam(req, 'mediaId');
      const analysis = await loadCaseAnalysisForDoctor(req, res, analysisId);
      if (!analysis) return;

      const media = await prisma.clinicalMedia.findFirst({
        where: { id: mediaId, caseAnalysisId: analysisId }
      });
      if (!media) return res.status(404).json({ message: 'Clinical media not found' });

      const bytes = await readClinicalMediaFile(media.storageKey);
      res.setHeader('Content-Type', media.mimeType);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.send(bytes);
    })
  );
}
