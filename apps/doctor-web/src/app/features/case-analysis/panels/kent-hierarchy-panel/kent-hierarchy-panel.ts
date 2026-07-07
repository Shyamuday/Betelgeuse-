import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { KentHierarchyData } from '@vitalis/homeopathy-approaches';

function emptyKent(): KentHierarchyData {
  return {
    mentalGenerals: '',
    physicalGenerals: '',
    particularSymptoms: '',
    strikingKeynotes: ''
  };
}

@Component({
  selector: 'app-kent-hierarchy-panel',
  imports: [FormField],
  templateUrl: './kent-hierarchy-panel.html',
  styleUrl: './kent-hierarchy-panel.scss'
})
export class KentHierarchyPanelComponent implements OnChanges {
  @Input() initial: KentHierarchyData | null = null;
  @Input() saving = false;

  readonly saveRequested = output<KentHierarchyData>();

  readonly model = signal(emptyKent());
  readonly form = form(this.model);

  ngOnChanges() {
    this.model.set({ ...emptyKent(), ...(this.initial || {}) });
  }

  save() {
    this.saveRequested.emit(this.model());
  }
}
