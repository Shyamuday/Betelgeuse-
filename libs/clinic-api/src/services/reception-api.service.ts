import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CLINIC_API_BASE_URL } from '../api-base.url';
import { API_PATHS } from '../api-paths.constants';

@Service()
export class ReceptionApiService {
  private http = inject(HttpClient);
  private base = inject(CLINIC_API_BASE_URL);

  getMe() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.RECEPTION.ME}`));
  }

  getQueue(params: { status?: string; q?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.q) query.set('q', params.q);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.RECEPTION.QUEUE}${suffix}`));
  }

  searchPatients(q: string) {
    return firstValueFrom(
      this.http.get<any>(`${this.base}${API_PATHS.RECEPTION.PATIENTS_SEARCH}`, { params: { q } })
    );
  }

  getDoctors() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.RECEPTION.DOCTORS}`));
  }

  getDiseases() {
    return firstValueFrom(this.http.get<{ diseases: Array<any> }>(`${this.base}${API_PATHS.DISEASES}`));
  }

  walkIn(data: Record<string, unknown>) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.RECEPTION.WALK_IN}`, data));
  }

  bookConsultation(data: Record<string, unknown>) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.RECEPTION.CONSULTATIONS}`, data));
  }

  collectCash(consultationId: string) {
    return firstValueFrom(
      this.http.post<any>(`${this.base}${API_PATHS.RECEPTION.COLLECT_CASH(consultationId)}`, {})
    );
  }

  assignDoctor(consultationId: string, doctorId: string) {
    return firstValueFrom(
      this.http.put<any>(`${this.base}${API_PATHS.RECEPTION.ASSIGN(consultationId)}`, { doctorId })
    );
  }
}
