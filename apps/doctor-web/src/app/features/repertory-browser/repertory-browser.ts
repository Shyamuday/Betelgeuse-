import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { form, FormField } from '@angular/forms/signals';
import { environment } from '../../../environments/environment';
import { API_PATHS } from '../../core/constants/api-paths.constants';

type RepertorySource = { id: string; code: string; name: string; rubricCount?: number };
type RemedyRef = { id: string; name: string; abbreviation: string };
type ChapterEntry = { chapter: string; rubricCount: number };
type RubricResult = {
  id: string;
  chapter: string;
  subchapter?: string | null;
  text: string;
  parentPath?: string | null;
  source?: { id: string; name: string; code: string };
  remedies: Array<{ grade: number; remedy: RemedyRef }>;
};
type MateriaMedicaSection = { id: string; heading: string | null; content: string; depth: number };
type MateriaMedicaResponse = {
  remedy: RemedyRef;
  source: { id: string; name: string; author?: string; year?: number } | null;
  sections: MateriaMedicaSection[];
  keyRubrics: Array<{ rubricId: string; grade: number; rubric: { id: string; chapter: string; text: string } }>;
};

type Tab = 'search' | 'chapters' | 'remedies';

@Component({
  selector: 'app-repertory-browser',
  imports: [FormField, CommonModule],
  templateUrl: './repertory-browser.html',
  styleUrl: './repertory-browser.scss'
})
export class RepertoryBrowserPage {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl;

  readonly sources = signal<RepertorySource[]>([]);
  readonly activeTab = signal<Tab>('search');
  readonly rubricResults = signal<RubricResult[]>([]);
  readonly remedyResults = signal<RemedyRef[]>([]);
  readonly materiaMedica = signal<MateriaMedicaResponse | null>(null);
  readonly chapters = signal<ChapterEntry[]>([]);
  readonly chapterRubrics = signal<RubricResult[]>([]);
  readonly selectedChapter = signal<string | null>(null);

  readonly searchModel = signal({ query: '', sourceId: '' });
  readonly searchForm = form(this.searchModel);

  readonly loadingSources = signal(false);
  readonly searchingRubrics = signal(false);
  readonly searchingRemedies = signal(false);
  readonly loadingMM = signal(false);
  readonly loadingChapters = signal(false);
  readonly loadingChapterRubrics = signal(false);
  readonly searchedOnce = signal(false);

  constructor() {
    void this.loadSources();
  }

  async loadSources() {
    this.loadingSources.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<{ sources: RepertorySource[] }>(`${this.apiBase}${API_PATHS.DOCTOR.REPERTORY_SOURCES}`)
      );
      this.sources.set(data.sources);
      if (data.sources.length && !this.searchModel().sourceId) {
        this.searchModel.update((m) => ({ ...m, sourceId: data.sources[0].id }));
      }
    } catch { /* ignore */ } finally {
      this.loadingSources.set(false);
    }
  }

  switchTab(tab: Tab) {
    this.activeTab.set(tab);
    this.rubricResults.set([]);
    this.remedyResults.set([]);
    this.materiaMedica.set(null);
    this.chapterRubrics.set([]);
    this.selectedChapter.set(null);
    this.searchedOnce.set(false);

    if (tab === 'chapters' && !this.chapters().length && this.searchModel().sourceId) {
      void this.loadChapters();
    }
  }

  async search() {
    const q = this.searchModel().query.trim();
    if (q.length < 2) return;
    this.searchedOnce.set(true);
    this.materiaMedica.set(null);

    if (this.activeTab() === 'remedies') {
      await this.searchRemedies(q);
    } else {
      await this.searchRubrics(q);
    }
  }

  async searchRubrics(q: string) {
    this.searchingRubrics.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<{ rubrics: RubricResult[] }>(`${this.apiBase}${API_PATHS.DOCTOR.REPERTORY_RUBRICS_SEARCH}`, {
          params: { q, limit: '40', ...(this.searchModel().sourceId ? { sourceId: this.searchModel().sourceId } : {}) }
        })
      );
      this.rubricResults.set(data.rubrics);
    } catch {
      this.rubricResults.set([]);
    } finally {
      this.searchingRubrics.set(false);
    }
  }

  async searchRemedies(q: string) {
    this.searchingRemedies.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<{ remedies: RemedyRef[] }>(`${this.apiBase}${API_PATHS.DOCTOR.REPERTORY_REMEDIES_SEARCH}`, {
          params: { q, limit: '40' }
        })
      );
      this.remedyResults.set(data.remedies);
    } catch {
      this.remedyResults.set([]);
    } finally {
      this.searchingRemedies.set(false);
    }
  }

  async loadChapters() {
    const sourceId = this.searchModel().sourceId;
    if (!sourceId) return;
    this.loadingChapters.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<{ chapters: ChapterEntry[] }>(`${this.apiBase}${API_PATHS.DOCTOR.REPERTORY_CHAPTERS}`, {
          params: { sourceId }
        })
      );
      this.chapters.set(data.chapters);
    } catch {
      this.chapters.set([]);
    } finally {
      this.loadingChapters.set(false);
    }
  }

  async openChapter(chapter: string) {
    this.selectedChapter.set(chapter);
    this.chapterRubrics.set([]);
    this.loadingChapterRubrics.set(true);
    try {
      const data = await firstValueFrom(
        this.http.get<{ rubrics: RubricResult[] }>(`${this.apiBase}${API_PATHS.DOCTOR.REPERTORY_CHAPTER_RUBRICS}`, {
          params: { sourceId: this.searchModel().sourceId, chapter, limit: '100' }
        })
      );
      this.chapterRubrics.set(data.rubrics);
    } catch {
      this.chapterRubrics.set([]);
    } finally {
      this.loadingChapterRubrics.set(false);
    }
  }

  backToChapters() {
    this.selectedChapter.set(null);
    this.chapterRubrics.set([]);
  }

  async openMateriaMedica(remedy: RemedyRef) {
    this.loadingMM.set(true);
    this.materiaMedica.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<MateriaMedicaResponse>(
          `${this.apiBase}${API_PATHS.DOCTOR.REPERTORY_REMEDY_MATERIA_MEDICA(remedy.id)}`
        )
      );
      this.materiaMedica.set(data);
    } catch {
      this.materiaMedica.set(null);
    } finally {
      this.loadingMM.set(false);
    }
  }

  closeMateriaMedica() {
    this.materiaMedica.set(null);
  }

  onSourceChange() {
    this.chapters.set([]);
    this.selectedChapter.set(null);
    this.chapterRubrics.set([]);
    if (this.activeTab() === 'chapters') {
      void this.loadChapters();
    }
  }

  rubricPath(rubric: RubricResult) {
    return [rubric.chapter, rubric.subchapter, rubric.parentPath].filter(Boolean).join(' › ');
  }
}
