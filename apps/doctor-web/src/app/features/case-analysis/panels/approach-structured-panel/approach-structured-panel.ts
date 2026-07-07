import { Component, Input, OnChanges, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import type { ApproachStructuredPanelDef } from '@vitalis/homeopathy-approaches';
import { installApproachPanelAutoSave } from '../../approach-panel-autosave';

@Component({
  selector: 'app-approach-structured-panel',
  imports: [FormField],
  templateUrl: './approach-structured-panel.html',
  styleUrl: './approach-structured-panel.scss'
})
export class ApproachStructuredPanelComponent implements OnChanges {
  private readonly hydrating = signal(true);
  private readonly autoSave = installApproachPanelAutoSave(
    () => this.model(),
    (value) => this.autoSaveRequested.emit(value),
    () => this.hydrating()
  );

  @Input({ required: true }) config!: ApproachStructuredPanelDef;
  @Input() initial: Record<string, string> | null = null;
  @Input() saving = false;

  readonly saveRequested = output<Record<string, string>>();
  readonly autoSaveRequested = output<Record<string, string>>();

  readonly model = signal<Record<string, string>>({});
  readonly form = form(this.model);

  ngOnChanges() {
    this.hydrating.set(true);
    const next: Record<string, string> = {};
    for (const field of this.config.fields) {
      next[field.key] = this.initial?.[field.key]?.trim() || '';
    }
    this.model.set(next);
    this.autoSave.resetSnapshot(next);
    this.hydrating.set(false);
  }

  save() {
    this.autoSave.resetSnapshot(this.model());
    this.saveRequested.emit(this.model());
  }
}
