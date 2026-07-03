import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CLINIC_API_BASE_URL } from '../api-base.url';
import { API_PATHS } from '../api-paths.constants';

@Service()
export class SupplierApiService {
  private http = inject(HttpClient);
  private base = inject(CLINIC_API_BASE_URL);

  getMe() {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.SUPPLIER.ME}`));
  }

  getOrders(status?: string) {
    const params = status ? { status } : undefined;
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.SUPPLIER.ORDERS}`, { params }));
  }

  getOrder(id: string) {
    return firstValueFrom(this.http.get<any>(`${this.base}${API_PATHS.SUPPLIER.ORDER(id)}`));
  }

  confirmOrder(id: string, data: { supplierNotes?: string; expectedDeliveryDate?: string }) {
    return firstValueFrom(this.http.post<any>(`${this.base}${API_PATHS.SUPPLIER.CONFIRM(id)}`, data));
  }
}
