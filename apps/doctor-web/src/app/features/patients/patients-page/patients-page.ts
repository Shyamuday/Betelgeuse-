import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-patients-page',
  imports: [FormsModule],
  templateUrl: './patients-page.html',
  styleUrl: './patients-page.scss'
})
export class PatientsPage {
  private readonly apiBase = 'http://localhost:4000';

  patientId = '';
  days: 7 | 30 = 7;
  loading = false;
  error = '';
  message = '';

  summary: {
    patientId: string;
    days: number;
    totals: { total: number; taken: number; skipped: number; missed: number; pending: number };
    adherencePercent: number;
    trend: Array<{
      date: string;
      total: number;
      taken: number;
      skipped: number;
      missed: number;
      pending: number;
      adherencePercent: number;
    }>;
  } | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly auth: Auth
  ) {}

  private headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.token()}`
    });
  }

  async loadTrend() {
    this.error = '';
    this.message = '';
    this.summary = null;
    const id = this.patientId.trim();
    if (!id) {
      this.error = 'Enter patient ID.';
      return;
    }

    this.loading = true;
    try {
      const response = await firstValueFrom(
        this.http.get<PatientsPage['summary']>(`${this.apiBase}/doctor/patients/${id}/adherence-trend`, {
          headers: this.headers(),
          params: { days: String(this.days) }
        })
      );
      this.summary = response;
      this.message = `Loaded ${this.days}-day adherence trend.`;
    } catch {
      this.error = 'Could not load adherence trend for this patient.';
    } finally {
      this.loading = false;
    }
  }
}
