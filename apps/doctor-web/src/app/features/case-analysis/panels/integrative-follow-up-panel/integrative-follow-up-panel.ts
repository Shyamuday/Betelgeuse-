import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { IntegrativeFollowUpApproachData } from '@vitalis/homeopathy-approaches';

function emptyFollowUp(): IntegrativeFollowUpApproachData {
  return {
    baselineMetrics: '',
    subjectiveMarkers: '',
    objectiveReports: '',
    safetyRedFlags: '',
    referralEscalation: '',
    nextReviewPlan: ''
  };
}

@Component({
  selector: 'app-integrative-follow-up-panel',
  imports: [FormField],
  templateUrl: './integrative-follow-up-panel.html',
  styleUrl: './integrative-follow-up-panel.scss'
})
export class IntegrativeFollowUpPanelComponent implements OnChanges {
  @Input() initial: IntegrativeFollowUpApproachData | null = null;
  @Input() saving = false;

  readonly saveRequested = output<IntegrativeFollowUpApproachData>();

  readonly model = signal(emptyFollowUp());
  readonly form = form(this.model);

  ngOnChanges() {
    this.model.set({ ...emptyFollowUp(), ...(this.initial || {}) });
  }

  save() {
    this.saveRequested.emit(this.model());
  }
}
