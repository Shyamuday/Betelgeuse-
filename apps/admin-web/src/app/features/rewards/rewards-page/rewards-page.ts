import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';

type RewardRule = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  kind: string;
  trigger: string;
  beneficiary: string;
  valueType: string;
  valueAmount: number;
  appliesTo: string;
  promoCode?: string | null;
  maxUsesPerPatient?: number | null;
  maxUsesGlobal?: number | null;
  maxDiscountInPaise?: number | null;
  minOrderInPaise?: number | null;
  minPayableInPaise: number;
  isActive: boolean;
  priority: number;
};

const KINDS = ['REFERRAL', 'LOYALTY', 'PROMO', 'WELCOME', 'CUSTOM'];
const TRIGGERS = ['PATIENT_SIGNUP_WITH_REFERRAL', 'FIRST_CONSULTATION_PAID', 'CONSULTATION_PAID', 'MEDICINE_ORDER_PAID', 'MANUAL'];
const BENEFICIARIES = ['REFERRER', 'REFERRED_PATIENT', 'PAYING_PATIENT'];
const VALUE_TYPES = ['WALLET_CREDIT_FLAT', 'CHECKOUT_DISCOUNT_FLAT', 'CHECKOUT_DISCOUNT_PERCENT'];
const APPLIES_TO = ['CONSULTATION', 'MEDICINE_DELIVERY', 'ANY'];

function emptyRule() {
  return {
    code: '',
    name: '',
    description: '',
    kind: 'REFERRAL',
    trigger: 'FIRST_CONSULTATION_PAID',
    beneficiary: 'REFERRED_PATIENT',
    valueType: 'CHECKOUT_DISCOUNT_FLAT',
    valueAmount: 10000,
    appliesTo: 'CONSULTATION',
    promoCode: '',
    maxUsesPerPatient: 1 as number | '',
    maxUsesGlobal: '' as number | '',
    maxDiscountInPaise: '' as number | '',
    minOrderInPaise: '' as number | '',
    minPayableInPaise: 100,
    isActive: true,
    priority: 10
  };
}

function rupeesToPaise(v: number | '') {
  return v === '' ? null : Math.round(Number(v) * 100);
}

function paiseToRupees(p: number | null | undefined) {
  return p == null ? '' : (p / 100).toFixed(0);
}

@Component({
  selector: 'app-rewards-page',
  imports: [CommonModule, FormField],
  templateUrl: './rewards-page.html',
  styleUrl: './rewards-page.scss'
})
export class RewardsPage {
  readonly rules = signal<RewardRule[]>([]);
  readonly referrals = signal<unknown[]>([]);
  readonly loading = signal(false);
  readonly mutating = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly tab = signal<'rules' | 'referrals'>('rules');

  readonly kinds = KINDS;
  readonly triggers = TRIGGERS;
  readonly beneficiaries = BENEFICIARIES;
  readonly valueTypes = VALUE_TYPES;
  readonly appliesToOptions = APPLIES_TO;

  readonly createModel = signal(emptyRule());
  readonly createForm = form(this.createModel);
  editingId = signal<string | null>(null);
  readonly editModel = signal(emptyRule());
  readonly editForm = form(this.editModel);

  constructor(private readonly api: AdminApi) {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [rulesRes, refRes] = await Promise.all([this.api.listRewardRules(), this.api.listReferrals(30)]);
      this.rules.set(rulesRes.rules as RewardRule[]);
      this.referrals.set(refRes.referrals);
    } catch {
      this.error.set('Could not load rewards data.');
    } finally {
      this.loading.set(false);
    }
  }

  private payloadFromModel(m: ReturnType<typeof emptyRule>) {
    return {
      code: m.code,
      name: m.name,
      description: m.description || null,
      kind: m.kind,
      trigger: m.trigger,
      beneficiary: m.beneficiary,
      valueType: m.valueType,
      valueAmount:
        m.valueType === 'CHECKOUT_DISCOUNT_PERCENT' ? Math.round(Number(m.valueAmount)) : Number(m.valueAmount),
      appliesTo: m.appliesTo,
      promoCode: m.promoCode?.trim() || null,
      maxUsesPerPatient: m.maxUsesPerPatient === '' ? null : Number(m.maxUsesPerPatient),
      maxUsesGlobal: m.maxUsesGlobal === '' ? null : Number(m.maxUsesGlobal),
      maxDiscountInPaise: rupeesToPaise(m.maxDiscountInPaise),
      minOrderInPaise: rupeesToPaise(m.minOrderInPaise),
      minPayableInPaise: Number(m.minPayableInPaise) || 100,
      isActive: m.isActive,
      priority: Number(m.priority) || 0
    };
  }

  async createRule() {
    this.mutating.set(true);
    this.error.set('');
    try {
      await this.api.createRewardRule(this.payloadFromModel(this.createModel()));
      this.createModel.set(emptyRule());
      this.message.set('Rule created.');
      await this.load();
    } catch {
      this.error.set('Could not create rule.');
    } finally {
      this.mutating.set(false);
    }
  }

  startEdit(rule: RewardRule) {
    this.editingId.set(rule.id);
    this.editModel.set({
      code: rule.code,
      name: rule.name,
      description: rule.description || '',
      kind: rule.kind,
      trigger: rule.trigger,
      beneficiary: rule.beneficiary,
      valueType: rule.valueType,
      valueAmount: rule.valueAmount,
      appliesTo: rule.appliesTo,
      promoCode: rule.promoCode || '',
      maxUsesPerPatient: rule.maxUsesPerPatient ?? '',
      maxUsesGlobal: rule.maxUsesGlobal ?? '',
      maxDiscountInPaise: paiseToRupees(rule.maxDiscountInPaise) as number | '',
      minOrderInPaise: paiseToRupees(rule.minOrderInPaise) as number | '',
      minPayableInPaise: rule.minPayableInPaise,
      isActive: rule.isActive,
      priority: rule.priority
    });
  }

  cancelEdit() {
    this.editingId.set(null);
  }

  async saveEdit() {
    const id = this.editingId();
    if (!id) return;
    this.mutating.set(true);
    try {
      await this.api.updateRewardRule(id, this.payloadFromModel(this.editModel()));
      this.editingId.set(null);
      this.message.set('Rule updated.');
      await this.load();
    } catch {
      this.error.set('Could not update rule.');
    } finally {
      this.mutating.set(false);
    }
  }

  async deleteRule(id: string) {
    if (!confirm('Delete this reward rule?')) return;
    this.mutating.set(true);
    try {
      await this.api.deleteRewardRule(id);
      this.message.set('Rule deleted.');
      await this.load();
    } catch {
      this.error.set('Could not delete rule.');
    } finally {
      this.mutating.set(false);
    }
  }

  formatValue(rule: RewardRule) {
    if (rule.valueType === 'CHECKOUT_DISCOUNT_PERCENT') return `${(rule.valueAmount / 100).toFixed(1)}%`;
    return `₹${(rule.valueAmount / 100).toFixed(0)}`;
  }
}
