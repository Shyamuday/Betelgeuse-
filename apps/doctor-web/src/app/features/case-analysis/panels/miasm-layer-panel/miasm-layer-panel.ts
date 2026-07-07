import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { MiasmaticApproachData } from '@vitalis/homeopathy-approaches';

const MIASM_OPTIONS = ['Psora', 'Sycosis', 'Syphilis', 'Mixed / layered', 'Undetermined'] as const;

function emptyMiasm(): MiasmaticApproachData {
  return {
    presentingLayer: '',
    dominantMiasm: '',
    psoraSigns: '',
    sycosisSigns: '',
    syphilisSigns: '',
    familyMiasm: ''
  };
}

@Component({
  selector: 'app-miasm-layer-panel',
  imports: [FormField],
  templateUrl: './miasm-layer-panel.html',
  styleUrl: './miasm-layer-panel.scss'
})
export class MiasmLayerPanelComponent implements OnChanges {
  readonly miasmOptions = MIASM_OPTIONS;

  @Input() initial: MiasmaticApproachData | null = null;
  @Input() saving = false;

  readonly saveRequested = output<MiasmaticApproachData>();

  readonly model = signal(emptyMiasm());
  readonly form = form(this.model);

  ngOnChanges() {
    this.model.set({ ...emptyMiasm(), ...(this.initial || {}) });
  }

  save() {
    this.saveRequested.emit(this.model());
  }
}
