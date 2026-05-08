import 'dotenv/config';
import express from 'express';
import { applyGlobalMiddleware } from './middleware/setup.js';
import { registerErrorHandler } from './middleware/error-handler.js';
import { registerAllRoutes } from './routes/index.js';
import {
  doseOverdueSweepEnabled,
  doseOverdueSweepIntervalMs,
  doseReminderSweepEnabled,
  doseReminderWindowMinutes,
  enabledNotificationChannels
} from './server/config.js';
import { ensureBillingPlans } from './services/billing-plans.js';
import { runDoseSchedulers } from './services/dose-scheduler.js';

const app = express();
const port = Number(process.env.PORT || 4000);

applyGlobalMiddleware(app);
registerAllRoutes(app);

registerErrorHandler(app);

app.listen(port, () => {
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
});
