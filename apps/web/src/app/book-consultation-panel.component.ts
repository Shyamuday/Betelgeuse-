import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BILLING_PLAN_CODES, CURRENCY_CODE, PURCHASE_TYPES } from './core/constants/billing.constants';
import { BillingPlan, Disease } from './models';

export type BookConsultationPayload = {
  diseaseId: string;
  intakeAnswers: Record<string, string>;
  purchaseType: typeof PURCHASE_TYPES.ONE_TIME | typeof PURCHASE_TYPES.PLAN;
  planCode?: string;
};

@Component({
  selector: 'app-book-consultation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel">
      <h2>Book Consultation</h2>

      <label>
        Purchase type
        <select [(ngModel)]="purchaseType">
          <option [value]="PURCHASE_TYPES.ONE_TIME">One-time appointment</option>
          <option [value]="PURCHASE_TYPES.PLAN">Plan purchase</option>
        </select>
      </label>

      @if (purchaseType === PURCHASE_TYPES.PLAN) {
        <label>
          Select plan
          <select [(ngModel)]="selectedPlanCode">
            @for (plan of plans; track plan.code) {
              @if (plan.code !== BILLING_PLAN_CODES.ONE_TIME) {
                <option [value]="plan.code">
                  {{ plan.name }} — {{ plan.priceInPaise / 100 | currency: CURRENCY_CODE }}
                </option>
              }
            }
          </select>
        </label>
        @if (selectedPlanDescription()) {
          <p class="muted">{{ selectedPlanDescription() }}</p>
        }
      }

      <label>
        Select problem
        <select [(ngModel)]="selectedDiseaseId" (ngModelChange)="resetAnswers()">
          @for (disease of diseases; track disease.id) {
            <option [value]="disease.id">
              {{ disease.name }} — {{ disease.feeInPaise / 100 | currency: CURRENCY_CODE }}
            </option>
          }
        </select>
      </label>

      @for (question of intakeQuestions(); track question) {
        <label>
          {{ question }}
          <input [(ngModel)]="intakeAnswers[question]" placeholder="Type your answer" />
        </label>
      }

      <button class="primary" [disabled]="disabled || !selectedDiseaseId" (click)="submit()">
        Create consultation
      </button>
      <p class="muted">
        Payable now:
        <strong>{{ estimatedAmount() / 100 | currency: CURRENCY_CODE }}</strong>.
        After payment, consultation moves to doctor assignment.
      </p>
    </div>
  `
})
export class BookConsultationPanelComponent implements OnChanges {
  readonly PURCHASE_TYPES = PURCHASE_TYPES;
  readonly BILLING_PLAN_CODES = BILLING_PLAN_CODES;
  readonly CURRENCY_CODE = CURRENCY_CODE;
  @Input() diseases: Disease[] = [];
  @Input() plans: BillingPlan[] = [];
  @Input() disabled = false;
  @Output() booked = new EventEmitter<BookConsultationPayload>();

  purchaseType: typeof PURCHASE_TYPES.ONE_TIME | typeof PURCHASE_TYPES.PLAN = PURCHASE_TYPES.ONE_TIME;
  selectedPlanCode = '';
  selectedDiseaseId = '';
  intakeAnswers: Record<string, string> = {};

  ngOnChanges() {
    if (!this.selectedDiseaseId && this.diseases.length) {
      this.selectedDiseaseId = this.diseases[0].id;
    }
    if (!this.selectedPlanCode) {
      this.selectedPlanCode = this.plans.find((p) => p.code !== BILLING_PLAN_CODES.ONE_TIME)?.code || '';
    }
  }

  selectedDisease() {
    return this.diseases.find((d) => d.id === this.selectedDiseaseId) || null;
  }

  selectedPlanDescription() {
    return this.plans.find((p) => p.code === this.selectedPlanCode)?.description || null;
  }

  intakeQuestions() {
    return this.selectedDisease()?.intakeQuestions || [];
  }

  estimatedAmount() {
    if (this.purchaseType === PURCHASE_TYPES.PLAN) {
      return this.plans.find((p) => p.code === this.selectedPlanCode)?.priceInPaise || 0;
    }
    return this.selectedDisease()?.feeInPaise || 0;
  }

  resetAnswers() {
    this.intakeAnswers = {};
  }

  submit() {
    if (!this.selectedDiseaseId) return;
    this.booked.emit({
      diseaseId: this.selectedDiseaseId,
      intakeAnswers: { ...this.intakeAnswers },
      purchaseType: this.purchaseType,
      ...(this.purchaseType === PURCHASE_TYPES.PLAN ? { planCode: this.selectedPlanCode } : {})
    });
  }
}
