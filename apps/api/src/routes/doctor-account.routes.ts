import bcrypt from 'bcryptjs';
import type express from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { allowRoles, authRequired } from '../auth.js';
import {
  attachmentUploadMiddleware,
  buildDoctorCredentialStoragePath,
  persistConsultationAttachment,
  resolveAttachmentFileUrl
} from '../consultation-attachments.js';
import { prisma } from '../db.js';
import { serializeDoctorProfileForApi } from '../db/doctor-profile-serialize.js';
import { doctorProfileApiDbSelect, publicUserSelect } from '../db/prisma-includes.js';
import { asyncRoute } from '../middleware/async-route.js';
import { apiPublicBaseUrl } from '../server/config.js';
import {
  doctorCredentialKindSchema,
  doctorProfileUpdateBody,
  emptyDoctorText
} from '../schemas/doctor-profile.js';

export function registerDoctorAccountRoutes(app: express.Application) {
  app.post(
    '/doctor/enroll',
    asyncRoute(async (req, res) => {
      const body = z
        .object({
          name: z.string().min(2),
          email: z.string().email(),
          mobile: z.string().min(8).optional(),
          password: z.string().min(8),
          specialty: z.string().min(2),
          registrationNo: z.string().optional()
        })
        .parse(req.body);

      const passwordHash = await bcrypt.hash(body.password, 10);
      const doctor = await prisma.user.create({
        data: {
          name: body.name,
          email: body.email,
          mobile: body.mobile,
          passwordHash,
          role: Role.DOCTOR,
          isActive: false,
          doctorProfile: {
            create: {
              specialty: body.specialty,
              registrationNo: body.registrationNo
            }
          }
        },
        select: publicUserSelect
      });

      res.status(201).json({
        doctor,
        approvalStatus: 'PENDING',
        message: 'Enrollment submitted. Please wait for admin approval before login.'
      });
    })
  );

  app.get(
    '/doctor/profile',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const row = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          ...publicUserSelect,
          isActive: true,
          doctorProfile: {
            select: doctorProfileApiDbSelect
          }
        }
      });

      if (!row) {
        return res.status(404).json({ message: 'Doctor profile not found' });
      }

      const { doctorProfile, ...profile } = row;
      res.json({
        profile: {
          ...profile,
          doctorProfile: await serializeDoctorProfileForApi(doctorProfile)
        }
      });
    })
  );

  app.put(
    '/doctor/profile',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    asyncRoute(async (req, res) => {
      const body = doctorProfileUpdateBody.parse(req.body);

      const docCore = {
        specialty: body.specialty,
        registrationNo: emptyDoctorText(body.registrationNo ?? undefined) ?? null,
        isAvailable: body.isAvailable,
        bio: emptyDoctorText(body.bio) ?? null,
        qualifications: emptyDoctorText(body.qualifications) ?? null,
        homoeopathyMethods: emptyDoctorText(body.homoeopathyMethods) ?? null,
        clinicalFocus: emptyDoctorText(body.clinicalFocus) ?? null,
        languagesSpoken: emptyDoctorText(body.languagesSpoken) ?? null,
        stateCouncilName: emptyDoctorText(body.stateCouncilName) ?? null,
        stateCouncilRegNo: emptyDoctorText(body.stateCouncilRegNo) ?? null,
        yearsExperience: body.yearsExperience ?? null
      };

      const updated = await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          name: body.name,
          mobile: body.mobile || null,
          doctorProfile: {
            upsert: {
              create: docCore,
              update: docCore
            }
          }
        },
        select: {
          ...publicUserSelect,
          isActive: true,
          doctorProfile: {
            select: doctorProfileApiDbSelect
          }
        }
      });

      const { doctorProfile, ...profile } = updated;
      res.json({
        profile: {
          ...profile,
          doctorProfile: await serializeDoctorProfileForApi(doctorProfile)
        }
      });
    })
  );

  app.post(
    '/doctor/profile/credential',
    authRequired,
    allowRoles(Role.DOCTOR, Role.ADMIN),
    attachmentUploadMiddleware,
    asyncRoute(async (req, res) => {
      const file = req.file;
      if (!file?.buffer) {
        return res.status(400).json({ message: 'File is required (JPG, PNG, WebP, or PDF).' });
      }

      let kind: z.infer<typeof doctorCredentialKindSchema>;
      try {
        kind = doctorCredentialKindSchema.parse(typeof req.body?.kind === 'string' ? req.body.kind : undefined);
      } catch {
        return res.status(400).json({ message: 'kind must be DEGREE, COUNCIL_REG, or OTHER.' });
      }

      const pathField =
        kind === 'DEGREE'
          ? 'degreeCertificatePath'
          : kind === 'COUNCIL_REG'
            ? 'councilRegCertificatePath'
            : 'otherCredentialPath';

      const storagePath = buildDoctorCredentialStoragePath(req.user!.id, kind, file.originalname || 'upload');
      await persistConsultationAttachment(storagePath, file.buffer, file.mimetype);

      const existing = await prisma.doctor.findUnique({
        where: { userId: req.user!.id },
        select: { specialty: true }
      });
      const specialty =
        existing?.specialty?.trim() && existing.specialty.trim().length > 0
          ? existing.specialty.trim()
          : 'Registered homoeopathic practitioner';

      await prisma.doctor.upsert({
        where: { userId: req.user!.id },
        create: {
          userId: req.user!.id,
          specialty,
          [pathField]: storagePath
        },
        update: {
          [pathField]: storagePath
        }
      });

      const signed = await resolveAttachmentFileUrl(storagePath, apiPublicBaseUrl());
      const urlPayload =
        kind === 'DEGREE'
          ? { degreeCertificateUrl: signed || null }
          : kind === 'COUNCIL_REG'
            ? { councilRegCertificateUrl: signed || null }
            : { otherCredentialUrl: signed || null };

      res.json({ kind, ...urlPayload });
    })
  );
}
