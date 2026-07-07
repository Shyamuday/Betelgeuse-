import { Component, Input, output } from '@angular/core';
import { isStepComplete, type StepCompletionContext } from '@vitalis/homeopathy-approaches';
import type { ApproachStep, ApproachStepId } from '@vitalis/homeopathy-approaches';

@Component({
  selector: 'app-approach-stepper',
  templateUrl: './approach-stepper.html',
  styleUrl: './approach-stepper.scss'
})
export class ApproachStepperComponent {
  @Input({ required: true }) steps: ApproachStep[] = [];
  @Input({ required: true }) activeStepId: ApproachStepId = 'approach-select';
  @Input({ required: true }) completion: StepCompletionContext = {};

  readonly stepSelected = output<ApproachStepId>();

  isDone(step: ApproachStep) {
    return isStepComplete(step, this.completion);
  }

  isActive(step: ApproachStep) {
    return step.id === this.activeStepId;
  }

  select(step: ApproachStep) {
    this.stepSelected.emit(step.id);
  }
}
