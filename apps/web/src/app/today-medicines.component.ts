import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type DoseEvent } from './interfaces';

@Component({
  selector: 'app-today-medicines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    `
      .dose-feedback {
        margin-top: 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }
      .dose-feedback button.small {
        font-size: 0.8rem;
        padding: 0.3rem 0.55rem;
      }
    `
  ],
  template: `
    <div class="panel">
      <h2>Today&apos;s Medicines</h2>
      <label>
        Snooze minutes
        <input type="number" min="5" max="120" [(ngModel)]="snoozeMinutes" (ngModelChange)="snoozeMinutesChange.emit($event)" />
      </label>
      <div class="cards">
        @for (dose of doseEvents; track dose.id) {
          <article class="consult-card">
            <strong>{{ dose.prescriptionItem.medicineName }}</strong>
            <span>
              {{ dose.scheduledFor | date: 'shortTime' }} |
              {{ dose.prescriptionItem.dose || 'Dose as advised' }}
            </span>
            <small>Status: {{ dose.status }}</small>
            @if (doseFeedbackEnabled) {
              <div class="dose-feedback">
                <button
                  type="button"
                  class="secondary small"
                  [disabled]="disabled || !dose.consultationId"
                  (click)="doctorMessage.emit(dose)"
                >
                  Question or side effect
                </button>
                @if (!dose.consultationId) {
                  <small class="muted">Link unavailable for this reminder.</small>
                }
              </div>
            }
            @if (dose.status === 'PENDING') {
              <div class="actions">
                <button class="primary" [disabled]="disabled" (click)="taken.emit(dose.id)">Taken</button>
                <button class="secondary" [disabled]="disabled" (click)="skipped.emit(dose.id)">Skip</button>
                <button class="secondary" [disabled]="disabled" (click)="snoozed.emit(dose.id)">Snooze</button>
              </div>
            }
          </article>
        } @empty {
          <p class="muted">No medicine reminders for today.</p>
        }
      </div>
    </div>
  `
})
export class TodayMedicinesComponent {
  @Input() doseEvents: DoseEvent[] = [];
  @Input() disabled = false;
  @Input() snoozeMinutes = 30;
  /** When true, show a control to open the consultation chat with this dose in context (patient app). */
  @Input() doseFeedbackEnabled = false;

  @Output() taken = new EventEmitter<string>();
  @Output() skipped = new EventEmitter<string>();
  @Output() snoozed = new EventEmitter<string>();
  @Output() snoozeMinutesChange = new EventEmitter<number>();
  @Output() doctorMessage = new EventEmitter<DoseEvent>();
}
