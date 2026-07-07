import { WalletLedgerDirection, type RewardProgramRule } from '@prisma/client';
import { prisma } from '../db.js';

export async function getOrCreateWallet(patientId: string) {
  return prisma.patientWallet.upsert({
    where: { patientId },
    create: { patientId, balanceInPaise: 0 },
    update: {}
  });
}

export async function getWalletBalance(patientId: string) {
  const wallet = await getOrCreateWallet(patientId);
  return wallet.balanceInPaise;
}

export async function creditWallet(input: {
  patientId: string;
  amountInPaise: number;
  sourceType: string;
  sourceId?: string;
  ruleId?: string;
  note?: string;
}) {
  if (input.amountInPaise <= 0) {
    throw new Error('Credit amount must be positive.');
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.patientWallet.upsert({
      where: { patientId: input.patientId },
      create: { patientId: input.patientId, balanceInPaise: 0 },
      update: {}
    });
    const balanceAfter = wallet.balanceInPaise + input.amountInPaise;
    await tx.patientWallet.update({
      where: { patientId: input.patientId },
      data: { balanceInPaise: balanceAfter }
    });
    const entry = await tx.walletLedgerEntry.create({
      data: {
        patientId: input.patientId,
        direction: WalletLedgerDirection.CREDIT,
        amountInPaise: input.amountInPaise,
        balanceAfter,
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        ruleId: input.ruleId ?? null,
        note: input.note ?? null
      }
    });
    return { balanceAfter, entry };
  });
}

export async function debitWallet(input: {
  patientId: string;
  amountInPaise: number;
  sourceType: string;
  sourceId?: string;
  note?: string;
}) {
  if (input.amountInPaise <= 0) {
    throw new Error('Debit amount must be positive.');
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await tx.patientWallet.upsert({
      where: { patientId: input.patientId },
      create: { patientId: input.patientId, balanceInPaise: 0 },
      update: {}
    });
    if (wallet.balanceInPaise < input.amountInPaise) {
      throw new Error('INSUFFICIENT_WALLET_BALANCE');
    }
    const balanceAfter = wallet.balanceInPaise - input.amountInPaise;
    await tx.patientWallet.update({
      where: { patientId: input.patientId },
      data: { balanceInPaise: balanceAfter }
    });
    const entry = await tx.walletLedgerEntry.create({
      data: {
        patientId: input.patientId,
        direction: WalletLedgerDirection.DEBIT,
        amountInPaise: input.amountInPaise,
        balanceAfter,
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        note: input.note ?? null
      }
    });
    return { balanceAfter, entry };
  });
}

export async function listWalletLedger(patientId: string, take = 50) {
  return prisma.walletLedgerEntry.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    take,
    include: { rule: { select: { code: true, name: true } } }
  });
}

export type WalletPolicy = {
  maxRedeemPercentOfOrder: number;
  minPayableInPaise: number;
};

const DEFAULT_WALLET_POLICY: WalletPolicy = {
  maxRedeemPercentOfOrder: 50,
  minPayableInPaise: 100
};

export function resolveWalletRedeemCap(grossInPaise: number, balanceInPaise: number, policy = DEFAULT_WALLET_POLICY) {
  const percentCap = Math.floor((grossInPaise * policy.maxRedeemPercentOfOrder) / 100);
  const maxBeforeMinPayable = Math.max(0, grossInPaise - policy.minPayableInPaise);
  return Math.min(balanceInPaise, percentCap, maxBeforeMinPayable);
}

export function walletPolicyFromRule(rule: RewardProgramRule | null): WalletPolicy {
  if (!rule?.conditions || typeof rule.conditions !== 'object') return DEFAULT_WALLET_POLICY;
  const c = rule.conditions as Record<string, unknown>;
  return {
    maxRedeemPercentOfOrder:
      typeof c.maxRedeemPercentOfOrder === 'number' ? c.maxRedeemPercentOfOrder : DEFAULT_WALLET_POLICY.maxRedeemPercentOfOrder,
    minPayableInPaise:
      typeof c.minPayableInPaise === 'number' ? c.minPayableInPaise : rule.minPayableInPaise ?? DEFAULT_WALLET_POLICY.minPayableInPaise
  };
}
