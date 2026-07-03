import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CLINIC_API_BASE_URL } from '../api-base.url';
import { API_PATHS } from '../api-paths.constants';

@Service()
export class InsuranceApiService {
  private http = inject(HttpClient);
  private base = inject(CLINIC_API_BASE_URL);

  getMe() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.INSURANCE.ME}`));
  }

  getClaims() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.INSURANCE.CLAIMS}`));
  }

  createClaim(data: { patientId: string; claimAmountInPaise: number; description?: string }) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.INSURANCE.CLAIMS}`, data));
  }
}
