import { Component, Input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTE_PATHS } from '../../core/constants/app-routes.constants';
import type { ConsultationSummary } from '../../features/case-analysis/case-analysis-page.types';
import type { DoctorConsultation } from '../../core/types/consultation.types';
import { ConsultationNavigationService } from '../../core/services/consultation-navigation.service';

@Component({
  selector: 'app-consultation-context-header',
  imports: [RouterLink],
  templateUrl: './consultation-context-header.html',
  styleUrl: './consultation-context-header.scss',
})
export class ConsultationContextHeaderComponent {
  private readonly consultationNav = inject(ConsultationNavigationService);

  @Input({ required: true }) consultation!: ConsultationSummary | DoctorConsultation;
  @Input() consultationId = '';
  @Input() caseAnalysisId = '';
  @Input() methodOptionId = '';
  @Input() remedy = '';
  @Input() companionRemedy = '';
  @Input() advice = '';
  @Input() diagnosis = '';
  @Input() analysisLabel = '';
  @Input() showWorklistLink = true;
  @Input() activeView: 'case-analysis' | 'prescription' | 'none' = 'none';

  readonly worklistPath = ROUTE_PATHS.WORKLIST;
  readonly caseAnalysisPath = ROUTE_PATHS.CASE_ANALYSIS;

  readonly caseAnalysisLink = computed(() =>
    this.consultationNav.caseAnalysisCommands(this.consultationId, {
      caseAnalysisId: this.caseAnalysisId || null,
    }),
  );

  readonly caseAnalysisQueryParams = computed(() =>
    this.consultationNav.caseAnalysisQueryParams({
      caseAnalysisId: this.caseAnalysisId || null,
    }),
  );

  readonly prescriptionLink = computed(() =>
    this.consultationNav.prescriptionCommands(this.consultationId),
  );

  readonly prescriptionQueryParams = computed(() =>
    this.consultationNav.prescriptionQueryParams({
      caseAnalysisId: this.caseAnalysisId || null,
      methodOptionId: this.methodOptionId || null,
      remedy: this.remedy || null,
      companionRemedy: this.companionRemedy || null,
      advice: this.advice || null,
      diagnosis: this.diagnosis || null,
    }),
  );

  patientCode() {
    return this.consultation.patient?.patientCode || this.consultation.patient?.id || '';
  }
}
