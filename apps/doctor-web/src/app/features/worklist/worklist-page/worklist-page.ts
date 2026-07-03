import { CommonModule, DatePipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ROUTE_PATHS } from '../../../core/constants/app-routes.constants';
import { WorklistApiService, type WorklistItem, type WorklistView } from '../worklist-api.service';

@Component({
  selector: 'app-worklist-page',
  imports: [CommonModule, DatePipe, FormsModule, RouterLink],
  templateUrl: './worklist-page.html',
  styleUrl: './worklist-page.scss'
})
export class WorklistPage {
  readonly loading = signal(false);
  readonly error = signal('');
  search = '';
  view: WorklistView = 'ALL';
  readonly counts = signal({ assigned: 0, inProgress: 0, followUpDue: 0 });
  readonly assigned = signal<WorklistItem[]>([]);
  readonly inProgress = signal<WorklistItem[]>([]);
  readonly followUpDue = signal<WorklistItem[]>([]);

  constructor(
    private readonly worklistApi: WorklistApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    const view = this.route.snapshot.queryParamMap.get('view');
    if (view === 'ASSIGNED' || view === 'IN_PROGRESS' || view === 'FOLLOW_UP_DUE' || view === 'ALL') {
      this.view = view;
    }
    void this.load();
  }

  async load() {
    this.error.set('');
    this.loading.set(true);
    try {
      const response = await this.worklistApi.loadWorklist(this.view, this.search);
      this.counts.set(response.counts);
      this.assigned.set(response.sections.assigned);
      this.inProgress.set(response.sections.inProgress);
      this.followUpDue.set(response.sections.followUpDue);
    } catch {
      this.error.set('Could not load your worklist.');
    } finally {
      this.loading.set(false);
    }
  }

  showSection(section: 'ASSIGNED' | 'IN_PROGRESS' | 'FOLLOW_UP_DUE') {
    return this.view === 'ALL' || this.view === section;
  }

  setView(view: WorklistView) {
    this.view = view;
    void this.load();
  }

  openInAppointments(consultationId: string) {
    void this.router.navigate(['/', ROUTE_PATHS.APPOINTMENTS], { queryParams: { consultationId } });
  }

  openCaseAnalysis(consultationId: string) {
    void this.router.navigate(['/', ROUTE_PATHS.CASE_ANALYSIS, consultationId, 'case-analysis']);
  }

  scanPatient(patientCode: string | null | undefined) {
    if (!patientCode) {
      return;
    }
    void this.router.navigate(['/', 'scan', 'patient', patientCode]);
  }
}
