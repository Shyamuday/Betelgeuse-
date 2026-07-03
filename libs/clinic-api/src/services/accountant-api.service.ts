import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CLINIC_API_BASE_URL, CLINIC_AUTH_TOKEN_KEY } from '../api-base.url';
import { API_PATHS } from '../api-paths.constants';

@Service()
export class AccountantApiService {
  private http = inject(HttpClient);
  private base = inject(CLINIC_API_BASE_URL);
  private authTokenKey = inject(CLINIC_AUTH_TOKEN_KEY);

  getMe() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.ACCOUNTANT.ME}`));
  }

  getSummary(month: string) {
    return firstValueFrom(
      this.http.get<any>(`${this.base}${API_PATHS.ACCOUNTANT.SUMMARY}`, { params: { month } })
    );
  }

  getBranches(month: string) {
    return firstValueFrom(
      this.http.get<any>(`${this.base}${API_PATHS.ACCOUNTANT.BRANCHES}`, { params: { month } })
    );
  }

  async exportBundle(params: { month: string; storeId?: string }) {
    const query = new URLSearchParams({ month: params.month });
    if (params.storeId) query.set('storeId', params.storeId);
    const token = localStorage.getItem(this.authTokenKey);
    const response = await fetch(
      `${this.base}${API_PATHS.ACCOUNTANT.EXPORT_BUNDLE}?${query.toString()}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!response.ok) throw new Error('Export failed');
    return response.text();
  }
}
