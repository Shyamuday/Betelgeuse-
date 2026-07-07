import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { KeynoteApproachData } from '@vitalis/homeopathy-approaches';

function emptyKeynote(): KeynoteApproachData {
  return {
    strikingSymptoms: '',
    peculiarRareSymptoms: '',
    totalityCrossCheck: '',
    differentialShortlist: ''
  };
}

@Component({
  selector: 'app-keynote-striking-panel',
  imports: [FormField],
  templateUrl: './keynote-striking-panel.html',
  styleUrl: './keynote-striking-panel.scss'
})
export class KeynoteStrikingPanelComponent implements OnChanges {
  @Input() initial: KeynoteApproachData | null = null;
  @Input() saving = false;

  readonly saveRequested = output<KeynoteApproachData>();

  readonly model = signal(emptyKeynote());
  readonly form = form(this.model);

  ngOnChanges() {
    this.model.set({ ...emptyKeynote(), ...(this.initial || {}) });
  }

  save() {
    this.saveRequested.emit(this.model());
  }
}
