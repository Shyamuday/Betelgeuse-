import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdminAuth } from './admin-auth';
import { environment } from '../../../environments/environment';
import { API_EXPORT_FORMAT, API_PATHS } from '../constants/api-paths.constants';
import { FILTER_ALL, SORT_DIRECTIONS } from '../../shared/constants/filter.constants';
import { PAGE_SIZES } from '../constants/pagination.constants';
import type { DoctorSortField } from '../../features/doctors/constants/doctors-list.constants';
import type { ConsumerSortField } from '../../features/consumers/constants/consumers-list.constants';
import type { PaymentStatus } from '../../features/dashboard/constants/payments.constants';
import type { SortDirection } from '../../shared/constants/filter.constants';

@Injectable({
  providedIn: 'root'
})
export class AdminApi {
  private readonly apiBase = environment.apiUrl;

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AdminAuth
  ) {}

  getReports() {
    return firstValueFrom(this.http.get(`${this.apiBase}${API_PATHS.ADMIN.REPORTS}`));
  }

  getAuditLogs(page = 1, pageSize: number = PAGE_SIZES.AUDIT_LOGS_API_DEFAULT) {
    return firstValueFrom(
      this.http.get<{ logs: Array<any>; pagination: any }>(`${this.apiBase}${API_PATHS.ADMIN.AUDIT_LOGS}`, {
        params: { page: String(page), pageSize: String(pageSize) }
      })
    );
  }

  getPayments(params: {
    page?: number;
    pageSize?: number;
    status?: PaymentStatus;
    from?: string;
    to?: string;
  }) {
    return firstValueFrom(
      this.http.get<{
        payments: Array<any>;
        summary: { total: number; paid: number; failedCount: number; pendingCount: number };
        pagination: any;
      }>(`${this.apiBase}${API_PATHS.ADMIN.PAYMENTS}`, {
        params: {
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? PAGE_SIZES.PAYMENTS),
          status: params.status ?? FILTER_ALL,
          from: params.from ?? '',
          to: params.to ?? ''
        }
      })
    );
  }

  async exportPaymentsCsv(params: {
    page?: number;
    pageSize?: number;
    status?: PaymentStatus;
    from?: string;
    to?: string;
  }) {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? PAGE_SIZES.PAYMENTS_EXPORT),
      status: params.status ?? FILTER_ALL,
      export: API_EXPORT_FORMAT.CSV
    });
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    const response = await fetch(`${this.apiBase}${API_PATHS.ADMIN.PAYMENTS}?${query.toString()}`, {
      headers: { Authorization: `Bearer ${this.auth.token()}` }
    });
    if (!response.ok) {
      throw new Error('Could not export payments CSV.');
    }
    return response.text();
  }

  getDoctors() {
    return this.getDoctorsPaged({});
  }

  getPendingDoctors() {
    return this.getPendingDoctorsPaged({});
  }

  getDoctorsPaged(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
    sortBy?: DoctorSortField;
    sortDirection?: SortDirection;
  }) {
    return firstValueFrom(
      this.http.get<{ doctors: Array<any>; pagination: any }>(`${this.apiBase}${API_PATHS.ADMIN.DOCTORS}`, {
        params: {
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? PAGE_SIZES.DOCTORS),
          q: params.q ?? '',
          status: params.status ?? FILTER_ALL,
          sortBy: params.sortBy ?? 'createdAt',
          sortDirection: params.sortDirection ?? SORT_DIRECTIONS.DESC
        }
      })
    );
  }

  getPendingDoctorsPaged(params: { page?: number; pageSize?: number; q?: string }) {
    return firstValueFrom(
      this.http.get<{ pendingDoctors: Array<any>; pagination: any }>(`${this.apiBase}${API_PATHS.ADMIN.DOCTORS_PENDING}`, {
        params: {
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? PAGE_SIZES.DOCTORS),
          q: params.q ?? ''
        }
      })
    );
  }

  approveDoctor(doctorId: string) {
    return firstValueFrom(this.http.post(`${this.apiBase}${API_PATHS.ADMIN.DOCTORS}/${doctorId}/approve`, {}));
  }

  rejectDoctor(doctorId: string) {
    return firstValueFrom(this.http.post(`${this.apiBase}${API_PATHS.ADMIN.DOCTORS}/${doctorId}/reject`, {}));
  }

  setDoctorStatus(doctorId: string, isActive: boolean) {
    return firstValueFrom(this.http.post(`${this.apiBase}${API_PATHS.ADMIN.DOCTORS}/${doctorId}/status`, { isActive }));
  }

  updateDoctor(
    doctorId: string,
    payload: {
      name: string;
      email: string;
      mobile?: string;
      specialty: string;
      registrationNo?: string;
      isAvailable: boolean;
    }
  ) {
    return firstValueFrom(this.http.put(`${this.apiBase}${API_PATHS.ADMIN.DOCTORS}/${doctorId}`, payload));
  }

  createDoctor(payload: {
    name: string;
    email: string;
    mobile?: string;
    password: string;
    specialty: string;
    registrationNo?: string;
  }) {
    return firstValueFrom(this.http.post(`${this.apiBase}${API_PATHS.ADMIN.DOCTORS}`, payload));
  }

  getConsultations() {
    return firstValueFrom(this.http.get<{ consultations: Array<any> }>(`${this.apiBase}${API_PATHS.CONSULTATIONS}`));
  }

  getConsumersPaged(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    sortBy?: ConsumerSortField;
    sortDirection?: SortDirection;
  }) {
    return firstValueFrom(
      this.http.get<{ consumers: Array<any>; pagination: any }>(`${this.apiBase}${API_PATHS.ADMIN.CONSUMERS}`, {
        params: {
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? PAGE_SIZES.CONSUMERS),
          q: params.q ?? '',
          sortBy: params.sortBy ?? 'consultations',
          sortDirection: params.sortDirection ?? SORT_DIRECTIONS.DESC
        }
      })
    );
  }

  getConsumerDetail(consumerId: string) {
    return firstValueFrom(
      this.http.get<{ consumer: any; consultations: Array<any>; adherence: any }>(
        `${this.apiBase}${API_PATHS.ADMIN.CONSUMERS}/${consumerId}`
      )
    );
  }

  assignDoctor(consultationId: string, doctorId: string) {
    return firstValueFrom(
      this.http.post(`${this.apiBase}${API_PATHS.CONSULTATIONS}/${consultationId}/assign`, { doctorId })
    );
  }

  getActiveDoctors() {
    return firstValueFrom(
      this.http.get<{ doctors: Array<{ id: string; name: string; doctorProfile?: { specialty?: string } | null }> }>(
        `${this.apiBase}${API_PATHS.ADMIN.DOCTORS}`,
        {
          params: {
            status: 'ACTIVE',
            pageSize: String(PAGE_SIZES.ACTIVE_DOCTORS),
            page: '1',
            q: '',
            sortBy: 'name',
            sortDirection: SORT_DIRECTIONS.ASC
          }
        }
      )
    );
  }

  getDiseases() {
    return firstValueFrom(
      this.http.get<{ diseases: Array<{ id: string; name: string; description: string; feeInPaise: number; isActive: boolean; intakeQuestions: string[] }> }>(
        `${this.apiBase}${API_PATHS.ADMIN.DISEASES_LIST}`
      )
    );
  }

  createDisease(payload: { name: string; description: string; feeInPaise: number; intakeQuestions: string[] }) {
    return firstValueFrom(this.http.post(`${this.apiBase}${API_PATHS.ADMIN.DISEASES}`, payload));
  }

  updateDisease(id: string, payload: { name: string; description: string; feeInPaise: number; isActive: boolean; intakeQuestions: string[] }) {
    return firstValueFrom(this.http.put(`${this.apiBase}${API_PATHS.ADMIN.DISEASES}/${id}`, payload));
  }

  // HR — Doctors
  getHrDoctors() {
    return firstValueFrom(this.http.get<{ doctors: Array<any> }>(`${this.apiBase}${API_PATHS.HR.DOCTORS}`));
  }

  getHrDoctor(id: string) {
    return firstValueFrom(this.http.get<{ doctor: any }>(`${this.apiBase}${API_PATHS.HR.DOCTORS}/${id}`));
  }

  updateHrDoctor(id: string, data: Record<string, unknown>) {
    return firstValueFrom(this.http.put<{ doctor: any }>(`${this.apiBase}${API_PATHS.HR.DOCTORS}/${id}`, data));
  }

  generateDoctorLetter(id: string, clinicName?: string, clinicAddress?: string) {
    return firstValueFrom(
      this.http.post<{ letter: any }>(`${this.apiBase}${API_PATHS.HR.DOCTORS}/${id}/letter`, { clinicName, clinicAddress })
    );
  }

  createHrUser(payload: { name: string; email: string; password: string; designation?: string; department?: string }) {
    return firstValueFrom(this.http.post(`${this.apiBase}${API_PATHS.HR.USERS}`, payload));
  }

  getHrUsers() {
    return firstValueFrom(this.http.get<{ hrUsers: any[] }>(`${this.apiBase}${API_PATHS.HR.USERS}`));
  }

  setHrUserStatus(id: string, isActive: boolean) {
    return firstValueFrom(this.http.patch(`${this.apiBase}${API_PATHS.HR.USERS}/${id}/status`, { isActive }));
  }

  getDoctorLetter(id: string) {
    return firstValueFrom(this.http.get<{ letter: any }>(`${this.apiBase}${API_PATHS.HR.DOCTORS}/${id}/letter`));
  }

  // HR Store Access Management
  getHrUserStores(hrUserId: string) {
    return firstValueFrom(
      this.http.get<{ assigned: any[]; all: any[] }>(`${this.apiBase}${API_PATHS.HR.USERS}/${hrUserId}/stores`)
    );
  }

  grantHrStoreAccess(hrUserId: string, storeId: string) {
    return firstValueFrom(this.http.post(`${this.apiBase}${API_PATHS.HR.USERS}/${hrUserId}/stores`, { storeId }));
  }

  revokeHrStoreAccess(hrUserId: string, storeId: string) {
    return firstValueFrom(this.http.delete(`${this.apiBase}${API_PATHS.HR.USERS}/${hrUserId}/stores/${storeId}`));
  }

  grantAllStores(hrUserId: string) {
    return firstValueFrom(this.http.post(`${this.apiBase}${API_PATHS.HR.USERS}/${hrUserId}/stores/all`, {}));
  }

  // HR — Employees (unified)
  getHrEmployees(params: { q?: string; type?: string; status?: string }) {
    return firstValueFrom(
      this.http.get<{ employees: Array<any>; total: number }>(`${this.apiBase}${API_PATHS.HR.EMPLOYEES}`, {
        params: { q: params.q ?? '', type: params.type ?? FILTER_ALL, status: params.status ?? FILTER_ALL }
      })
    );
  }

  updateHrStoreStaff(id: string, data: Record<string, unknown>) {
    return firstValueFrom(this.http.put<{ staff: any }>(`${this.apiBase}${API_PATHS.HR.STORE_STAFF}/${id}`, data));
  }

  generateStoreStaffLetter(id: string) {
    return firstValueFrom(this.http.post<{ letter: any }>(`${this.apiBase}${API_PATHS.HR.STORE_STAFF}/${id}/letter`, {}));
  }

  getStoreStaffLetter(id: string) {
    return firstValueFrom(this.http.get<{ letter: any }>(`${this.apiBase}${API_PATHS.HR.STORE_STAFF}/${id}/letter`));
  }

  setDoctorAssignment(id: string, data: { isOnline: boolean; clinicStoreId?: string | null }) {
    return firstValueFrom(this.http.put(`${this.apiBase}${API_PATHS.HR.DOCTORS}/${id}/assignment`, data));
  }

  // HR — Leaves
  getAdminLeaves(params: { status?: string; empType?: string; page?: number; pageSize?: number }) {
    return firstValueFrom(
      this.http.get<{ leaves: Array<any>; total: number }>(`${this.apiBase}${API_PATHS.HR.LEAVES}`, {
        params: {
          status: params.status ?? FILTER_ALL,
          empType: params.empType ?? FILTER_ALL,
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? PAGE_SIZES.LEAVES)
        }
      })
    );
  }

  createAdminLeave(data: any) {
    return firstValueFrom(this.http.post<{ leave: any }>(`${this.apiBase}${API_PATHS.HR.LEAVES}`, data));
  }

  updateAdminLeave(id: string, data: { status: string; hrNote?: string }) {
    return firstValueFrom(this.http.patch<{ leave: any }>(`${this.apiBase}${API_PATHS.HR.LEAVES}/${id}`, data));
  }

  // HR — Stores
  getAdminStores() {
    return firstValueFrom(this.http.get<{ stores: Array<any> }>(`${this.apiBase}${API_PATHS.HR.STORES}`));
  }

  createAdminStore(data: { name: string; code: string; address?: string; phone?: string }) {
    return firstValueFrom(this.http.post<{ store: any }>(`${this.apiBase}${API_PATHS.HR.STORES}`, data));
  }

  createAdminManager(storeId: string, data: any) {
    return firstValueFrom(this.http.post<{ manager: any }>(`${this.apiBase}${API_PATHS.HR.STORES}/${storeId}/managers`, data));
  }

  createAdminStoreStaff(storeId: string, data: any) {
    return firstValueFrom(this.http.post<{ staff: any }>(`${this.apiBase}${API_PATHS.HR.STORES}/${storeId}/staff`, data));
  }

  setAdminStoreStaffStatus(id: string, data: any) {
    return firstValueFrom(this.http.patch(`${this.apiBase}${API_PATHS.HR.STORE_STAFF}/${id}/status`, data));
  }

  // Admin Consultations
  getAdminConsultations(params: { status?: string; assigned?: string; q?: string; page?: number; pageSize?: number }) {
    return firstValueFrom(
      this.http.get<{ consultations: any[]; total: number }>(`${this.apiBase}/admin/consultations`, {
        params: {
          status:   params.status   ?? '',
          assigned: params.assigned ?? '',
          q:        params.q        ?? '',
          page:     String(params.page     ?? 1),
          pageSize: String(params.pageSize ?? 20)
        }
      })
    );
  }

  assignConsultationDoctor(consultationId: string, doctorId: string) {
    return firstValueFrom(
      this.http.put<{ consultation: any }>(`${this.apiBase}/admin/consultations/${consultationId}/assign`, { doctorId })
    );
  }
}
