import { Component, inject, input, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ConsultationNavigationService } from '../../../../core/services/consultation-navigation.service';
import { CaseAnalysisApiService } from '../../../case-analysis/case-analysis-api.service';
import type {
  CaseAnalysis,
  RubricSearchResult,
} from '../../../case-analysis/case-analysis-page.types';

@Component({
  selector: 'app-prescription-repertory-panel',
  imports: [FormField],
  templateUrl: './prescription-repertory-panel.html',
  styleUrl: './prescription-repertory-panel.scss',
})
export class PrescriptionRepertoryPanelComponent {
  private readonly api = inject(CaseAnalysisApiService);
  private readonly consultationNav = inject(ConsultationNavigationService);

  readonly consultationId = input('');
  readonly caseAnalysisId = input('');
  readonly rubricCount = input(0);

  readonly rubricAdded = output<void>();

  readonly searchModel = signal({ query: '' });
  readonly searchForm = form(this.searchModel);
  readonly searching = signal(false);
  readonly results = signal<RubricSearchResult[]>([]);
  readonly message = signal('');
  readonly error = signal('');

  async searchRubrics() {
    const query = this.searchModel().query.trim();
    if (query.length < 2) return;
    this.searching.set(true);
    this.error.set('');
    try {
      this.results.set(await this.api.searchRubrics(query));
    } catch {
      this.error.set('Rubric search failed.');
      this.results.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  async addRubric(rubric: RubricSearchResult) {
    const consultationId = this.consultationId();
    const analysisId = this.caseAnalysisId();
    if (!consultationId || !analysisId) {
      this.error.set('Load case analysis first before adding rubrics.');
      return;
    }
    this.error.set('');
    this.message.set('');
    try {
      const response = await this.api.loadConsultationAnalyses(consultationId);
      const analysis = response.analyses.find((item: CaseAnalysis) => item.id === analysisId);
      const existing = (analysis?.rubrics || []).map((item) => ({
        rubricId: item.rubricId,
        weight: item.weight,
      }));
      if (existing.some((item) => item.rubricId === rubric.id)) {
        this.message.set(`"${rubric.text}" is already in this case.`);
        return;
      }
      const updated = await this.api.updateAnalysis(analysisId, {
        rubrics: [...existing, { rubricId: rubric.id, weight: 2 }],
      });
      this.message.set(`Added "${rubric.text}" (${updated.rubrics.length} rubrics in case).`);
      this.rubricAdded.emit();
    } catch {
      this.error.set('Could not add rubric to case.');
    }
  }

  openFullRepertory() {
    void this.consultationNav.openRepertoryBrowser(this.consultationId(), this.caseAnalysisId());
  }

  openCaseAnalysisForRepertorize() {
    void this.consultationNav.openCaseAnalysis(this.consultationId(), {
      caseAnalysisId: this.caseAnalysisId() || null,
    });
  }
}
