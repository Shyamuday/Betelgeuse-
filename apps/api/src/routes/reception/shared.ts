import { Request } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../db.js';

export type ReceptionContext = {
  userId: string;
  role: Role;
  storeId: string | null;
};

export async function resolveReceptionContext(userId: string, role: Role): Promise<ReceptionContext> {
  if (role === Role.ADMIN) {
    return { userId, role, storeId: null };
  }

  const profile = await prisma.receptionistProfile.findUnique({
    where: { userId },
    select: { storeId: true }
  });

  return { userId, role, storeId: profile?.storeId ?? null };
}

export function requireStoreId(ctx: ReceptionContext, requestedStoreId?: string | null): string {
  if (ctx.role === Role.ADMIN) {
    if (!requestedStoreId) {
      throw new ReceptionScopeError('Store selection is required for admin users.');
    }
    return requestedStoreId;
  }

  if (!ctx.storeId) {
    throw new ReceptionScopeError('Receptionist is not assigned to a clinic store.');
  }

  return ctx.storeId;
}

export class ReceptionScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReceptionScopeError';
  }
}

export function consultationInclude() {
  return {
    patient: { select: { id: true, name: true, mobile: true, email: true, patientCode: true } },
    assignedDoctor: { select: { id: true, name: true } },
    disease: { select: { id: true, name: true, feeInPaise: true } },
    clinicStore: { select: { id: true, name: true, code: true } },
    payment: { select: { id: true, status: true, amountInPaise: true, providerPaymentId: true } }
  } as const;
}

export async function getReceptionStoreFromRequest(req: Request, ctx: ReceptionContext): Promise<string> {
  const requested = typeof req.query['storeId'] === 'string' ? req.query['storeId'] : undefined;
  return requireStoreId(ctx, requested);
}
