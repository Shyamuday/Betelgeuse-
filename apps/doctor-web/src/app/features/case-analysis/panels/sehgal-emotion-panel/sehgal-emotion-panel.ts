import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { SehgalApproachData } from '@vitalis/homeopathy-approaches';

function emptySehgal(): SehgalApproachData {
  return {
    emotionalDisturbance: '',
    emotionalTrigger: '',
    mindBodyLinkage: '',
    emotionalCoreRemedy: ''
  };
}

@Component({
  selector: 'app-sehgal-emotion-panel',
  imports: [FormField],
  templateUrl: './sehgal-emotion-panel.html',
  styleUrl: './sehgal-emotion-panel.scss'
})
export class SehgalEmotionPanelComponent implements OnChanges {
  @Input() initial: SehgalApproachData | null = null;
  @Input() saving = false;

  readonly saveRequested = output<SehgalApproachData>();

  readonly model = signal(emptySehgal());
  readonly form = form(this.model);

  ngOnChanges() {
    this.model.set({ ...emptySehgal(), ...(this.initial || {}) });
  }

  save() {
    this.saveRequested.emit(this.model());
  }
}
