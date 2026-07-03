import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CLINIC_API_BASE_URL } from '../api-base.url';
import { API_PATHS } from '../api-paths.constants';

@Service()
export class DeliveryApiService {
  private http = inject(HttpClient);
  private base = inject(CLINIC_API_BASE_URL);

  getMe() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.DELIVERY.ME}`));
  }

  getDashboard() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.DELIVERY.DASHBOARD}`));
  }

  getOrders(status?: string) {
    const params = status ? { status } : undefined;
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.DELIVERY.ORDERS}`, { params }));
  }

  getOrder(id: string) {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.DELIVERY.ORDER(id)}`));
  }

  acceptOrder(id: string) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.DELIVERY.ACCEPT(id)}`, {}));
  }

  pickupOrder(id: string) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.DELIVERY.PICKUP(id)}`, {}));
  }

  completeOrder(id: string, payload: { otp: string; proofNote?: string }) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.DELIVERY.COMPLETE(id)}`, payload));
  }

  failOrder(id: string, reason: string) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.DELIVERY.FAIL(id)}`, { reason }));
  }
}
