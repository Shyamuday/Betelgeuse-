export function normalizeOptionLabel(label: string) {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function fallbackIntakeTimesFromFrequency(frequency?: string | null) {
  const value = (frequency || '').toLowerCase();
  if (value.includes('three') || value.includes('thrice') || value.includes('3')) {
    return ['08:00', '14:00', '20:00'];
  }

  if (value.includes('twice') || value.includes('2')) {
    return ['09:00', '21:00'];
  }

  return ['09:00'];
}

export function buildDoseScheduleEvents(input: {
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
