import { DoseEventStatus } from '@prisma/client';
import { prisma } from '../db.js';
import {
  doseReminderSweepEnabled,
  doseReminderWindowMinutes,
  enabledNotificationChannels,
  notificationService
} from '../server/config.js';

export async function markOverdueDosesAsMissed() {
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

export async function emitUpcomingDoseReminders() {
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

export async function runDoseSchedulers() {
  await Promise.all([markOverdueDosesAsMissed(), emitUpcomingDoseReminders()]);
}
