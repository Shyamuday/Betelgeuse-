import {
  WebsiteLeadFollowUp,
  WebsiteLeadSource,
  type ChatSession,
  type Prisma
} from '@prisma/client';
import { prisma } from '../db.js';
import { normalizeMobile } from './patient-identity.js';

export const FOLLOW_UP_STATUSES = [
  'NEW',
  'NEEDS_CALLBACK',
  'CALLED',
  'NO_ANSWER',
  'WHATSAPP_SENT',
  'REGISTERED',
  'BOOKED',
  'NOT_INTERESTED',
  'CLOSED'
] as const satisfies readonly WebsiteLeadFollowUp[];

type LeadCaptureInput = {
  source: WebsiteLeadSource;
  visitorPhone?: string | null;
  visitorName?: string | null;
  visitorEmail?: string | null;
  concern?: string | null;
  entryPage?: string | null;
  visitorKey?: string | null;
  chatSessionId?: string | null;
  userId?: string | null;
};

function phoneForLead(phone?: string | null) {
  return normalizeMobile(phone ?? '') ?? null;
}

async function findExistingLead(input: LeadCaptureInput) {
  if (input.chatSessionId) {
    const byChat = await prisma.websiteLead.findUnique({ where: { chatSessionId: input.chatSessionId } });
    if (byChat) return byChat;
  }

  const phone = phoneForLead(input.visitorPhone);
  if (phone) {
    const byPhone = await prisma.websiteLead.findFirst({
      where: {
        visitorPhone: phone,
        followUpStatus: { notIn: ['CLOSED', 'NOT_INTERESTED'] }
      },
      orderBy: { createdAt: 'desc' }
    });
    if (byPhone) return byPhone;
  }

  if (input.visitorKey) {
    const byKey = await prisma.websiteLead.findFirst({
      where: {
        visitorKey: input.visitorKey,
        followUpStatus: { notIn: ['CLOSED', 'NOT_INTERESTED'] }
      },
      orderBy: { createdAt: 'desc' }
    });
    if (byKey) return byKey;
  }

  return null;
}

export async function upsertWebsiteLead(input: LeadCaptureInput) {
  const phone = phoneForLead(input.visitorPhone);
  const existing = await findExistingLead(input);

  const data: Prisma.WebsiteLeadUpdateInput = {
    visitorName: input.visitorName ?? undefined,
    visitorPhone: phone ?? input.visitorPhone ?? undefined,
    visitorEmail: input.visitorEmail ?? undefined,
    concern: input.concern ?? undefined,
    entryPage: input.entryPage ?? undefined,
    visitorKey: input.visitorKey ?? undefined,
    user: input.userId ? { connect: { id: input.userId } } : undefined
  };

  if (input.chatSessionId) {
    data.chatSession = { connect: { id: input.chatSessionId } };
  }

  if (input.userId) {
    data.followUpStatus = 'REGISTERED';
    data.registeredAt = new Date();
  }

  if (existing) {
    return prisma.websiteLead.update({
      where: { id: existing.id },
      data
    });
  }

  return prisma.websiteLead.create({
    data: {
      source: input.source,
      visitorName: input.visitorName ?? null,
      visitorPhone: phone ?? input.visitorPhone ?? null,
      visitorEmail: input.visitorEmail ?? null,
      concern: input.concern ?? null,
      entryPage: input.entryPage ?? null,
      visitorKey: input.visitorKey ?? null,
      chatSessionId: input.chatSessionId ?? null,
      userId: input.userId ?? null,
      registeredAt: input.userId ? new Date() : null,
      followUpStatus: input.userId ? 'REGISTERED' : 'NEW'
    }
  });
}

export async function syncLeadFromChatSession(session: Pick<
  ChatSession,
  'id' | 'visitorName' | 'visitorPhone' | 'visitorEmail' | 'concern' | 'entryPage' | 'visitorKey' | 'userId' | 'status'
>) {
  const followUpStatus: WebsiteLeadFollowUp =
    session.userId ? 'REGISTERED'
    : session.status === 'NEEDS_OPERATOR' ? 'NEEDS_CALLBACK'
    : 'NEW';

  const existing = await prisma.websiteLead.findUnique({ where: { chatSessionId: session.id } });
  if (existing) {
    return prisma.websiteLead.update({
      where: { id: existing.id },
      data: {
        visitorName: session.visitorName,
        visitorPhone: session.visitorPhone,
        visitorEmail: session.visitorEmail,
        concern: session.concern,
        entryPage: session.entryPage,
        visitorKey: session.visitorKey,
        userId: session.userId,
        registeredAt: session.userId && !existing.registeredAt ? new Date() : existing.registeredAt,
        followUpStatus:
          session.userId ? 'REGISTERED'
          : existing.followUpStatus === 'REGISTERED' ? 'REGISTERED'
          : session.status === 'NEEDS_OPERATOR' && existing.followUpStatus === 'NEW' ? 'NEEDS_CALLBACK'
          : existing.followUpStatus
      }
    });
  }

  return prisma.websiteLead.create({
    data: {
      source: 'CHAT_BOT',
      chatSessionId: session.id,
      visitorName: session.visitorName,
      visitorPhone: session.visitorPhone,
      visitorEmail: session.visitorEmail,
      concern: session.concern,
      entryPage: session.entryPage,
      visitorKey: session.visitorKey,
      userId: session.userId,
      registeredAt: session.userId ? new Date() : null,
      followUpStatus
    }
  });
}

export async function captureLeadFromOtpIntent(input: {
  mobile: string;
  source: 'HOME_BOOKING' | 'PROMO_POPUP';
  visitorName?: string;
  visitorKey?: string;
  entryPage?: string;
}) {
  return upsertWebsiteLead({
    source: input.source,
    visitorPhone: input.mobile,
    visitorName: input.visitorName,
    visitorKey: input.visitorKey,
    entryPage: input.entryPage
  });
}

export async function markLeadsRegistered(mobile: string, userId: string) {
  const phone = phoneForLead(mobile);
  if (!phone) return;

  await prisma.websiteLead.updateMany({
    where: {
      visitorPhone: phone,
      followUpStatus: { notIn: ['CLOSED', 'NOT_INTERESTED', 'BOOKED'] }
    },
    data: {
      userId,
      followUpStatus: 'REGISTERED',
      registeredAt: new Date()
    }
  });
}

export async function updateLeadFollowUp(input: {
  leadId: string;
  followUpStatus: WebsiteLeadFollowUp;
  operatorId: string;
  operatorNote?: string;
  markCalled?: boolean;
}) {
  const data: Prisma.WebsiteLeadUpdateInput = {
    followUpStatus: input.followUpStatus,
    operatorNote: input.operatorNote ?? undefined
  };

  if (input.markCalled || input.followUpStatus === 'CALLED') {
    data.calledAt = new Date();
    data.calledBy = { connect: { id: input.operatorId } };
  }

  return prisma.websiteLead.update({
    where: { id: input.leadId },
    data,
    include: {
      user: { select: { id: true, name: true, mobile: true, email: true } },
      calledBy: { select: { id: true, name: true } },
      chatSession: {
        select: {
          id: true,
          status: true,
          concern: true,
          messages: { orderBy: { createdAt: 'asc' } }
        }
      }
    }
  });
}

export const leadInclude = {
  user: { select: { id: true, name: true, mobile: true, email: true } },
  calledBy: { select: { id: true, name: true } },
  chatSession: {
    select: {
      id: true,
      status: true,
      concern: true,
      operatorNote: true,
      resolvedAt: true,
      _count: { select: { messages: true } }
    }
  }
} satisfies Prisma.WebsiteLeadInclude;
