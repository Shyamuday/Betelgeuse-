import { Router } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import { prisma } from '../../db.js';
import { generateOtp, storeOtp, verifyOtp, sendOtpSms, devOtp, isProduction } from '../../services/otp.js';
import { asyncRoute, publicUserSelect, toAuthResponse, logAuthEvent } from '../../utils/helpers.js';

export function registerAuthOtpRoutes(router: Router) {
// ─── OTP auth ──────────────────────────────────────────────────────────────────

router.post(
  '/auth/request-otp',
  asyncRoute(async (req, res) => {
    const body = z.object({ mobile: z.string().min(8) }).parse(req.body);
    const otp = isProduction ? generateOtp() : devOtp;
    storeOtp(body.mobile, otp);
    if (isProduction) {
      await sendOtpSms(body.mobile, otp);
    } else {
      console.info(`[otp] DEV — OTP for ${body.mobile}: ${otp}`);
    }
    res.json({ message: 'OTP sent.' });
  })
);

router.post(
  '/auth/patient-login',
  asyncRoute(async (req, res) => {
    const body = z.object({ mobile: z.string().min(8), otp: z.string().min(4) }).parse(req.body);

    if (!verifyOtp(body.mobile, body.otp)) {
      return res.status(401).json({ message: 'Invalid or expired OTP.' });
    }

    let user = await prisma.user.findFirst({
      where: { mobile: body.mobile },
      select: publicUserSelect
    });

    if (!user) {
      user = await prisma.user.create({
        data: { name: body.mobile, mobile: body.mobile, role: Role.PATIENT },
        select: publicUserSelect
      });
    }

    logAuthEvent('patient_login', { userId: user.id, mobile: body.mobile });
    res.json(toAuthResponse(user));
  })
);

}
