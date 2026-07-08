import { Component, Input, output } from '@angular/core';
import type { RemedySuggestionPreview } from '../../case-analysis-page.types';

@Component({
  selector: 'app-approach-remedy-suggestion-panel',
  templateUrl: './approach-remedy-suggestion-panel.html',
  styleUrl: './approach-remedy-suggestion-panel.scss'
})
export class ApproachRemedySuggestionPanelComponent {
  @Input({ required: true }) preview!: RemedySuggestionPreview;
  @Input() applying = false;

  readonly applyRequested = output<void>();
  readonly dismissRequested = output<void>();
}
