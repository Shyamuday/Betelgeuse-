import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTE_PATHS } from '../../core/constants/app-routes.constants';
import type { ConsultationSummary } from '../../features/case-analysis/case-analysis-page.types';
import type { DoctorConsultation } from '../../core/types/consultation.types';

@Component({
  selector: 'app-consultation-context-header',
  imports: [RouterLink],
  templateUrl: './consultation-context-header.html',
  styleUrl: './consultation-context-header.scss'
})
export class ConsultationContextHeaderComponent {
  @Input({ required: true }) consultation!: ConsultationSummary | DoctorConsultation;
  @Input() consultationId = '';
  @Input() analysisLabel = '';
  @Input() showWorklistLink = true;
  @Input() activeView: 'case-analysis' | 'prescription' | 'none' = 'none';

  readonly worklistPath = ROUTE_PATHS.WORKLIST;
  readonly appointmentsPath = ROUTE_PATHS.APPOINTMENTS;
  readonly caseAnalysisPath = ROUTE_PATHS.CASE_ANALYSIS;

  patientCode() {
    return this.consultation.patient?.patientCode || this.consultation.patient?.id || '';
  }
}
