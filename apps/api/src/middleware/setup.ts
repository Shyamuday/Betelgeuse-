import cors from 'cors';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { webOrigin } from '../server/config.js';

export function applyGlobalMiddleware(app: express.Application) {
  app.use(cors({ origin: webOrigin, credentials: true }));
  app.use('/payments/razorpay-webhook', express.raw({ type: 'application/json' }));

  const uploadsAttachmentRoot = path.join(process.cwd(), 'uploads', 'consultation-attachments');
  void fs.mkdir(uploadsAttachmentRoot, { recursive: true }).catch(() => {});
  app.use('/uploads/consultation-attachments', express.static(uploadsAttachmentRoot));

  app.use(express.json());
}
