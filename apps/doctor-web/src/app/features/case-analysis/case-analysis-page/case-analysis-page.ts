import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ROUTE_PATHS } from '../../../core/constants/app-routes.constants';
import { CaseAnalysisApiService } from '../case-analysis-api.service';
import type { CaseAnalysis, ConsultationSummary, RubricSearchResult, SelectedRubric } from '../case-analysis-page.types';

@Component({
  selector: 'app-case-analysis-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './case-analysis-page.html',
  styleUrl: './case-analysis-page.scss'
})
export class CaseAnalysisPage {
  readonly appointmentsPath = ROUTE_PATHS.APPOINTMENTS;

  consultationId = '';
  consultation: ConsultationSummary | null = null;
  analysis: CaseAnalysis | null = null;
  selectedRubrics: SelectedRubric[] = [];
  notes = '';

  rubricQuery = '';
  searchResults: RubricSearchResult[] = [];

  loading = false;
  searching = false;
  saving = false;
  repertorizing = false;
  selectingRemedyId = '';
  error = '';
  message = '';

  constructor(
    private readonly api: CaseAnalysisApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.consultationId = this.route.snapshot.paramMap.get('consultationId') || '';
    if (this.consultationId) {
      void this.load();
    }
  }

  async load() {
    const id = this.consultationId.trim();
    if (!id) return;

    this.loading = true;
    this.error = '';
    this.message = '';
    try {
      const response = await this.api.loadConsultationAnalyses(id);
      this.consultation = response.consultation;
      this.analysis = response.analyses[0] || (await this.api.createAnalysis(id, {}));
      this.hydrateFromAnalysis(this.analysis);
    } catch {
      this.error = 'Could not load case analysis for this consultation.';
      this.consultation = null;
      this.analysis = null;
    } finally {
      this.loading = false;
    }
  }

  private hydrateFromAnalysis(analysis: CaseAnalysis) {
    this.notes = analysis.notes || '';
    this.selectedRubrics = analysis.rubrics.map((item) => ({
      rubricId: item.rubricId,
      weight: item.weight,
      rubric: item.rubric || undefined
    }));
  }

  async searchRubrics() {
    const q = this.rubricQuery.trim();
    if (q.length < 2) return;

    this.searching = true;
    this.error = '';
    try {
      this.searchResults = await this.api.searchRubrics(q, this.analysis?.source?.id);
    } catch {
      this.error = 'Rubric search failed.';
    } finally {
      this.searching = false;
    }
  }

  hasRubric(rubricId: string) {
    return this.selectedRubrics.some((item) => item.rubricId === rubricId);
  }

  addRubric(rubric: RubricSearchResult) {
    if (this.hasRubric(rubric.id)) return;
    this.selectedRubrics = [
      ...this.selectedRubrics,
      {
        rubricId: rubric.id,
        weight: 2,
        rubric: {
          id: rubric.id,
          chapter: rubric.chapter,
          subchapter: rubric.subchapter,
          text: rubric.text,
          parentPath: rubric.parentPath
        }
      }
    ];
  }

  removeRubric(rubricId: string) {
    this.selectedRubrics = this.selectedRubrics.filter((item) => item.rubricId !== rubricId);
  }

  private rubricPayload() {
    return this.selectedRubrics.map((item) => ({
      rubricId: item.rubricId,
      weight: item.weight
    }));
  }

  async saveRubrics() {
    if (!this.analysis) return;
    this.saving = true;
    this.error = '';
    this.message = '';
    try {
      this.analysis = await this.api.updateAnalysis(this.analysis.id, { rubrics: this.rubricPayload() });
      this.hydrateFromAnalysis(this.analysis);
      this.message = 'Rubrics saved.';
    } catch {
      this.error = 'Could not save rubrics.';
    } finally {
      this.saving = false;
    }
  }

  async saveNotes() {
    if (!this.analysis) return;
    this.saving = true;
    this.error = '';
    this.message = '';
    try {
      this.analysis = await this.api.updateAnalysis(this.analysis.id, { notes: this.notes });
      this.message = 'Notes saved.';
    } catch {
      this.error = 'Could not save notes.';
    } finally {
      this.saving = false;
    }
  }

  async runRepertorization() {
    if (!this.analysis) return;
    this.repertorizing = true;
    this.error = '';
    this.message = '';
    try {
      await this.saveRubrics();
      this.analysis = await this.api.repertorize(this.analysis.id);
      this.hydrateFromAnalysis(this.analysis);
      this.message = 'Repertorization complete.';
    } catch {
      this.error = 'Repertorization failed. Add rubrics and try again.';
    } finally {
      this.repertorizing = false;
    }
  }

  async chooseRemedy(remedy: { id: string; name: string; abbreviation: string }) {
    if (!this.analysis) return;
    this.selectingRemedyId = remedy.id;
    this.error = '';
    this.message = '';
    try {
      this.analysis = await this.api.selectRemedy(this.analysis.id, remedy.id);
      this.message = `${remedy.name} selected.`;
    } catch {
      this.error = 'Could not select remedy.';
    } finally {
      this.selectingRemedyId = '';
    }
  }

  openPrescriptionWithRemedy() {
    if (!this.analysis?.selectedRemedy || !this.consultationId) return;
    void this.router.navigate(['/', ROUTE_PATHS.APPOINTMENTS], {
      queryParams: {
        consultationId: this.consultationId,
        remedy: this.analysis.selectedRemedy.name
      }
    });
  }
}
