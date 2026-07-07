import { Component, Input, output } from '@angular/core';
import type { ApproachDefinition } from '@vitalis/homeopathy-approaches';

@Component({
  selector: 'app-approach-overview-panel',
  templateUrl: './approach-overview-panel.html',
  styleUrl: './approach-overview-panel.scss'
})
export class ApproachOverviewPanelComponent {
  @Input({ required: true }) methods: Array<{ id: string; label: string }> = [];
  @Input({ required: true }) selectedMethodOptionId = '';
  @Input() approach: ApproachDefinition | null = null;
  @Input() saving = false;

  readonly approachChanged = output<string>();

  onSelect(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.approachChanged.emit(value);
  }
}
