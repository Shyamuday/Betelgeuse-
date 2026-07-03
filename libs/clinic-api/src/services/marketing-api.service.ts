import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CLINIC_API_BASE_URL } from '../api-base.url';
import { API_PATHS } from '../api-paths.constants';

@Service()
export class MarketingApiService {
  private http = inject(HttpClient);
  private base = inject(CLINIC_API_BASE_URL);

  getMe() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.MARKETING.ME}`));
  }

  getFunnels(days = 30) {
    return firstValueFrom(
      this.http.get<any>(`${this.base}${API_PATHS.MARKETING.FUNNELS}`, { params: { days: String(days) } })
    );
  }
}
