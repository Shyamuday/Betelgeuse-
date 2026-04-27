import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { ConsultationStatus, PaymentStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { allowRoles, authRequired, signToken } from './auth.js';
import { prisma } from './db.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:4200';
const devOtp = process.env.DEV_OTP || '123456';
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

app.use(cors({ origin: webOrigin, credentials: true }));
app.use(express.json());

const asyncRoute =
  (handler: express.RequestHandler): express.RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  mobile: true,
  role: true
} as const;

function toAuthResponse(user: {
  id: string;
  name: string;
  role: Role;
  email?: string | null;
  mobile?: string | null;
}) {
  return {
    token: signToken(user),
    user
  };
}

function includeConsultationRelations() {
  return {
    patient: { select: publicUserSelect },
    assignedDoctor: { select: publicUserSelect },
    disease: true,
    payment: true,
    prescription: true,
    messages: {
      include: { sender: { select: publicUserSelect } },
      orderBy: { createdAt: 'asc' as const }
    }
  };
}

function routeParam(req: express.Request, key: string) {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'clinic-api' });
});

app.post(
  '/auth/request-otp',
  asyncRoute(async (req, res) => {
    const body = z.object({ mobile: z.string().min(8) }).parse(req.body);

    res.json({
      mobile: body.mobile,
      message: 'OTP generated for development.',
      devOtp
    });
  })
);

app.post(
  '/auth/patient-login',
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2).default('Patient'),
        mobile: z.string().min(8),
        otp: z.string().min(4)
      })
      .parse(req.body);

    if (body.otp !== devOtp) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    const user = await prisma.user.upsert({
      where: { mobile: body.mobile },
      update: { name: body.name },
      create: {
        name: body.name,
        mobile: body.mobile,
        role: Role.PATIENT
      },
      select: publicUserSelect
    });

    res.json(toAuthResponse(user));
  })
);

app.post(
  '/auth/staff-login',
  asyncRoute(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(8) }).parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: { ...publicUserSelect, passwordHash: true, isActive: true }
    });

    if (!user?.passwordHash || !user.isActive || user.role === Role.PATIENT) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { passwordHash: _passwordHash, isActive: _isActive, ...safeUser } = user;
    res.json(toAuthResponse(safeUser));
  })
);

app.post(
  '/auth/forgot-password',
  asyncRoute(async (req, res) => {
    const body = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, role: true, email: true, isActive: true }
    });

    if (!user || !user.isActive || user.role === Role.PATIENT) {
      return res.json({ message: 'If the account exists, reset instructions have been generated.' });
    }

    const token = randomToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });

    res.json({
      message: 'Development reset token generated.',
      resetToken: token
    });
  })
);

app.post(
  '/auth/reset-password',
  asyncRoute(async (req, res) => {
    const body = z.object({ token: z.string().min(20), password: z.string().min(8) }).parse(req.body);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(body.token) },
      include: { user: { select: publicUserSelect } }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } })
    ]);

    res.json(toAuthResponse(resetToken.user));
  })
);

app.post(
  '/auth/google',
  asyncRoute(async (req, res) => {
    const body = z.object({ idToken: z.string().min(20) }).parse(req.body);
    if (!googleClient || !googleClientId) {
      return res.status(503).json({ message: 'Google login is not configured. Set GOOGLE_CLIENT_ID.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: body.idToken,
      audience: googleClientId
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(401).json({ message: 'Google account email is required' });
    }

    const user = await prisma.user.upsert({
      where: { email: payload.email },
      update: {
        name: payload.name || payload.email
      },
      create: {
        name: payload.name || payload.email,
        email: payload.email,
        role: Role.PATIENT
      },
      select: publicUserSelect
    });

    res.json(toAuthResponse(user));
  })
);

app.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.get(
  '/diseases',
  asyncRoute(async (_req, res) => {
    const diseases = await prisma.disease.findMany({
      where: { isActive: true },
      orderBy: { feeInPaise: 'asc' }
    });

    res.json({ diseases });
  })
);

app.post(
  '/admin/diseases',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(3),
        description: z.string().min(3),
        feeInPaise: z.number().int().positive(),
        intakeQuestions: z.array(z.string().min(3)).min(1)
      })
      .parse(req.body);

    const disease = await prisma.disease.create({ data: body });
    res.status(201).json({ disease });
  })
);

app.get(
  '/admin/doctors',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (_req, res) => {
    const doctors = await prisma.user.findMany({
      where: { role: Role.DOCTOR },
      select: { ...publicUserSelect, isActive: true, doctorProfile: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ doctors });
  })
);

app.post(
  '/admin/doctors',
  authRequired,
  allowRoles(Role.ADMIN),
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
        doctorProfile: {
          create: {
            specialty: body.specialty,
            registrationNo: body.registrationNo
          }
        }
      },
      select: { ...publicUserSelect, doctorProfile: true }
    });

    res.status(201).json({ doctor });
  })
);

app.post(
  '/consultations',
  authRequired,
  allowRoles(Role.PATIENT),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        diseaseId: z.string().min(1),
        intakeAnswers: z.record(z.string(), z.string().min(1))
      })
      .parse(req.body);

    const disease = await prisma.disease.findUniqueOrThrow({ where: { id: body.diseaseId } });
    const consultation = await prisma.consultation.create({
      data: {
        patientId: req.user!.id,
        diseaseId: disease.id,
        intakeAnswers: body.intakeAnswers,
        payment: {
          create: {
            amountInPaise: disease.feeInPaise,
            status: PaymentStatus.CREATED
          }
        }
      },
      include: includeConsultationRelations()
    });

    res.status(201).json({ consultation });
  })
);

app.get(
  '/consultations',
  authRequired,
  asyncRoute(async (req, res) => {
    const where =
      req.user!.role === Role.PATIENT
        ? { patientId: req.user!.id }
        : req.user!.role === Role.DOCTOR
          ? { assignedDoctorId: req.user!.id }
          : {};

    const consultations = await prisma.consultation.findMany({
      where,
      include: includeConsultationRelations(),
      orderBy: { createdAt: 'desc' }
    });

    res.json({ consultations });
  })
);

app.get(
  '/consultations/:id',
  authRequired,
  asyncRoute(async (req, res) => {
    const consultation = await prisma.consultation.findUnique({
      where: { id: routeParam(req, 'id') },
      include: includeConsultationRelations()
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const isOwner = consultation.patientId === req.user!.id;
    const isDoctor = consultation.assignedDoctorId === req.user!.id;
    const isAdmin = req.user!.role === Role.ADMIN;
    if (!isOwner && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ consultation });
  })
);

app.post(
  '/consultations/:id/assign',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = z.object({ doctorId: z.string().min(1) }).parse(req.body);
    const doctor = await prisma.user.findFirstOrThrow({
      where: { id: body.doctorId, role: Role.DOCTOR, isActive: true }
    });

    const consultation = await prisma.consultation.update({
      where: { id: routeParam(req, 'id') },
      data: {
        assignedDoctorId: doctor.id,
        status: ConsultationStatus.ASSIGNED
      },
      include: includeConsultationRelations()
    });

    res.json({ consultation });
  })
);

app.post(
  '/consultations/:id/messages',
  authRequired,
  asyncRoute(async (req, res) => {
    const body = z.object({ body: z.string().min(1).max(2000) }).parse(req.body);
    const consultation = await prisma.consultation.findUniqueOrThrow({ where: { id: routeParam(req, 'id') } });

    const canChat =
      req.user!.role === Role.ADMIN ||
      consultation.patientId === req.user!.id ||
      consultation.assignedDoctorId === req.user!.id;

    if (!canChat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await prisma.message.create({
      data: {
        consultationId: consultation.id,
        senderId: req.user!.id,
        body: body.body
      },
      include: { sender: { select: publicUserSelect } }
    });

    if (consultation.status === ConsultationStatus.ASSIGNED) {
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: ConsultationStatus.IN_PROGRESS }
      });
    }

    res.status(201).json({ message });
  })
);

app.post(
  '/consultations/:id/prescription',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        notes: z.string().min(5),
        fileUrl: z.string().url().optional().or(z.literal(''))
      })
      .parse(req.body);

    const consultation = await prisma.consultation.findUniqueOrThrow({ where: { id: routeParam(req, 'id') } });
    if (req.user!.role === Role.DOCTOR && consultation.assignedDoctorId !== req.user!.id) {
      return res.status(403).json({ message: 'Only the assigned doctor can upload prescription' });
    }

    const prescription = await prisma.prescription.upsert({
      where: { consultationId: consultation.id },
      update: {
        notes: body.notes,
        fileUrl: body.fileUrl || null,
        uploadedById: req.user!.id
      },
      create: {
        consultationId: consultation.id,
        uploadedById: req.user!.id,
        notes: body.notes,
        fileUrl: body.fileUrl || null
      }
    });

    await prisma.consultation.update({
      where: { id: consultation.id },
      data: { status: ConsultationStatus.PRESCRIPTION_UPLOADED }
    });

    res.json({ prescription });
  })
);

app.post(
  '/consultations/:id/complete',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const consultation = await prisma.consultation.findUniqueOrThrow({ where: { id: routeParam(req, 'id') } });
    if (req.user!.role === Role.DOCTOR && consultation.assignedDoctorId !== req.user!.id) {
      return res.status(403).json({ message: 'Only the assigned doctor can complete consultation' });
    }

    const updated = await prisma.consultation.update({
      where: { id: consultation.id },
      data: { status: ConsultationStatus.COMPLETED },
      include: includeConsultationRelations()
    });

    res.json({ consultation: updated });
  })
);

app.post(
  '/payments/:consultationId/create-order',
  authRequired,
  allowRoles(Role.PATIENT),
  asyncRoute(async (req, res) => {
    const consultation = await prisma.consultation.findUniqueOrThrow({
      where: { id: routeParam(req, 'consultationId') },
      include: { payment: true }
    });

    if (consultation.patientId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    let providerOrderId = `order_dev_${consultation.id}`;

    if (keyId && keySecret) {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: consultation.payment!.amountInPaise,
        currency: 'INR',
        receipt: consultation.id
      });
      providerOrderId = order.id;
    }

    const payment = await prisma.payment.update({
      where: { consultationId: consultation.id },
      data: { providerOrderId }
    });

    res.json({ payment, razorpayKeyId: keyId || 'dev_key' });
  })
);

app.post(
  '/payments/:consultationId/verify',
  authRequired,
  allowRoles(Role.PATIENT),
  asyncRoute(async (req, res) => {
    const body = z.object({ providerPaymentId: z.string().min(1).default('pay_dev_success') }).parse(req.body);
    const consultation = await prisma.consultation.findUniqueOrThrow({
      where: { id: routeParam(req, 'consultationId') },
      include: { payment: true }
    });

    if (consultation.patientId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payment = await prisma.payment.update({
      where: { consultationId: consultation.id },
      data: {
        providerPaymentId: body.providerPaymentId,
        status: PaymentStatus.PAID
      }
    });

    const updated = await prisma.consultation.update({
      where: { id: consultation.id },
      data: { status: ConsultationStatus.PAID },
      include: includeConsultationRelations()
    });

    res.json({ payment, consultation: updated });
  })
);

app.get(
  '/admin/reports',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (_req, res) => {
    const [consultations, revenue, doctors] = await Promise.all([
      prisma.consultation.groupBy({ by: ['status'], _count: true }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { amountInPaise: true }
      }),
      prisma.user.count({ where: { role: Role.DOCTOR, isActive: true } })
    ]);

    res.json({
      revenueInPaise: revenue._sum.amountInPaise || 0,
      activeDoctors: doctors,
      consultations
    });
  })
);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: 'Validation failed', issues: error.issues });
  }

  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Clinic API running on http://localhost:${port}`);
});
