import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { ScholtenApproachData } from '@vitalis/homeopathy-approaches';

const SCHOLTEN_SERIES = [
  'Hydrogen',
  'Carbon',
  'Silicium',
  'Ferrum',
  'Silver series',
  'Gold series',
  'Lanthanides',
  'Uranium',
  'Unclear / mixed'
] as const;

const STAGES = Array.from({ length: 18 }, (_, index) => String(index + 1));

function emptyScholten(): ScholtenApproachData {
  return {
    thematicPattern: '',
    series: '',
    stage: '',
    mineralShortlist: '',
    confirmationNotes: ''
  };
}

@Component({
  selector: 'app-scholten-mapper-panel',
  imports: [FormField],
  templateUrl: './scholten-mapper-panel.html',
  styleUrl: './scholten-mapper-panel.scss'
})
export class ScholtenMapperPanelComponent implements OnChanges {
  readonly seriesOptions = SCHOLTEN_SERIES;
  readonly stageOptions = STAGES;

  @Input() initial: ScholtenApproachData | null = null;
  @Input() saving = false;

  readonly saveRequested = output<ScholtenApproachData>();

  readonly model = signal(emptyScholten());
  readonly form = form(this.model);

  ngOnChanges() {
    this.model.set({ ...emptyScholten(), ...(this.initial || {}) });
  }

  save() {
    this.saveRequested.emit(this.model());
  }
}
