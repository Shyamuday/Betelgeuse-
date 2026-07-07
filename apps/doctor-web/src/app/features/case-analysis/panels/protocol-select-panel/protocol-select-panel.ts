import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { findProtocolById, protocolsForDisease, type BanerjiProtocol } from '@vitalis/homeopathy-approaches';
import type { ProtocolApproachData } from '@vitalis/homeopathy-approaches';

function emptyProtocol(): ProtocolApproachData {
  return {
    protocolId: '',
    protocolName: '',
    personalizationNotes: '',
    primaryRemedy: '',
    companionRemedy: ''
  };
}

@Component({
  selector: 'app-protocol-select-panel',
  imports: [FormField],
  templateUrl: './protocol-select-panel.html',
  styleUrl: './protocol-select-panel.scss'
})
export class ProtocolSelectPanelComponent implements OnChanges {
  @Input() diseaseName = '';
  @Input() initial: ProtocolApproachData | null = null;
  @Input() saving = false;

  readonly saveRequested = output<ProtocolApproachData>();
  readonly useInPrescription = output<ProtocolApproachData>();

  readonly protocols = signal<BanerjiProtocol[]>([]);
  readonly model = signal(emptyProtocol());
  readonly form = form(this.model);

  ngOnChanges() {
    this.protocols.set(protocolsForDisease(this.diseaseName));
    this.model.set({ ...emptyProtocol(), ...(this.initial || {}) });
  }

  selectProtocol(protocolId: string) {
    const protocol = findProtocolById(protocolId);
    if (!protocol) return;
    this.model.set({
      ...emptyProtocol(),
      ...(this.initial || {}),
      protocolId: protocol.id,
      protocolName: protocol.name,
      primaryRemedy: protocol.primaryRemedy,
      companionRemedy: protocol.companionRemedy || '',
      personalizationNotes: this.model().personalizationNotes || protocol.notes
    });
  }

  save() {
    this.saveRequested.emit(this.model());
  }

  prescribeFromProtocol() {
    this.useInPrescription.emit(this.model());
  }
}
