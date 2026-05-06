import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';

type WorklistConsultation = {
  id: string;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'PRESCRIPTION_UPLOADED' | 'COMPLETED' | string;
  createdAt: string;
  patient?: { id: string; name: string; mobile?: string | null };
  disease?: { name?: string };
  prescriptions?: Array<{
    id: string;
    version: number;
    status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
    followUpDate?: string | null;
    createdAt: string;
  }>;
};

@Component({
  selector: 'app-patients-page',
  imports: [FormsModule, CommonModule, DatePipe],
  templateUrl: './patients-page.html',
  styleUrl: './patients-page.scss'
})
export class PatientsPage {
  private readonly apiBase = 'http://localhost:4000';
  worklistLoading = false;
  worklistError = '';
  consultations: WorklistConsultation[] = [];

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
    private readonly auth: Auth,
    private readonly router: Router
  ) {
    void this.loadWorklist();
  }

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

  async loadWorklist() {
    this.worklistError = '';
    this.worklistLoading = true;
    try {
      const response = await firstValueFrom(
        this.http.get<{ consultations: WorklistConsultation[] }>(`${this.apiBase}/consultations`, {
          headers: this.headers()
        })
      );
      this.consultations = response.consultations || [];
    } catch {
      this.worklistError = 'Could not load doctor worklist.';
    } finally {
      this.worklistLoading = false;
    }
  }

  assignedCases() {
    return this.consultations.filter((item) => item.status === 'ASSIGNED');
  }

  inProgressCases() {
    return this.consultations.filter((item) => item.status === 'IN_PROGRESS' || item.status === 'PRESCRIPTION_UPLOADED');
  }

  followUpDueCases() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return this.consultations.filter((item) => {
      const published = (item.prescriptions || []).find((p) => p.status === 'PUBLISHED');
      if (!published?.followUpDate) {
        return false;
      }
      return new Date(published.followUpDate) <= today && item.status !== 'COMPLETED';
    });
  }

  publishedFollowUpDate(item: WorklistConsultation) {
    return (item.prescriptions || []).find((p) => p.status === 'PUBLISHED')?.followUpDate || null;
  }

  openInAppointments(consultationId: string) {
    void this.router.navigate(['/appointments'], { queryParams: { consultationId } });
  }
}
