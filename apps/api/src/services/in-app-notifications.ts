import type { Server as SocketIoServer } from 'socket.io';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { SOCKET_EVENTS, SOCKET_ROOM_PREFIXES } from '../constants/socket.constants.js';
import type { NotificationMessage, NotificationProvider } from '../notifications.js';

export type InAppNotificationPayload = {
  id: string;
  eventType: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

let socketIo: SocketIoServer | null = null;

export function setNotificationSocket(io: SocketIoServer) {
  socketIo = io;
}

function emitInAppNotification(notification: InAppNotificationPayload, recipient: {
  userId?: string | null;
  storeStaffId?: string | null;
}) {
  if (!socketIo) return;
  if (recipient.userId) {
    socketIo.to(`${SOCKET_ROOM_PREFIXES.USER}${recipient.userId}`).emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
  }
  if (recipient.storeStaffId) {
    socketIo
      .to(`${SOCKET_ROOM_PREFIXES.STORE_STAFF}${recipient.storeStaffId}`)
      .emit(SOCKET_EVENTS.NOTIFICATION_NEW, notification);
  }
}

export function formatInAppNotification(row: {
  id: string;
  eventType: string;
  title: string;
  body: string;
  metadata: unknown;
  readAt: Date | null;
  createdAt: Date;
}): InAppNotificationPayload {
  return {
    id: row.id,
    eventType: row.eventType,
    title: row.title,
    body: row.body,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString()
  };
}

export class PrismaInAppNotificationProvider implements NotificationProvider {
  async send(message: NotificationMessage) {
    const recipientUserId = message.recipientId || null;
    const recipientStoreStaffId = message.recipientStoreStaffId || null;
    if (!recipientUserId && !recipientStoreStaffId) {
      return;
    }

    const created = await prisma.inAppNotification.create({
      data: {
        recipientUserId,
        recipientStoreStaffId,
        eventType: message.eventType,
        title: message.title,
        body: message.body,
        metadata: message.metadata as Prisma.InputJsonValue | undefined
      }
    });

    emitInAppNotification(formatInAppNotification(created), {
      userId: recipientUserId,
      storeStaffId: recipientStoreStaffId
    });
  }
}
