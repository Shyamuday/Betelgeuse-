import { DecimalPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ROUTE_PATHS } from '../../../core/constants/app-routes.constants';
import { CaseAnalysisApiService } from '../case-analysis-api.service';
import type {
  CaseAnalysis,
  ConsultationSummary,
  MateriaMedicaResponse,
  RepertoryRemedyRef,
  RepertorySource,
  RubricSearchResult,
  SelectedRubric
} from '../case-analysis-page.types';
import { formatRubricPath, rubricPathSegments } from '../rubric-path.util';

@Component({
  selector: 'app-case-analysis-page',
  imports: [FormsModule, RouterLink, DecimalPipe],
  templateUrl: './case-analysis-page.html',
  styleUrl: './case-analysis-page.scss'
})
export class CaseAnalysisPage {
  readonly appointmentsPath = ROUTE_PATHS.APPOINTMENTS;
  readonly worklistPath = ROUTE_PATHS.WORKLIST;
  readonly weightOptions = [1, 2, 3, 4] as const;

  consultationId = '';
  readonly consultation = signal<ConsultationSummary | null>(null);
  readonly analysis = signal<CaseAnalysis | null>(null);
  readonly sources = signal<RepertorySource[]>([]);
  selectedSourceId = '';
  readonly selectedRubrics = signal<SelectedRubric[]>([]);
  notes = '';

  rubricQuery = '';
  readonly searchResults = signal<RubricSearchResult[]>([]);
  readonly searchedOnce = signal(false);
  readonly maxResultScore = signal(0);

  readonly loading = signal(false);
  readonly searching = signal(false);
  readonly saving = signal(false);
  readonly repertorizing = signal(false);
  readonly selectingRemedyId = signal('');
  readonly focusedRemedy = signal<RepertoryRemedyRef | null>(null);
  readonly materiaMedica = signal<MateriaMedicaResponse | null>(null);
  readonly loadingMateriaMedica = signal(false);
  readonly materiaMedicaError = signal('');
  readonly error = signal('');
  readonly message = signal('');

  readonly formatRubricPath = formatRubricPath;
  readonly rubricPathSegments = rubricPathSegments;

  constructor(
    private readonly api: CaseAnalysisApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.consultationId = this.route.snapshot.paramMap.get('consultationId') || '';
    void this.loadSources();
    if (this.consultationId) {
      void this.load();
    }
  }

  async loadSources() {
    try {
      const nextSources = await this.api.loadSources();
      this.sources.set(nextSources);
      this.selectedSourceId = nextSources[0]?.id || '';
    } catch {
      this.sources.set([]);
    }
  }

  async load() {
    const id = this.consultationId.trim();
    if (!id) return;

    this.loading.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const response = await this.api.loadConsultationAnalyses(id);
      this.consultation.set(response.consultation);
      const nextAnalysis =
        response.analyses[0] ||
        (await this.api.createAnalysis(id, { sourceId: this.selectedSourceId || undefined }));
      this.analysis.set(nextAnalysis);
      this.selectedSourceId = nextAnalysis.source?.id || this.selectedSourceId;
      this.hydrateFromAnalysis(nextAnalysis);
    } catch {
      this.error.set('Could not load case analysis for this consultation.');
      this.consultation.set(null);
      this.analysis.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  private hydrateFromAnalysis(nextAnalysis: CaseAnalysis) {
    this.notes = nextAnalysis.notes || '';
    this.selectedRubrics.set(
      nextAnalysis.rubrics.map((item) => ({
        rubricId: item.rubricId,
        weight: item.weight,
        rubric: item.rubric || undefined
      }))
    );
    this.maxResultScore.set(nextAnalysis.results[0]?.totalScore || 0);
    if (nextAnalysis.selectedRemedy && this.focusedRemedy()?.id !== nextAnalysis.selectedRemedy.id) {
      void this.focusRemedy(nextAnalysis.selectedRemedy);
    }
  }

  async focusRemedy(remedy: RepertoryRemedyRef) {
    this.focusedRemedy.set(remedy);
    this.materiaMedica.set(null);
    this.materiaMedicaError.set('');
    this.loadingMateriaMedica.set(true);

    try {
      this.materiaMedica.set(
        await this.api.loadMateriaMedica(remedy.id, {
          analysisId: this.analysis()?.id,
          repertorySourceId: this.analysis()?.source?.id
        })
      );
    } catch {
      this.materiaMedicaError.set('Could not load materia medica for this remedy.');
    } finally {
      this.loadingMateriaMedica.set(false);
    }
  }

  clearFocusedRemedy() {
    this.focusedRemedy.set(null);
    this.materiaMedica.set(null);
    this.materiaMedicaError.set('');
  }

  isFocusedRemedy(remedyId: string) {
    return this.focusedRemedy()?.id === remedyId;
  }

  scorePercent(score: number) {
    const max = this.maxResultScore();
    if (!max) return 0;
    return Math.max(8, Math.round((score / max) * 100));
  }

  async searchRubrics() {
    const q = this.rubricQuery.trim();
    if (q.length < 2) return;

    this.searching.set(true);
    this.error.set('');
    this.searchedOnce.set(true);
    try {
      this.searchResults.set(
        await this.api.searchRubrics(q, this.selectedSourceId || this.analysis()?.source?.id)
      );
    } catch {
      this.error.set('Rubric search failed.');
      this.searchResults.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  hasRubric(rubricId: string) {
    return this.selectedRubrics().some((item) => item.rubricId === rubricId);
  }

  addRubric(rubric: RubricSearchResult) {
    if (this.hasRubric(rubric.id)) return;
    this.selectedRubrics.set([
      ...this.selectedRubrics(),
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
    ]);
    this.message.set('Symptom added to case.');
  }

  removeRubric(rubricId: string) {
    this.selectedRubrics.set(this.selectedRubrics().filter((item) => item.rubricId !== rubricId));
  }

  private rubricPayload() {
    return this.selectedRubrics().map((item) => ({
      rubricId: item.rubricId,
      weight: item.weight
    }));
  }

  async saveRubrics() {
    const currentAnalysis = this.analysis();
    if (!currentAnalysis) return;
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const updated = await this.api.updateAnalysis(currentAnalysis.id, { rubrics: this.rubricPayload() });
      this.analysis.set(updated);
      this.hydrateFromAnalysis(updated);
      this.message.set('Case rubrics saved.');
    } catch {
      this.error.set('Could not save rubrics.');
    } finally {
      this.saving.set(false);
    }
  }

  async saveNotes() {
    const currentAnalysis = this.analysis();
    if (!currentAnalysis) return;
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const updated = await this.api.updateAnalysis(currentAnalysis.id, { notes: this.notes });
      this.analysis.set(updated);
      this.message.set('Notes saved.');
    } catch {
      this.error.set('Could not save notes.');
    } finally {
      this.saving.set(false);
    }
  }

  async runRepertorization() {
    const currentAnalysis = this.analysis();
    if (!currentAnalysis) return;
    this.repertorizing.set(true);
    this.error.set('');
    this.message.set('');
    try {
      await this.saveRubrics();
      const updated = await this.api.repertorize(currentAnalysis.id);
      this.analysis.set(updated);
      this.hydrateFromAnalysis(updated);
      this.message.set('Repertorization complete. Review ranked remedies on the right.');
    } catch {
      this.error.set('Repertorization failed. Add rubrics and try again.');
    } finally {
      this.repertorizing.set(false);
    }
  }

  async chooseRemedy(remedy: { id: string; name: string; abbreviation: string }) {
    const currentAnalysis = this.analysis();
    if (!currentAnalysis) return;
    this.selectingRemedyId.set(remedy.id);
    this.error.set('');
    this.message.set('');
    try {
      const updated = await this.api.selectRemedy(currentAnalysis.id, remedy.id);
      this.analysis.set(updated);
      await this.focusRemedy(remedy);
      this.message.set(`${remedy.name} selected as the case remedy.`);
    } catch {
      this.error.set('Could not select remedy.');
    } finally {
      this.selectingRemedyId.set('');
    }
  }

  openPrescriptionWithRemedy() {
    const currentAnalysis = this.analysis();
    if (!currentAnalysis?.selectedRemedy || !this.consultationId) return;
    void this.router.navigate(['/', ROUTE_PATHS.APPOINTMENTS], {
      queryParams: {
        consultationId: this.consultationId,
        remedy: currentAnalysis.selectedRemedy.name
      }
    });
  }
}
