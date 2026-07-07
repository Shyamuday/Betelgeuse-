import { Component, Input, output } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { CaseSheetFieldDef } from '@vitalis/homeopathy-approaches';

@Component({
  selector: 'app-approach-case-sheet-panel',
  imports: [FormField],
  templateUrl: './approach-case-sheet-panel.html',
  styleUrl: './approach-case-sheet-panel.scss'
})
export class ApproachCaseSheetPanelComponent {
  @Input({ required: true }) fields: CaseSheetFieldDef[] = [];
  @Input({ required: true }) title = 'Case sheet';
  @Input() description = 'Document the case using the structure required by the selected approach.';
  @Input() saving = false;
  @Input({ required: true }) caseSheetForm!: object;

  readonly saveRequested = output<void>();
}
