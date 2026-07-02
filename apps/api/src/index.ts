import 'dotenv/config';
import { createServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { Server as SocketIoServer } from 'socket.io';
import PDFDocument from 'pdfkit';
import {
  ConsultationStatus,
  DoseEventStatus,
  PaymentStatus,
  PrescriptionOptionType,
  PrescriptionStatus,
  Prisma,
  Role
} from '@prisma/client';
import { z } from 'zod';
import { allowRoles, authRequired, type AuthUser, signToken } from './auth.js';
import { DEFAULT_JWT_SECRET } from './constants/auth.constants.js';
import { DEFAULT_BILLING_PLANS } from './constants/billing.constants.js';
import { SERVER_CONFIG, SCHEDULER_CONFIG } from './constants/config.constants.js';
import { DEFAULT_REMINDER_PREFERENCE } from './constants/reminder-preferences.constants.js';
import { SOCKET_EVENTS, SOCKET_ROOM_PREFIXES } from './constants/socket.constants.js';
import { prisma } from './db.js';
import { createNotificationService, type NotificationChannel } from './notifications.js';
import { storeRouter } from './store-routes.js';
import { hrRouter } from './hr-routes.js';

const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT || SERVER_CONFIG.DEFAULT_PORT);
const webOrigin = SERVER_CONFIG.ORIGINS.WEB;
const adminOrigin = SERVER_CONFIG.ORIGINS.ADMIN;
const doctorOrigin = SERVER_CONFIG.ORIGINS.DOCTOR;
const storeOrigin = SERVER_CONFIG.ORIGINS.STORE;
const hrOrigin = SERVER_CONFIG.ORIGINS.HR;

const io = new SocketIoServer(httpServer, {
  cors: { origin: webOrigin, credentials: true }
});

io.use((socket, next) => {
  const token = socket.handshake.auth['token'] as string | undefined;
  if (!token) {
    return next(new Error('Unauthorized'));
  }

  const socketJwtSecret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  try {
    const decoded = jwt.verify(token, socketJwtSecret) as AuthUser;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).userId = decoded.id;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (socket as any).userId as string;
  void socket.join(`${SOCKET_ROOM_PREFIXES.USER}${userId}`);
  socket.on(SOCKET_EVENTS.SUBSCRIBE_CONSULTATION, (consultationId: unknown) => {
    if (typeof consultationId === 'string') {
      void socket.join(`${SOCKET_ROOM_PREFIXES.CONSULTATION}${consultationId}`);
    }
  });
});

const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT || SERVER_CONFIG.SMTP.DEFAULT_PORT);
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpFrom = process.env.SMTP_FROM || SERVER_CONFIG.SMTP.DEFAULT_FROM;

function getMailTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });
}
const devOtp = SERVER_CONFIG.DEV_OTP;
const isProduction = process.env.NODE_ENV === 'production';

// In-memory OTP store: mobile → { otp, expiresAt }
// For multi-instance deployments replace with Redis.
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function storeOtp(mobile: string, otp: string): void {
  otpStore.set(mobile, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min TTL
}

function verifyOtp(mobile: string, otp: string): boolean {
  const entry = otpStore.get(mobile);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) { otpStore.delete(mobile); return false; }
  if (entry.otp !== otp) return false;
  otpStore.delete(mobile); // single-use
  return true;
}

const twilioAccountSid  = process.env.TWILIO_ACCOUNT_SID  || '';
const twilioAuthToken   = process.env.TWILIO_AUTH_TOKEN   || '';
const twilioSmsFrom     = process.env.TWILIO_SMS_FROM     || '';

async function sendOtpSms(mobile: string, otp: string): Promise<void> {
  if (!twilioAccountSid || !twilioAuthToken || !twilioSmsFrom) {
    console.info(`[otp] DEV — OTP for ${mobile}: ${otp}`);
    return;
  }
  const { default: twilio } = await import('twilio');
  const client = twilio(twilioAccountSid, twilioAuthToken);
  const to = mobile.startsWith('+') ? mobile : `+${mobile.replace(/\D/g, '')}`;
  await client.messages.create({
    to,
    from: twilioSmsFrom,
    body: `Your Vitalis Care OTP is: ${otp}. Valid for 10 minutes. Do not share it with anyone.`
  });
}
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || '';
const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
const doseOverdueSweepEnabled = (process.env.DOSE_OVERDUE_SWEEP_ENABLED || 'true').toLowerCase() !== 'false';
const doseOverdueSweepIntervalMs = Math.max(
  SCHEDULER_CONFIG.DOSE_OVERDUE_SWEEP_MIN_MS,
  Number(process.env.DOSE_OVERDUE_SWEEP_INTERVAL_MS || SCHEDULER_CONFIG.DOSE_OVERDUE_SWEEP_DEFAULT_MS)
);
const doseReminderSweepEnabled = (process.env.DOSE_REMINDER_SWEEP_ENABLED || 'true').toLowerCase() !== 'false';
const doseReminderWindowMinutes = Math.max(
  SCHEDULER_CONFIG.DOSE_REMINDER_WINDOW_MIN_MINUTES,
  Number(process.env.DOSE_REMINDER_WINDOW_MINUTES || SCHEDULER_CONFIG.DOSE_REMINDER_WINDOW_DEFAULT_MINUTES)
);
const enabledNotificationChannels = (process.env.NOTIFICATION_CHANNELS || 'IN_APP')
  .split(',')
  .map((value) => value.trim().toUpperCase())
  .filter(Boolean) as NotificationChannel[];
const notificationService = createNotificationService(enabledNotificationChannels);

async function ensureBillingPlans() {
  await Promise.all(
    DEFAULT_BILLING_PLANS.map((plan) =>
      prisma.billingPlan.upsert({
        where: { code: plan.code },
        update: {
          name: plan.name,
          description: plan.description,
          planType: plan.planType,
          priceInPaise: plan.priceInPaise,
          consultationsLimit: plan.consultationsLimit,
          isActive: true,
          sortOrder: plan.sortOrder
        },
        create: plan
      })
    )
  );
}

app.use(cors({ origin: [webOrigin, adminOrigin, doctorOrigin, storeOrigin, hrOrigin], credentials: true }));
app.use('/payments/razorpay-webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Rate limiting — OTP endpoint: max 5 requests per 15 min per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoints: max 20 requests per 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/auth/request-otp', otpLimiter);
app.use('/auth/patient-login', authLimiter);
app.use('/auth/staff-login', authLimiter);
app.use('/hr/auth/login', authLimiter);
app.use('/store/auth/manager-login', authLimiter);

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
    prescriptions: {
      include: {
        items: { orderBy: { sortOrder: 'asc' as const } },
        methodOption: true,
        diagnosedDiseaseOption: true
      },
      orderBy: { version: 'desc' as const }
    },
    messages: {
      include: { sender: { select: publicUserSelect } },
      orderBy: { createdAt: 'asc' as const }
    }
  };
}

function includePrescriptionRelations() {
  return {
    consultation: {
      select: {
        id: true,
        patientId: true,
        assignedDoctorId: true,
        disease: { select: { id: true, name: true } }
      }
    },
    uploadedBy: { select: publicUserSelect },
    patient: { select: publicUserSelect },
    methodOption: true,
    diagnosedDiseaseOption: true,
    items: { orderBy: { sortOrder: 'asc' as const } }
  };
}

function normalizeOptionLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function fallbackIntakeTimesFromFrequency(frequency?: string | null) {
  const value = (frequency || '').toLowerCase();
  if (value.includes('three') || value.includes('thrice') || value.includes('3')) {
    return ['08:00', '14:00', '20:00'];
  }

  if (value.includes('twice') || value.includes('2')) {
    return ['09:00', '21:00'];
  }

  return ['09:00'];
}

function buildDoseScheduleEvents(input: {
  patientId: string;
  prescriptionId: string;
  prescriptionItems: Array<{ id: string; frequency?: string | null; durationDays?: number | null; intakeTimes?: unknown }>;
}) {
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const events: Array<{
    patientId: string;
    prescriptionId: string;
    prescriptionItemId: string;
    scheduledFor: Date;
  }> = [];

  for (const item of input.prescriptionItems) {
    const rawTimes = Array.isArray(item.intakeTimes) ? item.intakeTimes.filter((time) => typeof time === 'string') : [];
    const times = rawTimes.length ? (rawTimes as string[]) : fallbackIntakeTimesFromFrequency(item.frequency);
    const durationDays = Math.min(Math.max(item.durationDays || 1, 1), 120);

    for (let dayOffset = 0; dayOffset < durationDays; dayOffset += 1) {
      for (const time of times) {
        const [hourText, minuteText] = time.split(':');
        const hour = Number(hourText);
        const minute = Number(minuteText);
        if (Number.isNaN(hour) || Number.isNaN(minute)) {
          continue;
        }

        const scheduledFor = new Date(dayStart);
        scheduledFor.setDate(dayStart.getDate() + dayOffset);
        scheduledFor.setHours(hour, minute, 0, 0);

        events.push({
          patientId: input.patientId,
          prescriptionId: input.prescriptionId,
          prescriptionItemId: item.id,
          scheduledFor
        });
      }
    }
  }

  return events;
}

function routeParam(req: express.Request, key: string) {
  const value = req.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function queryText(req: express.Request, key: string) {
  const value = req.query[key];
  if (Array.isArray(value)) {
    return String(value[0] || '');
  }

  return typeof value === 'string' ? value : '';
}

function queryPositiveInt(req: express.Request, key: string, fallback: number, min = 1, max = 100) {
  const parsed = Number(queryText(req, key));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function logAuthEvent(event: 'staff_login_success' | 'staff_login_failure' | 'patient_login', details: Record<string, unknown>) {
  console.info(`[auth] ${event}`, {
    at: new Date().toISOString(),
    ...details
  });
}

async function writeAuditLog(input: {
  actorId?: string;
  actorRole?: Role;
  action: string;
  targetType: string;
  targetId: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId || null,
      actorRole: input.actorRole || null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      summary: input.summary,
      metadata: input.metadata as Prisma.InputJsonValue | undefined
    }
  });
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getRazorpayClient() {
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  return new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
}

function verifyRazorpaySignature(payload: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}) {
  const digest = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(payload.razorpaySignature));
}

async function markOverdueDosesAsMissed() {
  const now = new Date();
  const overdueEvents = await prisma.medicineDoseEvent.findMany({
    where: {
      status: DoseEventStatus.PENDING,
      scheduledFor: { lt: now }
    },
    select: {
      id: true,
      patientId: true,
      scheduledFor: true,
      patient: { select: { name: true, mobile: true, email: true } },
      prescriptionItem: { select: { medicineName: true } }
    },
    take: 1000
  });

  if (!overdueEvents.length) {
    return;
  }

  const result = await prisma.medicineDoseEvent.updateMany({
    where: { id: { in: overdueEvents.map((event) => event.id) } },
    data: { status: DoseEventStatus.MISSED }
  });

  console.info(`[scheduler] Marked ${result.count} overdue dose event(s) as MISSED`);
  await notificationService.sendBatch(
    overdueEvents.flatMap((event) =>
      enabledNotificationChannels.map((channel) => ({
        eventType: 'DOSE_MISSED' as const,
        channel,
        recipientId: event.patientId,
        recipientName: event.patient?.name,
        recipientMobile: event.patient?.mobile,
        recipientEmail: event.patient?.email,
        title: 'Dose marked missed',
        body: `${event.prescriptionItem?.medicineName || 'Medicine'} dose at ${event.scheduledFor.toISOString()} was marked missed.`,
        metadata: { doseEventId: event.id, scheduledFor: event.scheduledFor.toISOString() }
      }))
    )
  );
}

// Runs daily — restores employees to ACTIVE when their approved leave has ended
async function restoreEmployeesFromLeave() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredLeaves = await prisma.leaveRequest.findMany({
    where: { status: 'APPROVED', endDate: { lt: today } },
    select: { id: true, employeeType: true, doctorId: true, storeStaffId: true }
  });

  if (!expiredLeaves.length) return;

  let restored = 0;
  for (const leave of expiredLeaves) {
    try {
      if (leave.employeeType === 'DOCTOR' && leave.doctorId) {
        await prisma.doctor.update({
          where: { id: leave.doctorId, employeeStatus: 'ON_LEAVE' },
          data: { employeeStatus: 'ACTIVE' }
        });
        restored++;
      } else if (leave.employeeType === 'STORE_STAFF' && leave.storeStaffId) {
        await prisma.storeStaff.update({
          where: { id: leave.storeStaffId, employeeStatus: 'ON_LEAVE' },
          data: { employeeStatus: 'ACTIVE' }
        });
        restored++;
      }
    } catch {
      // Employee status already changed manually — skip
    }
  }

  if (restored > 0) {
    console.info(`[scheduler] Restored ${restored} employee(s) to ACTIVE after leave ended`);
  }
}

async function emitUpcomingDoseReminders() {
  if (!doseReminderSweepEnabled) {
    return;
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + doseReminderWindowMinutes * 60 * 1000);
  const upcomingEvents = await prisma.medicineDoseEvent.findMany({
    where: {
      status: DoseEventStatus.PENDING,
      scheduledFor: { gte: now, lte: windowEnd }
    },
    select: {
      id: true,
      patientId: true,
      scheduledFor: true,
      patient: { select: { name: true, mobile: true, email: true } },
      prescriptionItem: { select: { medicineName: true } }
    },
    take: 1000
  });

  if (!upcomingEvents.length) {
    return;
  }

  await notificationService.sendBatch(
    upcomingEvents.flatMap((event) =>
      enabledNotificationChannels.map((channel) => ({
        eventType: 'DOSE_REMINDER' as const,
        channel,
        recipientId: event.patientId,
        recipientName: event.patient?.name,
        recipientMobile: event.patient?.mobile,
        recipientEmail: event.patient?.email,
        title: 'Medicine reminder',
        body: `Upcoming dose for ${event.prescriptionItem?.medicineName || 'medicine'} at ${event.scheduledFor.toISOString()}.`,
        metadata: { doseEventId: event.id, scheduledFor: event.scheduledFor.toISOString() }
      }))
    )
  );
}

async function runDoseSchedulers() {
  await Promise.all([markOverdueDosesAsMissed(), emitUpcomingDoseReminders()]);
}

app.get(
  '/health',
  asyncRoute(async (_req, res) => {
    let dbOk = false;
    let dbLatencyMs: number | undefined;
    try {
      const t0 = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - t0;
      dbOk = true;
    } catch { /* DB unreachable */ }

    const status = dbOk ? 200 : 503;
    res.status(status).json({
      ok: dbOk,
      service: 'clinic-api',
      database: dbOk ? 'connected' : 'unreachable',
      dbLatencyMs,
      timestamp: new Date().toISOString()
    });
  })
);

app.post(
  '/auth/request-otp',
  asyncRoute(async (req, res) => {
    const body = z.object({ mobile: z.string().min(8) }).parse(req.body);
    const otp = isProduction ? generateOtp() : devOtp;
    storeOtp(body.mobile, otp);

    await sendOtpSms(body.mobile, otp);

    const response: Record<string, unknown> = {
      mobile: body.mobile,
      message: isProduction ? 'OTP sent to your mobile.' : 'OTP generated for development.'
    };
    if (!isProduction) {
      response['devOtp'] = otp;
    }
    res.json(response);
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
    const profile = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        ...publicUserSelect,
        isActive: true,
        doctorProfile: {
          select: {
            specialty: true,
            registrationNo: true,
            isAvailable: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({ profile });
  })
);

app.put(
  '/doctor/profile',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2),
        mobile: z.string().min(8).optional().or(z.literal('')),
        specialty: z.string().min(2),
        registrationNo: z.string().optional().or(z.literal('')),
        isAvailable: z.boolean().optional().default(true)
      })
      .parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: body.name,
        mobile: body.mobile || null,
        doctorProfile: {
          upsert: {
            create: {
              specialty: body.specialty,
              registrationNo: body.registrationNo || null,
              isAvailable: body.isAvailable
            },
            update: {
              specialty: body.specialty,
              registrationNo: body.registrationNo || null,
              isAvailable: body.isAvailable
            }
          }
        }
      },
      select: {
        ...publicUserSelect,
        isActive: true,
        doctorProfile: {
          select: {
            specialty: true,
            registrationNo: true,
            isAvailable: true
          }
        }
      }
    });

    res.json({ profile: updated });
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

    if (!user?.passwordHash || user.role === Role.PATIENT) {
      logAuthEvent('staff_login_failure', { email: body.email, reason: 'invalid_credentials' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive && user.role === Role.DOCTOR) {
      logAuthEvent('staff_login_failure', { userId: user.id, role: user.role, reason: 'doctor_pending_approval' });
      return res.status(403).json({ message: 'Doctor account is pending admin approval.' });
    }

    if (!user.isActive) {
      logAuthEvent('staff_login_failure', { userId: user.id, role: user.role, reason: 'inactive_account' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      logAuthEvent('staff_login_failure', { userId: user.id, role: user.role, reason: 'invalid_credentials' });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { passwordHash: _passwordHash, isActive: _isActive, ...safeUser } = user;
    logAuthEvent('staff_login_success', { userId: safeUser.id, role: safeUser.role });
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev] Password reset token for ${body.email}: ${token}`);
    }

    res.json({ message: 'If the account exists, reset instructions have been sent.' });
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

app.post(
  '/auth/patient-register',
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email().optional().or(z.literal('')),
        mobile: z.string().min(8).optional().or(z.literal('')),
        password: z.string().min(8)
      })
      .parse(req.body);

    const email = body.email || null;
    const mobile = body.mobile || null;

    if (!email && !mobile) {
      return res.status(400).json({ message: 'Email or mobile is required.' });
    }

    const existing = await prisma.user.findFirst({
      where: email ? { email } : { mobile: mobile! },
      select: { id: true, passwordHash: true }
    });

    if (existing?.passwordHash) {
      return res.status(409).json({ message: 'Account already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name: body.name, passwordHash },
          select: publicUserSelect
        })
      : await prisma.user.create({
          data: { name: body.name, email, mobile, passwordHash, role: Role.PATIENT },
          select: publicUserSelect
        });

    logAuthEvent('patient_login', { userId: user.id, event: 'register' });
    res.status(201).json(toAuthResponse(user));
  })
);

app.post(
  '/auth/patient-login-password',
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        identifier: z.string().min(3),
        password: z.string().min(1)
      })
      .parse(req.body);

    const isEmail = body.identifier.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: body.identifier } : { mobile: body.identifier },
      select: { ...publicUserSelect, passwordHash: true, isActive: true, role: true }
    });

    if (!user || !user.passwordHash || user.role !== Role.PATIENT) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const { passwordHash: _ph, isActive: _ia, ...safeUser } = user;
    logAuthEvent('patient_login', { userId: safeUser.id, event: 'password_login' });
    res.json(toAuthResponse(safeUser));
  })
);

app.post(
  '/auth/patient-forgot-password',
  asyncRoute(async (req, res) => {
    const body = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: { id: true, role: true, email: true, isActive: true }
    });

    if (!user || !user.isActive || user.role !== Role.PATIENT) {
      return res.json({ message: 'If the account exists, a reset link has been sent.' });
    }

    const token = randomToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      }
    });

    const resetUrl = `${webOrigin}/auth/reset?token=${token}`;

    const mailer = getMailTransporter();
    if (mailer) {
      await mailer.sendMail({
        from: smtpFrom,
        to: body.email,
        subject: 'Reset your Vitalis Care password',
        html: `<p>Click the link below to reset your password. It expires in 30 minutes.</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>`
      });
    } else if (process.env.NODE_ENV !== 'production') {
      console.log(`[dev] Patient password reset token for ${body.email}: ${token}`);
      console.log(`[dev] Reset URL: ${resetUrl}`);
    }

    res.json({ message: 'If the account exists, a reset link has been sent.' });
  })
);

app.post(
  '/auth/patient-reset-password',
  asyncRoute(async (req, res) => {
    const body = z.object({ token: z.string().min(20), password: z.string().min(8) }).parse(req.body);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(body.token) },
      include: { user: { select: { ...publicUserSelect, role: true } } }
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    if (resetToken.user.role !== Role.PATIENT) {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } })
    ]);

    const { role: _r, ...safeUser } = resetToken.user;
    res.json(toAuthResponse({ ...safeUser, role: resetToken.user.role }));
  })
);

app.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.get(
  '/patient/profile',
  authRequired,
  allowRoles(Role.PATIENT),
  asyncRoute(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, mobile: true,
        allergies: true, currentMedications: true, chronicConditions: true
      }
    });
    res.json({ profile: user });
  })
);

app.put(
  '/patient/profile',
  authRequired,
  allowRoles(Role.PATIENT),
  asyncRoute(async (req, res) => {
    const body = z.object({
      name: z.string().min(1).max(100),
      allergies: z.string().max(1000).optional(),
      currentMedications: z.string().max(2000).optional(),
      chronicConditions: z.string().max(1000).optional()
    }).parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: body,
      select: {
        id: true, name: true, email: true, mobile: true,
        allergies: true, currentMedications: true, chronicConditions: true
      }
    });
    res.json({ profile: updated });
  })
);

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

app.get(
  '/admin/diseases/list',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (_req, res) => {
    const diseases = await prisma.disease.findMany({ orderBy: { name: 'asc' } });
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

app.put(
  '/admin/diseases/:id',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        name: z.string().min(3),
        description: z.string().min(3),
        feeInPaise: z.number().int().positive(),
        isActive: z.boolean(),
        intakeQuestions: z.array(z.string().min(1)).min(1)
      })
      .parse(req.body);

    const disease = await prisma.disease.update({
      where: { id: routeParam(req, 'id') },
      data: body
    });
    res.json({ disease });
  })
);

app.get(
  '/admin/doctors',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const page = queryPositiveInt(req, 'page', 1);
    const pageSize = queryPositiveInt(req, 'pageSize', 10);
    const query = queryText(req, 'q').trim();
    const status = queryText(req, 'status').toUpperCase();
    const sortBy = queryText(req, 'sortBy');
    const sortDirection = queryText(req, 'sortDirection').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const where = {
      role: Role.DOCTOR,
      ...(status === 'ACTIVE' ? { isActive: true } : {}),
      ...(status === 'INACTIVE' ? { isActive: false } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
              { mobile: { contains: query, mode: 'insensitive' as const } },
              { doctorProfile: { specialty: { contains: query, mode: 'insensitive' as const } } }
            ]
          }
        : {})
    };

    const orderBy =
      sortBy === 'name'
        ? ({ name: sortDirection } as const)
        : sortBy === 'status'
          ? ({ isActive: sortDirection } as const)
          : ({ createdAt: sortDirection } as const);

    const total = await prisma.user.count({ where });
    const doctors = await prisma.user.findMany({
      where,
      select: { ...publicUserSelect, isActive: true, createdAt: true, doctorProfile: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    res.json({
      doctors,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  })
);

app.get(
  '/admin/doctors/pending',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const page = queryPositiveInt(req, 'page', 1);
    const pageSize = queryPositiveInt(req, 'pageSize', 10);
    const query = queryText(req, 'q').trim();

    const where = {
      role: Role.DOCTOR,
      isActive: false,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' as const } },
              { email: { contains: query, mode: 'insensitive' as const } },
              { mobile: { contains: query, mode: 'insensitive' as const } },
              { doctorProfile: { specialty: { contains: query, mode: 'insensitive' as const } } }
            ]
          }
        : {})
    };

    const total = await prisma.user.count({ where });
    const pendingDoctors = await prisma.user.findMany({
      where,
      select: { ...publicUserSelect, isActive: true, createdAt: true, doctorProfile: true },
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    res.json({
      pendingDoctors,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  })
);

app.get(
  '/admin/consumers',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const page = queryPositiveInt(req, 'page', 1);
    const pageSize = queryPositiveInt(req, 'pageSize', 10);
    const query = queryText(req, 'q').trim().toLowerCase();
    const sortBy = queryText(req, 'sortBy');
    const sortDirection = queryText(req, 'sortDirection').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const consultations = await prisma.consultation.findMany({
      select: {
        patient: { select: publicUserSelect }
      }
    });

    const grouped = new Map<string, { id: string; name: string; email: string; mobile: string; consultations: number }>();
    for (const row of consultations) {
      const patient = row.patient;
      if (!patient?.id) {
        continue;
      }

      const existing = grouped.get(patient.id);
      if (existing) {
        existing.consultations += 1;
        continue;
      }

      grouped.set(patient.id, {
        id: patient.id,
        name: patient.name || 'Unknown',
        email: patient.email || '',
        mobile: patient.mobile || '',
        consultations: 1
      });
    }

    const filtered = Array.from(grouped.values()).filter((consumer) => {
      if (!query) {
        return true;
      }

      return [consumer.name, consumer.email, consumer.mobile].join(' ').toLowerCase().includes(query);
    });

    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const compare = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? compare : -compare;
      }

      const compare = a.consultations - b.consultations;
      return sortDirection === 'asc' ? compare : -compare;
    });

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const consumers = filtered.slice(start, start + pageSize);

    res.json({
      consumers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  })
);

app.get(
  '/admin/consumers/:id',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const patientId = routeParam(req, 'id');
    const patient = await prisma.user.findFirst({
      where: { id: patientId, role: Role.PATIENT },
      select: publicUserSelect
    });

    if (!patient) {
      return res.status(404).json({ message: 'Consumer not found' });
    }

    const consultations = await prisma.consultation.findMany({
      where: { patientId },
      include: includeConsultationRelations(),
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const [totalDoseEvents, takenDoseEvents, skippedDoseEvents, missedDoseEvents] = await Promise.all([
      prisma.medicineDoseEvent.count({ where: { patientId } }),
      prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.TAKEN } }),
      prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.SKIPPED } }),
      prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.MISSED } })
    ]);

    const adherencePercent = totalDoseEvents ? Math.round((takenDoseEvents / totalDoseEvents) * 100) : 0;
    res.json({
      consumer: patient,
      consultations,
      adherence: {
        total: totalDoseEvents,
        taken: takenDoseEvents,
        skipped: skippedDoseEvents,
        missed: missedDoseEvents,
        percent: adherencePercent
      }
    });
  })
);

app.post(
  '/admin/doctors/:id/approve',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const doctorId = routeParam(req, 'id');
    const doctor = await prisma.user.update({
      where: { id: doctorId },
      data: { isActive: true },
      select: { ...publicUserSelect, isActive: true, doctorProfile: true }
    });
    await writeAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'doctor.approve',
      targetType: 'doctor',
      targetId: doctor.id,
      summary: 'Doctor approved by admin.'
    });

    res.json({ doctor, message: 'Doctor approved successfully.' });
  })
);

app.post(
  '/admin/doctors/:id/reject',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const doctorId = routeParam(req, 'id');
    const doctor = await prisma.user.update({
      where: { id: doctorId },
      data: { isActive: false },
      select: { ...publicUserSelect, isActive: true, doctorProfile: true }
    });
    await writeAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'doctor.reject',
      targetType: 'doctor',
      targetId: doctor.id,
      summary: 'Doctor marked pending/inactive by admin.'
    });

    res.json({ doctor, message: 'Doctor marked as not approved.' });
  })
);

app.post(
  '/admin/doctors/:id/status',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const doctorId = routeParam(req, 'id');
    const body = z.object({ isActive: z.boolean() }).parse(req.body);
    const existing = await prisma.user.findFirst({
      where: { id: doctorId, role: Role.DOCTOR },
      select: { id: true }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const doctor = await prisma.user.update({
      where: { id: doctorId },
      data: { isActive: body.isActive },
      select: { ...publicUserSelect, isActive: true, doctorProfile: true }
    });
    await writeAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: body.isActive ? 'doctor.activate' : 'doctor.deactivate',
      targetType: 'doctor',
      targetId: doctor.id,
      summary: body.isActive ? 'Doctor activated by admin.' : 'Doctor deactivated by admin.'
    });

    res.json({
      doctor,
      message: body.isActive ? 'Doctor activated successfully.' : 'Doctor deactivated successfully.'
    });
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
    await writeAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'doctor.create',
      targetType: 'doctor',
      targetId: doctor.id,
      summary: 'Doctor account created by admin.',
      metadata: { specialty: body.specialty }
    });

    res.status(201).json({ doctor });
  })
);

app.put(
  '/admin/doctors/:id',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const doctorId = routeParam(req, 'id');
    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        mobile: z.string().min(8).optional().or(z.literal('')),
        specialty: z.string().min(2),
        registrationNo: z.string().optional().or(z.literal('')),
        isAvailable: z.boolean().optional().default(true)
      })
      .parse(req.body);

    const existing = await prisma.user.findFirst({
      where: { id: doctorId, role: Role.DOCTOR },
      select: { id: true }
    });
    if (!existing) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const doctor = await prisma.user.update({
      where: { id: doctorId },
      data: {
        name: body.name,
        email: body.email,
        mobile: body.mobile || null,
        doctorProfile: {
          upsert: {
            create: {
              specialty: body.specialty,
              registrationNo: body.registrationNo || null,
              isAvailable: body.isAvailable
            },
            update: {
              specialty: body.specialty,
              registrationNo: body.registrationNo || null,
              isAvailable: body.isAvailable
            }
          }
        }
      },
      select: { ...publicUserSelect, isActive: true, doctorProfile: true }
    });
    await writeAuditLog({
      actorId: req.user!.id,
      actorRole: req.user!.role,
      action: 'doctor.update',
      targetType: 'doctor',
      targetId: doctor.id,
      summary: 'Doctor profile updated by admin.',
      metadata: { isAvailable: body.isAvailable, specialty: body.specialty }
    });

    res.json({ doctor, message: 'Doctor profile updated successfully.' });
  })
);

app.get(
  '/admin/audit-logs',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const page = queryPositiveInt(req, 'page', 1);
    const pageSize = queryPositiveInt(req, 'pageSize', 20);
    const total = await prisma.auditLog.count();
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    res.json({
      logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  })
);

app.get(
  '/billing/plans',
  asyncRoute(async (_req, res) => {
    await ensureBillingPlans();
    const plans = await prisma.billingPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { priceInPaise: 'asc' }]
    });
    res.json({ plans });
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
        intakeAnswers: z.record(z.string(), z.string().min(1)),
        purchaseType: z.enum(['ONE_TIME', 'PLAN']).optional().default('ONE_TIME'),
        planCode: z.string().min(2).optional()
      })
      .parse(req.body);

    await ensureBillingPlans();
    const disease = await prisma.disease.findUniqueOrThrow({ where: { id: body.diseaseId } });
    const selectedPlan =
      body.purchaseType === 'PLAN'
        ? await prisma.billingPlan.findFirst({
            where: { code: body.planCode || '', isActive: true }
          })
        : await prisma.billingPlan.findFirst({
            where: { code: 'ONE_TIME', isActive: true }
          });
    if (!selectedPlan) {
      return res.status(400).json({ message: 'Selected billing plan is not available.' });
    }

    const amountInPaise = body.purchaseType === 'ONE_TIME' ? disease.feeInPaise : selectedPlan.priceInPaise;
    const consultation = await prisma.consultation.create({
      data: {
        patientId: req.user!.id,
        diseaseId: disease.id,
        intakeAnswers: body.intakeAnswers,
        billingPlanCode: selectedPlan.code,
        pricingSnapshot: {
          purchaseType: body.purchaseType,
          diseaseFeeInPaise: disease.feeInPaise,
          selectedPlanCode: selectedPlan.code,
          selectedPlanName: selectedPlan.name,
          selectedPlanPriceInPaise: selectedPlan.priceInPaise
        },
        payment: {
          create: {
            amountInPaise,
            billingPlanCode: selectedPlan.code,
            lineItems: {
              purchaseType: body.purchaseType,
              diseaseName: disease.name,
              diseaseFeeInPaise: disease.feeInPaise,
              planCode: selectedPlan.code,
              planName: selectedPlan.name,
              consultationsLimit: selectedPlan.consultationsLimit
            },
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
      include: {
        ...includeConsultationRelations(),
        patient: { select: { id: true, name: true, mobile: true, email: true } }
      }
    });

    const patient = (consultation as any).patient;
    if (patient) {
      void notificationService.sendBatch(
        enabledNotificationChannels.map((ch) => ({
          eventType: 'DOCTOR_ASSIGNED' as const,
          channel: ch,
          recipientId: patient.id,
          recipientName: patient.name,
          recipientMobile: patient.mobile,
          recipientEmail: patient.email,
          title: 'Doctor assigned — Vitalis Care',
          body: `Dr. ${doctor.name} has been assigned to your consultation. You can now chat with your doctor in the app.`
        }))
      );
      io.to(`user:${patient.id}`).emit('consultation:updated', { consultationId: consultation.id, status: consultation.status });
    }

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

    io.to(`consultation:${consultation.id}`).emit('message:new', message);
    io.to(`user:${consultation.patientId}`).emit('message:new', message);
    if (consultation.assignedDoctorId) {
      io.to(`user:${consultation.assignedDoctorId}`).emit('message:new', message);
    }

    res.status(201).json({ message });
  })
);

app.post(
  '/doctor/prescription-options',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        type: z.nativeEnum(PrescriptionOptionType),
        label: z.string().min(2)
      })
      .parse(req.body);

    const normalizedLabel = normalizeOptionLabel(body.label);

    const option = await prisma.prescriptionOption.upsert({
      where: {
        type_normalizedLabel: {
          type: body.type,
          normalizedLabel
        }
      },
      update: {
        label: body.label.trim()
      },
      create: {
        type: body.type,
        label: body.label.trim(),
        normalizedLabel,
        isSystem: false,
        createdById: req.user!.id
      }
    });

    res.status(201).json({ option });
  })
);

app.get(
  '/doctor/prescription-options',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const query = z
      .object({
        type: z.nativeEnum(PrescriptionOptionType)
      })
      .parse(req.query);

    const options = await prisma.prescriptionOption.findMany({
      where: { type: query.type },
      orderBy: [{ isSystem: 'desc' }, { label: 'asc' }]
    });

    res.json({ options });
  })
);

const templateItemSchema = z.object({
  medicineName: z.string().min(1),
  strength: z.string().optional(),
  dose: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  instructions: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0)
});

const templateInputSchema = z.object({
  name: z.string().min(1).max(120),
  diagnosis: z.string().max(500).default(''),
  advice: z.string().max(2000).optional(),
  notes: z.string().max(2000).default(''),
  items: z.array(templateItemSchema).min(1)
});

app.get(
  '/doctor/prescription-templates',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const templates = await prisma.prescriptionTemplate.findMany({
      where: { doctorId: req.user!.id },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ templates });
  })
);

app.post(
  '/doctor/prescription-templates',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = templateInputSchema.parse(req.body);
    const template = await prisma.prescriptionTemplate.create({
      data: {
        doctorId: req.user!.id,
        name: body.name,
        diagnosis: body.diagnosis,
        advice: body.advice,
        notes: body.notes,
        items: {
          create: body.items.map((item, i) => ({ ...item, sortOrder: item.sortOrder ?? i }))
        }
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } }
    });
    res.status(201).json({ template });
  })
);

app.put(
  '/doctor/prescription-templates/:id',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = templateInputSchema.parse(req.body);
    const existing = await prisma.prescriptionTemplate.findUnique({ where: { id: routeParam(req, 'id') } });
    if (!existing || existing.doctorId !== req.user!.id) {
      return res.status(404).json({ message: 'Template not found' });
    }

    await prisma.prescriptionTemplateItem.deleteMany({ where: { templateId: existing.id } });
    const template = await prisma.prescriptionTemplate.update({
      where: { id: existing.id },
      data: {
        name: body.name,
        diagnosis: body.diagnosis,
        advice: body.advice,
        notes: body.notes,
        items: {
          create: body.items.map((item, i) => ({ ...item, sortOrder: item.sortOrder ?? i }))
        }
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } }
    });
    res.json({ template });
  })
);

app.delete(
  '/doctor/prescription-templates/:id',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const existing = await prisma.prescriptionTemplate.findUnique({ where: { id: routeParam(req, 'id') } });
    if (!existing || existing.doctorId !== req.user!.id) {
      return res.status(404).json({ message: 'Template not found' });
    }
    await prisma.prescriptionTemplate.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  })
);

const prescriptionItemInputSchema = z.object({
  medicineName: z.string().min(2),
  strength: z.string().min(1).optional(),
  dose: z.string().min(1).optional(),
  frequency: z.string().min(1).optional(),
  duration: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
  durationDays: z.number().int().min(1).max(120).optional(),
  intakeTimes: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1).max(6).optional()
});

const prescriptionInputSchema = z.object({
  methodOptionId: z.string().min(1),
  diagnosedDiseaseOptionId: z.string().min(1),
  diagnosis: z.string().min(3),
  advice: z.string().min(3).optional(),
  notes: z.string().min(5),
  fileUrl: z.string().url().optional().or(z.literal('')),
  followUpDate: z.coerce.date().optional(),
  status: z.nativeEnum(PrescriptionStatus).default(PrescriptionStatus.DRAFT),
  items: z.array(prescriptionItemInputSchema).min(1)
});

app.get(
  '/doctor/appointments/:id/prescriptions',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const consultation = await prisma.consultation.findUnique({
      where: { id: routeParam(req, 'id') },
      select: { id: true, assignedDoctorId: true, status: true }
    });

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    if (req.user!.role === Role.DOCTOR && consultation.assignedDoctorId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { consultationId: consultation.id },
      include: includePrescriptionRelations(),
      orderBy: { version: 'desc' }
    });

    res.json({ prescriptions, consultation: { status: consultation.status } });
  })
);

app.post(
  '/doctor/appointments/:id/prescriptions',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = prescriptionInputSchema.parse(req.body);

    const consultation = await prisma.consultation.findUniqueOrThrow({ where: { id: routeParam(req, 'id') } });
    if (req.user!.role === Role.DOCTOR && consultation.assignedDoctorId !== req.user!.id) {
      return res.status(403).json({ message: 'Only the assigned doctor can manage prescription' });
    }

    const [methodOption, diagnosedDiseaseOption] = await Promise.all([
      prisma.prescriptionOption.findFirst({
        where: { id: body.methodOptionId, type: PrescriptionOptionType.METHOD }
      }),
      prisma.prescriptionOption.findFirst({
        where: { id: body.diagnosedDiseaseOptionId, type: PrescriptionOptionType.DIAGNOSED_DISEASE }
      })
    ]);

    if (!methodOption || !diagnosedDiseaseOption) {
      return res.status(400).json({ message: 'Invalid prescription method or diagnosed disease option.' });
    }

    const prescription = await prisma.$transaction(async (tx) => {
      const previous = await tx.prescription.findFirst({
        where: { consultationId: consultation.id },
        orderBy: { version: 'desc' }
      });

      const nextVersion = (previous?.version || 0) + 1;
      await tx.prescription.updateMany({
        where: { consultationId: consultation.id, isLatest: true },
        data: { isLatest: false }
      });

      const created = await tx.prescription.create({
        data: {
          consultationId: consultation.id,
          uploadedById: req.user!.id,
          patientId: consultation.patientId,
          version: nextVersion,
          isLatest: true,
          methodOptionId: methodOption.id,
          diagnosedDiseaseOptionId: diagnosedDiseaseOption.id,
          diagnosis: body.diagnosis,
          advice: body.advice || null,
          notes: body.notes,
          fileUrl: body.fileUrl || null,
          followUpDate: body.followUpDate || null,
          status: body.status
        }
      });

      const createdItems = [];
      for (const [index, item] of body.items.entries()) {
        const createdItem = await tx.prescriptionItem.create({
          data: {
            prescriptionId: created.id,
            medicineName: item.medicineName,
            strength: item.strength,
            dose: item.dose,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            durationDays: item.durationDays,
            intakeTimes: item.intakeTimes,
            sortOrder: index
          }
        });

        createdItems.push(createdItem);
      }

      if (body.status === PrescriptionStatus.PUBLISHED) {
        const scheduleEvents = buildDoseScheduleEvents({
          patientId: consultation.patientId,
          prescriptionId: created.id,
          prescriptionItems: createdItems
        });

        if (scheduleEvents.length) {
          await tx.medicineDoseEvent.createMany({
            data: scheduleEvents
          });
        }
      }

      return tx.prescription.findUniqueOrThrow({
        where: { id: created.id },
        include: includePrescriptionRelations()
      });
    });

    await prisma.consultation.update({
      where: { id: consultation.id },
      data: {
        status:
          body.status === PrescriptionStatus.PUBLISHED
            ? ConsultationStatus.PRESCRIPTION_UPLOADED
            : consultation.status
      }
    });

    if (body.status === PrescriptionStatus.PUBLISHED) {
      const rxPatient = (prescription as any).patient;
      if (rxPatient) {
        void notificationService.sendBatch(
          enabledNotificationChannels.map((ch) => ({
            eventType: 'PRESCRIPTION_READY' as const,
            channel: ch,
            recipientId: rxPatient.id,
            recipientName: rxPatient.name,
            recipientMobile: rxPatient.mobile,
            recipientEmail: rxPatient.email,
            title: 'Your prescription is ready — Vitalis Care',
            body: `Your doctor has published a new prescription. Open the app to view your medicines and dosage schedule.`
          }))
        );
        io.to(`user:${rxPatient.id}`).emit('prescription:new', { prescriptionId: prescription.id, consultationId: consultation.id });
      }
    }

    res.status(201).json({ prescription });
  })
);

app.put(
  '/doctor/prescriptions/:id',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const body = prescriptionInputSchema.parse(req.body);
    const prescription = await prisma.prescription.findUnique({
      where: { id: routeParam(req, 'id') },
      include: { consultation: { select: { assignedDoctorId: true } } }
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (!prescription.isLatest) {
      return res.status(400).json({ message: 'Only the latest version can be edited.' });
    }

    if (prescription.status === PrescriptionStatus.PUBLISHED) {
      return res.status(400).json({ message: 'Published prescriptions cannot be edited. Create follow-up version.' });
    }

    if (req.user!.role === Role.DOCTOR && prescription.consultation.assignedDoctorId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [methodOption, diagnosedDiseaseOption] = await Promise.all([
      prisma.prescriptionOption.findFirst({
        where: { id: body.methodOptionId, type: PrescriptionOptionType.METHOD }
      }),
      prisma.prescriptionOption.findFirst({
        where: { id: body.diagnosedDiseaseOptionId, type: PrescriptionOptionType.DIAGNOSED_DISEASE }
      })
    ]);

    if (!methodOption || !diagnosedDiseaseOption) {
      return res.status(400).json({ message: 'Invalid prescription method or diagnosed disease option.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPrescription = await tx.prescription.update({
        where: { id: prescription.id },
        data: {
          methodOptionId: methodOption.id,
          diagnosedDiseaseOptionId: diagnosedDiseaseOption.id,
          diagnosis: body.diagnosis,
          advice: body.advice || null,
          notes: body.notes,
          fileUrl: body.fileUrl || null,
          followUpDate: body.followUpDate || null,
          status: body.status,
          uploadedById: req.user!.id
        }
      });

      await tx.prescriptionItem.deleteMany({ where: { prescriptionId: updatedPrescription.id } });

      const createdItems = [];
      for (const [index, item] of body.items.entries()) {
        const createdItem = await tx.prescriptionItem.create({
          data: {
            prescriptionId: updatedPrescription.id,
            medicineName: item.medicineName,
            strength: item.strength,
            dose: item.dose,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.instructions,
            durationDays: item.durationDays,
            intakeTimes: item.intakeTimes,
            sortOrder: index
          }
        });
        createdItems.push(createdItem);
      }

      await tx.medicineDoseEvent.deleteMany({ where: { prescriptionId: updatedPrescription.id } });
      if (body.status === PrescriptionStatus.PUBLISHED) {
        const events = buildDoseScheduleEvents({
          patientId: updatedPrescription.patientId,
          prescriptionId: updatedPrescription.id,
          prescriptionItems: createdItems
        });
        if (events.length) {
          await tx.medicineDoseEvent.createMany({ data: events });
        }
      }

      return tx.prescription.findUniqueOrThrow({
        where: { id: updatedPrescription.id },
        include: includePrescriptionRelations()
      });
    });

    if (body.status === PrescriptionStatus.PUBLISHED) {
      await prisma.consultation.update({
        where: { id: updated.consultation.id },
        data: { status: ConsultationStatus.PRESCRIPTION_UPLOADED }
      });

      const updatedPatient = (updated as any).patient;
      if (updatedPatient) {
        void notificationService.sendBatch(
          enabledNotificationChannels.map((ch) => ({
            eventType: 'PRESCRIPTION_READY' as const,
            channel: ch,
            recipientId: updatedPatient.id,
            recipientName: updatedPatient.name,
            recipientMobile: updatedPatient.mobile,
            recipientEmail: updatedPatient.email,
            title: 'Your prescription is ready — Vitalis Care',
            body: `Your doctor has published a new prescription. Open the app to view your medicines and dosage schedule.`
          }))
        );
        io.to(`user:${updatedPatient.id}`).emit('prescription:new', { prescriptionId: updated.id, consultationId: updated.consultation.id });
      }
    }

    res.json({ prescription: updated });
  })
);

app.get(
  '/doctor/prescriptions/:id',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const prescription = await prisma.prescription.findUnique({
      where: { id: routeParam(req, 'id') },
      include: includePrescriptionRelations()
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    if (req.user!.role === Role.DOCTOR && prescription.consultation.assignedDoctorId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ prescription });
  })
);

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

    const rxPatient = (prescription as any).patient;
    const items = prescription.items || [];
    const date = new Date(prescription.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const followUp = prescription.followUpDate
      ? new Date(prescription.followUpDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : null;

    // Generate real PDF using pdfkit
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `prescription-${prescription.id.slice(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const PRIMARY = '#1d4ed8';
    const GRAY = '#6b7280';
    const W = doc.page.width - 100; // usable width

    // ── Header ────────────────────────────────────────────────
    doc.fontSize(18).fillColor(PRIMARY).font('Helvetica-Bold')
       .text('Vitalis Care and Research Centre', 50, 50);
    doc.fontSize(10).fillColor(GRAY).font('Helvetica')
       .text('Doctor-led digital consultations  |  vitaliscare.in', 50, 72);
    // Rx symbol (right-aligned)
    doc.fontSize(36).fillColor(PRIMARY).font('Helvetica-Oblique')
       .text('Rx', doc.page.width - 90, 45, { width: 60, align: 'right' });
    // Divider
    doc.moveTo(50, 98).lineTo(doc.page.width - 50, 98).strokeColor(PRIMARY).lineWidth(1.5).stroke();

    // ── Patient / meta grid ───────────────────────────────────
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
    if (prescription.methodOption) {
      metaCol('Method', prescription.methodOption.label, 50, y);
      y += 28;
    }
    if (prescription.diagnosedDiseaseOption) {
      metaCol('Condition', prescription.diagnosedDiseaseOption.label, 50, y);
      y += 28;
    }
    y += 5;
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    y += 10;

    // ── Medicines table ───────────────────────────────────────
    doc.fontSize(9).fillColor(GRAY).font('Helvetica').text('MEDICINES', 50, y);
    y += 14;
    const colWidths = [24, 140, 60, 80, 70, W - 374];
    const colX = colWidths.reduce<number[]>((acc, w, i) => {
      acc.push(i === 0 ? 50 : acc[i - 1] + colWidths[i - 1]);
      return acc;
    }, []);
    const headers = ['#', 'Medicine', 'Dose', 'Frequency', 'Duration', 'Instructions'];

    // Header row
    doc.rect(50, y, W, 18).fillColor(PRIMARY).fill();
    headers.forEach((h, i) => {
      doc.fontSize(9).fillColor('white').font('Helvetica-Bold')
         .text(h, colX[i] + 3, y + 4, { width: colWidths[i] - 6, ellipsis: true });
    });
    y += 18;

    if (items.length === 0) {
      doc.rect(50, y, W, 20).fillColor('#f8faff').fill();
      doc.fontSize(10).fillColor(GRAY).font('Helvetica').text('No items', 50, y + 5, { width: W, align: 'center' });
      y += 20;
    } else {
      items.forEach((item, i) => {
        const bg = i % 2 === 0 ? 'white' : '#f8faff';
        const rowH = 20;
        doc.rect(50, y, W, rowH).fillColor(bg).fill();
        const rowData = [
          String(i + 1),
          item.medicineName + (item.strength ? ` (${item.strength})` : ''),
          item.dose || '—',
          item.frequency || '—',
          item.duration || '—',
          item.instructions || '—'
        ];
        rowData.forEach((val, ci) => {
          doc.fontSize(9).fillColor('#111').font('Helvetica')
             .text(val, colX[ci] + 3, y + 5, { width: colWidths[ci] - 6, ellipsis: true });
        });
        y += rowH;
      });
    }
    // table bottom border
    doc.moveTo(50, y).lineTo(doc.page.width - 50, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    y += 14;

    // ── Notes / Advice ────────────────────────────────────────
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
    if (prescription.notes)  infoBox('CLINICAL NOTES', prescription.notes);
    if (prescription.advice) infoBox('ADVICE', prescription.advice);

    if (followUp) {
      doc.rect(50, y, W, 22).fillColor('#dbeafe').fill();
      doc.fontSize(10).fillColor('#1e40af').font('Helvetica-Bold')
         .text(`Follow-up due: ${followUp}`, 58, y + 6);
      y += 30;
    }

    // ── Signature ─────────────────────────────────────────────
    const sigY = doc.page.height - 80;
    doc.moveTo(doc.page.width - 200, sigY).lineTo(doc.page.width - 50, sigY)
       .strokeColor('#374151').lineWidth(0.5).stroke();
    doc.fontSize(10).fillColor(GRAY).font('Helvetica')
       .text(prescription.uploadedBy?.name || 'Doctor', doc.page.width - 200, sigY + 5, { width: 150, align: 'center' });
    doc.fontSize(9).text('Vitalis Care', doc.page.width - 200, sigY + 17, { width: 150, align: 'center' });

    doc.end();
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
    const preferences = stored || DEFAULT_REMINDER_PREFERENCE;
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

app.get(
  '/doctor/patients/:id/adherence-summary',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const patientId = routeParam(req, 'id');
    if (req.user!.role === Role.DOCTOR) {
      const linkedConsultation = await prisma.consultation.findFirst({
        where: { patientId, assignedDoctorId: req.user!.id },
        select: { id: true }
      });

      if (!linkedConsultation) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const [total, taken, skipped, missed] = await Promise.all([
      prisma.medicineDoseEvent.count({ where: { patientId } }),
      prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.TAKEN } }),
      prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.SKIPPED } }),
      prisma.medicineDoseEvent.count({ where: { patientId, status: DoseEventStatus.MISSED } })
    ]);

    const adherencePercent = total ? Math.round((taken / total) * 100) : 0;
    res.json({
      patientId,
      totals: { total, taken, skipped, missed },
      adherencePercent
    });
  })
);

app.get(
  '/doctor/patients/:id/adherence-trend',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const patientId = routeParam(req, 'id');
    const days = queryPositiveInt(req, 'days', 7, 1, 30);
    if (req.user!.role === Role.DOCTOR) {
      const linkedConsultation = await prisma.consultation.findFirst({
        where: { patientId, assignedDoctorId: req.user!.id },
        select: { id: true }
      });

      if (!linkedConsultation) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const events = await prisma.medicineDoseEvent.findMany({
      where: {
        patientId,
        scheduledFor: { gte: start, lte: end }
      },
      select: { scheduledFor: true, status: true }
    });

    const trendMap = new Map<
      string,
      { date: string; total: number; taken: number; skipped: number; missed: number; pending: number; adherencePercent: number }
    >();
    for (let index = 0; index < days; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      trendMap.set(key, {
        date: key,
        total: 0,
        taken: 0,
        skipped: 0,
        missed: 0,
        pending: 0,
        adherencePercent: 0
      });
    }

    for (const event of events) {
      const key = event.scheduledFor.toISOString().slice(0, 10);
      const day = trendMap.get(key);
      if (!day) {
        continue;
      }

      day.total += 1;
      if (event.status === DoseEventStatus.TAKEN) day.taken += 1;
      else if (event.status === DoseEventStatus.SKIPPED) day.skipped += 1;
      else if (event.status === DoseEventStatus.MISSED) day.missed += 1;
      else day.pending += 1;
    }

    const trend = Array.from(trendMap.values()).map((day) => ({
      ...day,
      adherencePercent: day.total ? Math.round((day.taken / day.total) * 100) : 0
    }));
    const totals = trend.reduce(
      (acc, day) => {
        acc.total += day.total;
        acc.taken += day.taken;
        acc.skipped += day.skipped;
        acc.missed += day.missed;
        acc.pending += day.pending;
        return acc;
      },
      { total: 0, taken: 0, skipped: 0, missed: 0, pending: 0 }
    );

    res.json({
      patientId,
      days,
      totals,
      adherencePercent: totals.total ? Math.round((totals.taken / totals.total) * 100) : 0,
      trend
    });
  })
);

app.get(
  '/doctor/patients/:id/dose-events',
  authRequired,
  allowRoles(Role.DOCTOR, Role.ADMIN),
  asyncRoute(async (req, res) => {
    const patientId = routeParam(req, 'id');
    const days = queryPositiveInt(req, 'days', 7, 1, 30);

    if (req.user!.role === Role.DOCTOR) {
      const linkedConsultation = await prisma.consultation.findFirst({
        where: { patientId, assignedDoctorId: req.user!.id },
        select: { id: true }
      });
      if (!linkedConsultation) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const events = await prisma.medicineDoseEvent.findMany({
      where: {
        patientId,
        status: { in: [DoseEventStatus.SKIPPED, DoseEventStatus.MISSED] },
        scheduledFor: { gte: since }
      },
      select: {
        id: true,
        status: true,
        scheduledFor: true,
        skippedAt: true,
        note: true,
        prescriptionItem: { select: { medicineName: true } }
      },
      orderBy: { scheduledFor: 'desc' },
      take: 50
    });

    res.json({
      patientId,
      days,
      events: events.map((e) => ({
        id: e.id,
        status: e.status,
        scheduledFor: e.scheduledFor,
        interactedAt: e.skippedAt ?? null,
        note: e.note ?? null,
        medicineName: e.prescriptionItem.medicineName
      }))
    });
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
    const consultationId = routeParam(req, 'consultationId');
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: { payment: true }
    });
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found.' });
    }
    if (consultation.patientId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const payment = consultation.payment;
    if (!payment) {
      return res.status(400).json({ message: 'Payment record is missing for this consultation.' });
    }
    if (payment.status === PaymentStatus.PAID) {
      return res.status(400).json({ message: 'Payment is already completed.' });
    }

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: payment.amountInPaise,
      currency: 'INR',
      receipt: consultationId,
      notes: {
        consultationId,
        patientId: req.user!.id,
        billingPlanCode: payment.billingPlanCode || consultation.billingPlanCode || 'ONE_TIME'
      }
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerOrderId: order.id, status: PaymentStatus.CREATED }
    });

    res.json({
      orderId: order.id,
      amountInPaise: payment.amountInPaise,
      currency: 'INR',
      razorpayKeyId
    });
  })
);

app.post(
  '/payments/:consultationId/verify',
  authRequired,
  allowRoles(Role.PATIENT),
  asyncRoute(async (req, res) => {
    const body = z
      .object({
        razorpayOrderId: z.string().min(1),
        razorpayPaymentId: z.string().min(1),
        razorpaySignature: z.string().min(1)
      })
      .parse(req.body);
    const consultationId = routeParam(req, 'consultationId');
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        payment: true,
        patient: { select: { id: true, name: true, mobile: true, email: true } },
        disease: { select: { name: true } }
      }
    });
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found.' });
    }
    if (consultation.patientId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const payment = consultation.payment;
    if (!payment || payment.providerOrderId !== body.razorpayOrderId) {
      return res.status(400).json({ message: 'Payment order does not match consultation.' });
    }

    if (!verifyRazorpaySignature(body)) {
      return res.status(400).json({ message: 'Invalid Razorpay signature.' });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        providerPaymentId: body.razorpayPaymentId
      }
    });
    await prisma.consultation.update({
      where: { id: consultation.id },
      data: { status: ConsultationStatus.PAID }
    });

    const patient = consultation.patient;
    if (patient) {
      void notificationService.sendBatch(
        enabledNotificationChannels.map((channel) => ({
          eventType: 'BOOKING_CONFIRMED' as const,
          channel,
          recipientId: patient.id,
          recipientName: patient.name,
          recipientMobile: patient.mobile,
          recipientEmail: patient.email,
          title: 'Booking confirmed — Vitalis Care',
          body: `Your consultation for ${consultation.disease?.name || 'your concern'} has been booked and payment received. A doctor will be assigned shortly.`
        }))
      );
      io.to(`user:${patient.id}`).emit('payment:updated', { consultationId, status: 'PAID' });
    }

    res.json({ ok: true });
  })
);

app.post(
  '/payments/razorpay-webhook',
  asyncRoute(async (req, res) => {
    if (!razorpayWebhookSecret) {
      return res.status(503).json({ message: 'Razorpay webhook secret is not configured.' });
    }

    const signature = req.header('x-razorpay-signature') || '';
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    const expectedSignature = crypto.createHmac('sha256', razorpayWebhookSecret).update(rawBody).digest('hex');

    if (
      expectedSignature.length !== signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
    ) {
      return res.status(400).json({ message: 'Invalid webhook signature.' });
    }

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      payload?: {
        payment?: {
          entity?: {
            id: string;
            order_id: string;
          };
        };
      };
    };

    if (event.event !== 'payment.captured') {
      return res.json({ ok: true, ignored: true });
    }

    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity?.order_id) {
      return res.status(400).json({ message: 'Webhook payment payload is missing order id.' });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerOrderId: paymentEntity.order_id },
      select: { id: true, consultationId: true }
    });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found for Razorpay order.' });
    }
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        providerPaymentId: paymentEntity.id
      }
    });
    await prisma.consultation.update({
      where: { id: payment.consultationId },
      data: { status: ConsultationStatus.PAID }
    });

    const consultationForNotif = await prisma.consultation.findUnique({
      where: { id: payment.consultationId },
      select: {
        patient: { select: { id: true, name: true, mobile: true, email: true } },
        disease: { select: { name: true } }
      }
    });
    const webhookPatient = consultationForNotif?.patient;
    if (webhookPatient) {
      void notificationService.sendBatch(
        enabledNotificationChannels.map((channel) => ({
          eventType: 'BOOKING_CONFIRMED' as const,
          channel,
          recipientId: webhookPatient.id,
          recipientName: webhookPatient.name,
          recipientMobile: webhookPatient.mobile,
          recipientEmail: webhookPatient.email,
          title: 'Booking confirmed — Vitalis Care',
          body: `Your consultation for ${consultationForNotif?.disease?.name || 'your concern'} has been booked and payment received. A doctor will be assigned shortly.`
        }))
      );
      io.to(`user:${webhookPatient.id}`).emit('payment:updated', { consultationId: payment.consultationId, status: 'PAID' });
    }

    res.json({ ok: true });
  })
);

// ─── Doctor Slot Scheduling ──────────────────────────────────────────────────

// GET /doctor/slots?date=YYYY-MM-DD — doctor views their own slots for a date
app.get(
  '/doctor/slots',
  authRequired,
  allowRoles(Role.DOCTOR),
  asyncRoute(async (req, res) => {
    const dateStr = queryText(req, 'date');
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const where = dateStr
      ? { doctorId: doctor.id, date: new Date(dateStr) }
      : { doctorId: doctor.id };

    const slots = await prisma.doctorSlot.findMany({ where, orderBy: [{ date: 'asc' }, { startTime: 'asc' }] });
    res.json({ slots });
  })
);

// POST /doctor/slots — doctor creates/opens a slot
app.post(
  '/doctor/slots',
  authRequired,
  allowRoles(Role.DOCTOR),
  asyncRoute(async (req, res) => {
    const body = z.object({
      date:      z.string().min(1),
      startTime: z.string().min(1),
      endTime:   z.string().min(1)
    }).parse(req.body);

    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const slot = await prisma.doctorSlot.upsert({
      where: { doctorId_date_startTime: { doctorId: doctor.id, date: new Date(body.date), startTime: body.startTime } },
      create: { doctorId: doctor.id, date: new Date(body.date), startTime: body.startTime, endTime: body.endTime, isBlocked: false },
      update: { endTime: body.endTime, isBlocked: false }
    });
    res.status(201).json({ slot });
  })
);

// PATCH /doctor/slots/:id — toggle blocked
app.patch(
  '/doctor/slots/:id',
  authRequired,
  allowRoles(Role.DOCTOR),
  asyncRoute(async (req, res) => {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const slot = await prisma.doctorSlot.update({
      where: { id: routeParam(req, 'id'), doctorId: doctor.id },
      data: { isBlocked: req.body.isBlocked ?? false }
    });
    res.json({ slot });
  })
);

// DELETE /doctor/slots/:id
app.delete(
  '/doctor/slots/:id',
  authRequired,
  allowRoles(Role.DOCTOR),
  asyncRoute(async (req, res) => {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.id }, select: { id: true } });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    await prisma.doctorSlot.delete({ where: { id: routeParam(req, 'id'), doctorId: doctor.id } });
    res.json({ ok: true });
  })
);

// GET /doctors/:id/slots?date=YYYY-MM-DD — patient views available slots for a doctor
app.get(
  '/doctors/:id/slots',
  authRequired,
  asyncRoute(async (req, res) => {
    const dateStr = queryText(req, 'date');
    const doctor = await prisma.doctor.findUnique({ where: { id: routeParam(req, 'id') }, select: { id: true } });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const where = {
      doctorId: doctor.id,
      isBooked: false,
      isBlocked: false,
      ...(dateStr ? { date: new Date(dateStr) } : {})
    };

    const slots = await prisma.doctorSlot.findMany({
      where,
      select: { id: true, date: true, startTime: true, endTime: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });
    res.json({ slots });
  })
);

// ─── Admin Consultations ─────────────────────────────────────────────────────

// GET /admin/consultations?status=PENDING&page=1&pageSize=20&q=
app.get(
  '/admin/consultations',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const page = queryPositiveInt(req, 'page', 1);
    const pageSize = queryPositiveInt(req, 'pageSize', 20);
    const status = queryText(req, 'status');
    const assigned = queryText(req, 'assigned'); // 'yes' | 'no' | ''
    const q = queryText(req, 'q').trim().toLowerCase();

    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (assigned === 'no') where['assignedDoctorId'] = null;
    if (assigned === 'yes') where['assignedDoctorId'] = { not: null };

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        include: {
          patient:       { select: { id: true, name: true, mobile: true, email: true } },
          disease:       { select: { id: true, name: true } },
          assignedDoctor:{ select: { id: true, name: true } },
          payment:       { select: { status: true, amountInPaise: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.consultation.count({ where })
    ]);

    const filtered = q
      ? consultations.filter(c =>
          c.patient?.name?.toLowerCase().includes(q) ||
          c.disease?.name?.toLowerCase().includes(q)
        )
      : consultations;

    res.json({ consultations: filtered, total, page, pageSize });
  })
);

// PUT /admin/consultations/:id/assign
app.put(
  '/admin/consultations/:id/assign',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const { id } = req.params as { id: string };
    const { doctorId } = req.body as { doctorId: string };
    if (!doctorId) return res.status(400).json({ message: 'doctorId required' });

    const doctor = await prisma.doctor.findUniqueOrThrow({
      where: { id: doctorId },
      include: { user: { select: { id: true, name: true } } }
    });

    const consultation = await prisma.consultation.update({
      where: { id },
      data: { assignedDoctorId: doctor.userId, status: 'ACTIVE' as ConsultationStatus },
      include: {
        patient: { select: { id: true, name: true, mobile: true, email: true } },
        disease: { select: { name: true } },
        assignedDoctor: { select: { name: true } }
      }
    });

    io.to(`user:${consultation.patientId}`).emit('consultation:updated', { consultationId: id, status: 'ACTIVE' });
    io.to(`user:${doctor.userId}`).emit('consultation:assigned', { consultationId: id });

    res.json({ consultation });
  })
);

app.get(
  '/admin/payments',
  authRequired,
  allowRoles(Role.ADMIN),
  asyncRoute(async (req, res) => {
    const page = queryPositiveInt(req, 'page', 1);
    const pageSize = queryPositiveInt(req, 'pageSize', 20, 1, 100);
    const status = queryText(req, 'status').toUpperCase();
    const from = queryText(req, 'from');
    const to = queryText(req, 'to');
    const exportType = queryText(req, 'export').toLowerCase();

    const where: Prisma.PaymentWhereInput = {
      ...(status === 'PAID' || status === 'FAILED' || status === 'CREATED' ? { status: status as PaymentStatus } : {}),
      ...(from || to
        ? {
            createdAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {})
            }
          }
        : {})
    };

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          consultation: {
            select: {
              id: true,
              status: true,
              patient: { select: { id: true, name: true } },
              assignedDoctor: { select: { id: true, name: true } },
              disease: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    if (exportType === 'csv') {
      const lines = [
        'paymentId,consultationId,patientName,doctorName,disease,billingPlanCode,amountInPaise,status,providerOrderId,providerPaymentId,createdAt'
      ];
      for (const payment of payments) {
        lines.push(
          [
            payment.id,
            payment.consultationId,
            payment.consultation.patient?.name || '',
            payment.consultation.assignedDoctor?.name || '',
            payment.consultation.disease?.name || '',
            payment.billingPlanCode || '',
            String(payment.amountInPaise),
            payment.status,
            payment.providerOrderId || '',
            payment.providerPaymentId || '',
            payment.createdAt.toISOString()
          ]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(',')
        );
      }
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="admin-payments-page-${page}.csv"`);
      return res.send(lines.join('\n'));
    }

    const summary = payments.reduce(
      (acc, payment) => {
        acc.total += payment.amountInPaise;
        if (payment.status === PaymentStatus.PAID) acc.paid += payment.amountInPaise;
        if (payment.status === PaymentStatus.FAILED) acc.failedCount += 1;
        if (payment.status === PaymentStatus.CREATED) acc.pendingCount += 1;
        return acc;
      },
      { total: 0, paid: 0, failedCount: 0, pendingCount: 0 }
    );

    res.json({
      payments,
      summary,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  })
);

app.get(
  '/doctor/payments/summary',
  authRequired,
  allowRoles(Role.DOCTOR),
  asyncRoute(async (req, res) => {
    const doctorSharePercent = 60;
    const payments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        consultation: { assignedDoctorId: req.user!.id }
      },
      include: {
        consultation: {
          select: {
            id: true,
            status: true,
            disease: { select: { name: true } },
            patient: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const totals = payments.reduce(
      (acc, payment) => {
        acc.gross += payment.amountInPaise;
        acc.estimatedDoctorEarnings += Math.round((payment.amountInPaise * doctorSharePercent) / 100);
        return acc;
      },
      { gross: 0, estimatedDoctorEarnings: 0 }
    );

    res.json({
      doctorSharePercent,
      totals: {
        paidConsultations: payments.length,
        grossInPaise: totals.gross,
        estimatedDoctorEarningsInPaise: totals.estimatedDoctorEarnings
      },
      payments
    });
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

// ─── Store Management Routes ──────────────────────────────────────────────────
app.use('/store', storeRouter);
app.use('/hr', hrRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ message: 'Validation failed', issues: error.issues });
  }

  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

httpServer.listen(port, () => {
  console.log(`Clinic API running on http://localhost:${port}`);
  void ensureBillingPlans().catch((error) => {
    console.error('[billing] Failed to ensure billing plans', error);
  });
  if (!doseOverdueSweepEnabled) {
    console.log('[scheduler] Overdue dose sweep disabled');
  } else {
    console.log(`[scheduler] Overdue dose sweep enabled (interval: ${doseOverdueSweepIntervalMs}ms)`);
  }
  if (!doseReminderSweepEnabled) {
    console.log('[scheduler] Dose reminder sweep disabled');
  } else {
    console.log(`[scheduler] Dose reminder sweep enabled (window: ${doseReminderWindowMinutes} minutes)`);
  }
  console.log(`[scheduler] Notification channels: ${enabledNotificationChannels.join(', ') || 'none'}`);
  void runDoseSchedulers().catch((error) => {
    console.error('[scheduler] Initial dose scheduler run failed', error);
  });

  const timer = setInterval(() => {
    void runDoseSchedulers().catch((error) => {
      console.error('[scheduler] Dose scheduler run failed', error);
    });
  }, doseOverdueSweepIntervalMs);
  timer.unref();

  // Run leave restore once at startup, then every 24 hours
  void restoreEmployeesFromLeave().catch((e) => console.error('[scheduler] Leave restore failed', e));
  const leaveTimer = setInterval(() => {
    void restoreEmployeesFromLeave().catch((e) => console.error('[scheduler] Leave restore failed', e));
  }, 24 * 60 * 60 * 1000);
  leaveTimer.unref();
});
