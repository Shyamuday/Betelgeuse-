export type NotificationChannel = 'IN_APP' | 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH';
export type NotificationEventType = 'DOSE_REMINDER' | 'DOSE_MISSED';

export type NotificationMessage = {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  recipientId: string;
  recipientName?: string | null;
  recipientMobile?: string | null;
  recipientEmail?: string | null;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export interface NotificationProvider {
  send(message: NotificationMessage): Promise<void>;
}

export class ConsoleNotificationProvider implements NotificationProvider {
  async send(message: NotificationMessage) {
    console.info('[notification]', {
      at: new Date().toISOString(),
      ...message
    });
  }
}

export class NotificationService {
  constructor(private readonly provider: NotificationProvider) {}

  async sendBatch(messages: NotificationMessage[]) {
    if (!messages.length) {
      return;
    }

    await Promise.all(messages.map((message) => this.provider.send(message)));
  }
}
