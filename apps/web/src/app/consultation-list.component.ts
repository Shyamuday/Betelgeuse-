import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { type Consultation, type Role } from './interfaces';

@Component({
  selector: 'app-consultation-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="panel">
      <h2>Your consultations</h2>
      <div class="cards">
        @for (consultation of consultations; track consultation.id) {
          <article class="consult-card" [class.active]="activeId === consultation.id">
            <button type="button" class="link-card" (click)="selected.emit(consultation)">
              <strong>{{ consultation.disease.name }}</strong>
              <span>{{ consultation.patient.name }}</span>
              @if (userRole === 'PATIENT') {
                <small class="journey-hint">{{ patientJourneyLabel(consultation.status) }}</small>
              } @else {
                <small>{{ consultation.status }}</small>
              }
              <small>Plan: {{ consultation.billingPlanCode || consultation.payment?.billingPlanCode || 'ONE_TIME' }}</small>
              <small>Amount: {{ (consultation.payment?.amountInPaise || 0) / 100 | currency: 'INR' }}</small>
            </button>
            @if (userRole === 'PATIENT' && consultation.status === 'PAYMENT_PENDING') {
              <button
                type="button"
                class="primary"
                [disabled]="disabled || !paymentIdle"
                (click)="pay.emit(consultation); $event.stopPropagation()"
              >
                Pay now
              </button>
            }
            @if (userRole === 'PATIENT' && consultation.status === 'COMPLETED') {
              <p class="muted rebook">
                Need a new visit?
                <a routerLink="/patient/dashboard" fragment="book-consultation">Book another consultation</a>
              </p>
            }
            @if (consultation.prescription || consultation.prescriptions?.length) {
              <p class="success">Prescription on file — open this case to view details.</p>
            }
          </article>
        } @empty {
          @if (userRole === 'PATIENT') {
            <div class="empty-consultations patient-empty">
              <p><strong>No consultations yet.</strong></p>
              <p class="muted">
                When you’re ready, use <strong>Book consultation</strong> below, or complete a self-assessment worksheet first —
                saved worksheet notes can be added automatically when you book.
              </p>
              <p class="muted">
                <a routerLink="/patient/dashboard" fragment="book-consultation">Go to booking</a>
                ·
                <a routerLink="/patient/self-diagnosis">Open worksheets</a>
              </p>
            </div>
          } @else {
            <p class="muted">No consultations yet.</p>
          }
        }
      </div>
    </div>
  `,
  styles: [
    `
      .journey-hint {
        display: block;
        color: #334155;
        font-weight: 600;
      }
      .rebook {
        margin: 0.35rem 0 0;
      }
      .patient-empty {
        padding: 0.25rem 0;
      }
    `
  ]
})
export class ConsultationListComponent {
  @Input() consultations: Consultation[] = [];
  @Input() activeId: string | null = null;
  @Input() userRole: Role | null = null;
  @Input() disabled = false;
  @Input() paymentIdle = true;

  @Output() selected = new EventEmitter<Consultation>();
  @Output() pay = new EventEmitter<Consultation>();

  patientJourneyLabel(status: Consultation['status']): string {
    switch (status) {
      case 'PAYMENT_PENDING':
        return 'Next step: complete payment to confirm your consultation.';
      case 'PAID':
        return 'Paid — we will assign a doctor. You’ll use chat here once assigned.';
      case 'ASSIGNED':
        return 'Doctor assigned — open this case to message them.';
      case 'IN_PROGRESS':
        return 'In progress — keep messaging your doctor in this consultation.';
      case 'PRESCRIPTION_UPLOADED':
        return 'Prescription shared — review medicines and today’s doses below.';
      case 'COMPLETED':
        return 'Completed — you can book a new consultation anytime.';
      case 'CANCELLED':
        return 'This consultation was cancelled.';
      default:
        return status;
    }
  }
}
