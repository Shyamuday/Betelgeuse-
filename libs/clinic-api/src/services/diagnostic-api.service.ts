import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CLINIC_API_BASE_URL } from '../api-base.url';
import { API_PATHS } from '../api-paths.constants';

@Service()
export class DiagnosticApiService {
  private http = inject(HttpClient);
  private base = inject(CLINIC_API_BASE_URL);

  getMe() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.DIAGNOSTIC.ME}`));
  }

  getReferrals(status?: string) {
    const params = status ? { status } : undefined;
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.DIAGNOSTIC.REFERRALS}`, { params }));
  }

  getReferral(id: string) {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.DIAGNOSTIC.REFERRAL(id)}`));
  }

  acceptReferral(id: string, data: { partnerNotes?: string; expectedResultDate?: string }) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.DIAGNOSTIC.ACCEPT(id)}`, data));
  }

  advanceReferral(id: string, status: 'SAMPLE_COLLECTED' | 'IN_PROGRESS') {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.DIAGNOSTIC.ADVANCE(id)}`, { status }));
  }

  submitResults(id: string, lines: Array<{ lineId: string; resultSummary: string; resultFileUrl?: string }>) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.DIAGNOSTIC.RESULTS(id)}`, { lines }));
  }
}
