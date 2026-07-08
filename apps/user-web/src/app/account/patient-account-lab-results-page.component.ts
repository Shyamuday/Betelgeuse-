import { Component, OnInit, inject, signal } from '@angular/core';
import { ClinicApiService } from '../clinic-api.service';
import { LabResultsComponent } from '../lab-results.component';
import { LabResult } from '../models';

@Component({
  selector: 'app-patient-account-lab-results-page',
  standalone: true,
  imports: [LabResultsComponent],
  template: `
    <section class="lab-page panel">
      <div class="page-hdr">
        <p class="eyebrow">My Account</p>
        <h1>Lab results</h1>
        <p class="page-lead">View diagnostic referrals and completed test results.</p>
      </div>
      @if (loading()) {
        <p class="loading-text">Loading lab results…</p>
      } @else {
        <app-lab-results [referrals]="referrals()" />
      }
    </section>
  `,
  styles: `
    .lab-page { padding: 1.25rem 1.5rem; }
    .page-hdr h1 { margin: 0.25rem 0; color: #102033; }
    .page-lead, .loading-text { color: #64748b; }
  `,
})
export class PatientAccountLabResultsPageComponent implements OnInit {
  private readonly api = inject(ClinicApiService);

  readonly loading = signal(true);
  readonly referrals = signal<LabResult[]>([]);

  ngOnInit() {
    this.api.patientLabResults().subscribe({
      next: ({ referrals }) => this.referrals.set(referrals),
      error: () => this.referrals.set([]),
      complete: () => this.loading.set(false),
    });
  }
}
