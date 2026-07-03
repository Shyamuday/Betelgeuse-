export const CONSULTATION_STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'rgba(251,146,60,0.12)', color: '#fb923c' },
  ACTIVE: { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
  COMPLETED: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  CANCELLED: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' }
};

export const CONSULTATION_PAYMENT_STYLES: Record<string, { bg: string; color: string }> = {
  CREATED: { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  PAID: { bg: 'rgba(74,222,128,0.1)', color: '#4ade80' },
  FAILED: { bg: 'rgba(248,113,113,0.1)', color: '#f87171' },
  REFUNDED: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
};

export const CONSULTATION_STATUS_FALLBACK_STYLE = {
  bg: 'rgba(255,255,255,0.06)',
  color: '#94a3b8'
} as const;
