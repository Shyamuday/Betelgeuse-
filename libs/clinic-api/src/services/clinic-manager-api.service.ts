import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CLINIC_API_BASE_URL } from '../api-base.url';
import { API_PATHS } from '../api-paths.constants';

@Service()
export class ClinicManagerApiService {
  private http = inject(HttpClient);
  private base = inject(CLINIC_API_BASE_URL);

  getMe() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.CLINIC_MANAGER.ME}`));
  }

  getDashboard() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.CLINIC_MANAGER.DASHBOARD}`));
  }

  getRoster(date?: string) {
    const params = date ? { date } : undefined;
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.CLINIC_MANAGER.ROSTER}`, { params }));
  }

  getSchedules(from?: string, to?: string) {
    const params: Record<string, string> = {};
    if (from) params['from'] = from;
    if (to) params['to'] = to;
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.CLINIC_MANAGER.SCHEDULES}`, { params }));
  }
}
