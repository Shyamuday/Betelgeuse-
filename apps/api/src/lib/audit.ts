import type { Prisma, Role } from '@prisma/client';
import { prisma } from '../db.js';

export async function writeAuditLog(input: {
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
