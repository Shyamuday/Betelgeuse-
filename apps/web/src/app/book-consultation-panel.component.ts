import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, type OnChanges, Output, type SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type BillingPlan, type ClinicLocation, type Disease, type ConsultationChannel, CONSULTATION_CHANNEL_LABELS } from './interfaces';
import {
  SELF_ASSESSMENT_WORKSHEET_INTAKE_KEY,
  type WorksheetBookingDraft,
  clearWorksheetBookingDraft
} from './patient/patient-worksheet-booking-bridge';

export type BookConsultationPayload = {
  diseaseId: string;
  intakeAnswers: Record<string, string>;
  purchaseType: 'ONE_TIME' | 'PLAN';
  planCode?: string;
  channel: ConsultationChannel;
  locationId: string | null;
};

@Component({
  selector: 'app-book-consultation-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="panel" id="book-consultation">
      <h2>Book consultation</h2>

      @if (worksheetBookingDraft) {
        <div class="worksheet-prefill">
          <p class="muted">
            Notes from your saved worksheet <strong>{{ worksheetBookingDraft.toolLabel }}</strong> are included below. Edit
            them before you book — they are sent with your intake.
          </p>
          <label>
            Worksheet notes (optional)
            <textarea
              [(ngModel)]="worksheetNotesText"
              rows="6"
              placeholder="Summarize what you want the doctor to see from your worksheet"
            ></textarea>
          </label>
          <button type="button" class="secondary" (click)="dismissWorksheetDraft()">Clear worksheet notes</button>
        </div>
      }

      <label>
        Purchase type
        <select [(ngModel)]="purchaseType">
          <option value="ONE_TIME">One-time appointment</option>
          <option value="PLAN">Plan purchase</option>
        </select>
      </label>

      <label>
        Consultation type
        <select [(ngModel)]="channel">
          <option value="ONLINE_CHAT">{{ channelLabels.ONLINE_CHAT }}</option>
          <option value="VIDEO">{{ channelLabels.VIDEO }}</option>
          <option value="PHONE">{{ channelLabels.PHONE }}</option>
          <option value="IN_CLINIC">{{ channelLabels.IN_CLINIC }}</option>
        </select>
      </label>

      @if (channel === 'IN_CLINIC') {
        <label>
          Clinic location <span class="req">*</span>
          <select [(ngModel)]="selectedLocationId" [disabled]="!locations.length">
            <option value="">— Select a centre —</option>
            @for (loc of locations; track loc.id) {
              <option [value]="loc.id">{{ locationOptionLabel(loc) }}</option>
            }
          </select>
        </label>
        @if (!locations.length) {
          <p class="muted">No active clinic locations yet. Choose online consultation or contact support.</p>
        }
      } @else {
        <label>
          Preferred centre (optional)
          <select [(ngModel)]="selectedLocationId">
            <option value="">— No preference —</option>
            @for (loc of locations; track loc.id) {
              <option [value]="loc.id">{{ locationOptionLabel(loc) }}</option>
            }
          </select>
        </label>
        <p class="muted">We use this for records and follow-up; your visit stays {{ channelLabels[channel] }}.</p>
      }

      @if (purchaseType === 'PLAN') {
        <label>
          Select plan
          <select [(ngModel)]="selectedPlanCode">
            @for (plan of plans; track plan.code) {
              @if (plan.code !== 'ONE_TIME') {
                <option [value]="plan.code">
                  {{ plan.name }} — {{ plan.priceInPaise / 100 | currency: 'INR' }}
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
              {{ disease.name }} — {{ disease.feeInPaise / 100 | currency: 'INR' }}
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

      <button
        class="primary"
        [disabled]="disabled || !selectedDiseaseId || !canSubmitChannelLocation()"
        (click)="submit()">
        Create consultation
      </button>
      <p class="muted">
        Payable now:
        <strong>{{ estimatedAmount() / 100 | currency: 'INR' }}</strong>.
        After payment, consultation moves to doctor assignment.
      </p>
    </div>
  `,
  styles: [
    `
      .req {
        color: #b91c1c;
        font-weight: 700;
      }
    `
  ]
})
export class BookConsultationPanelComponent implements OnChanges {
  readonly channelLabels = CONSULTATION_CHANNEL_LABELS;

  @Input() diseases: Disease[] = [];
  @Input() plans: BillingPlan[] = [];
  @Input() locations: ClinicLocation[] = [];
  @Input() disabled = false;
  /** When set, patient can edit and submit these notes as part of intake. */
  @Input() worksheetBookingDraft: WorksheetBookingDraft | null = null;
  @Output() booked = new EventEmitter<BookConsultationPayload>();
  @Output() worksheetDraftDismissed = new EventEmitter<void>();

  purchaseType: 'ONE_TIME' | 'PLAN' = 'ONE_TIME';
  channel: ConsultationChannel = 'ONLINE_CHAT';
  selectedLocationId = '';
  selectedPlanCode = '';
  selectedDiseaseId = '';
  intakeAnswers: Record<string, string> = {};
  worksheetNotesText = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['worksheetBookingDraft']) {
      if (this.worksheetBookingDraft) {
        this.worksheetNotesText = this.worksheetBookingDraft.summaryText;
      } else {
        this.worksheetNotesText = '';
      }
    }
    if (!this.selectedDiseaseId && this.diseases.length) {
      this.selectedDiseaseId = this.diseases[0].id;
    }
    if (!this.selectedPlanCode) {
      this.selectedPlanCode = this.plans.find((p) => p.code !== 'ONE_TIME')?.code || '';
    }
  }

  locationOptionLabel(loc: ClinicLocation): string {
    const city = loc.city?.trim();
    return city ? `${loc.name} — ${city}` : loc.name;
  }

  canSubmitChannelLocation(): boolean {
    if (this.channel === 'IN_CLINIC') {
      return Boolean(this.selectedLocationId.trim()) && this.locations.length > 0;
    }
    return true;
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
    if (this.purchaseType === 'PLAN') {
      return this.plans.find((p) => p.code === this.selectedPlanCode)?.priceInPaise || 0;
    }
    return this.selectedDisease()?.feeInPaise || 0;
  }

  resetAnswers() {
    this.intakeAnswers = {};
  }

  submit() {
    if (!this.selectedDiseaseId) return;
    const intakeAnswers = { ...this.intakeAnswers };
    const extra = this.worksheetNotesText.trim();
    if (extra) {
      intakeAnswers[SELF_ASSESSMENT_WORKSHEET_INTAKE_KEY] = extra;
    }
    this.booked.emit({
      diseaseId: this.selectedDiseaseId,
      intakeAnswers,
      purchaseType: this.purchaseType,
      channel: this.channel,
      locationId: this.selectedLocationId.trim() || null,
      ...(this.purchaseType === 'PLAN' ? { planCode: this.selectedPlanCode } : {})
    });
  }

  dismissWorksheetDraft() {
    this.worksheetNotesText = '';
    clearWorksheetBookingDraft();
    this.worksheetDraftDismissed.emit();
  }
}
