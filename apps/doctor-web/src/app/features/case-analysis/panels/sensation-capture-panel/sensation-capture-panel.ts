import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { SensationApproachData } from '@vitalis/homeopathy-approaches';

const KINGDOMS = ['Plant', 'Mineral', 'Animal', 'Nosode', 'Impossible to classify yet'] as const;

function emptySensation(): SensationApproachData {
  return {
    patientLanguage: '',
    coreSensation: '',
    kingdom: '',
    remedyFamily: '',
    levelOfExperience: ''
  };
}

@Component({
  selector: 'app-sensation-capture-panel',
  imports: [FormField],
  templateUrl: './sensation-capture-panel.html',
  styleUrl: './sensation-capture-panel.scss'
})
export class SensationCapturePanelComponent implements OnChanges {
  readonly kingdoms = KINGDOMS;

  @Input() initial: SensationApproachData | null = null;
  @Input() saving = false;

  readonly saveRequested = output<SensationApproachData>();

  readonly model = signal(emptySensation());
  readonly form = form(this.model);

  ngOnChanges() {
    this.model.set({ ...emptySensation(), ...(this.initial || {}) });
  }

  save() {
    this.saveRequested.emit(this.model());
  }
}
