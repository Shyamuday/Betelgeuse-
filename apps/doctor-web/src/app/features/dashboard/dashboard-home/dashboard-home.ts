import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-dashboard-home',
  imports: [CommonModule],
  templateUrl: './dashboard-home.html',
  styleUrl: './dashboard-home.scss',
})
export class DashboardHome {
  private readonly apiBase = 'http://localhost:4000';
  error = '';
  summary: {
    doctorSharePercent: number;
    totals: {
      paidConsultations: number;
      grossInPaise: number;
      estimatedDoctorEarningsInPaise: number;
    };
    payments: Array<any>;
  } | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly auth: Auth
  ) {
    void this.loadSummary();
  }

  private headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.token()}`
    });
  }

  async loadSummary() {
    this.error = '';
    try {
      this.summary = await firstValueFrom(
        this.http.get<DashboardHome['summary']>(`${this.apiBase}/doctor/payments/summary`, {
          headers: this.headers()
        })
      );
    } catch {
      this.error = 'Could not load payment summary.';
    }
  }
}
