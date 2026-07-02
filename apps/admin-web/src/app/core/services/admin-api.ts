import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdminAuth } from './admin-auth';
import { environment } from '../../../environments/environment';

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
    return firstValueFrom(this.http.get(`${this.apiBase}/admin/reports`));
  }

  getAuditLogs(page = 1, pageSize = 20) {
    return firstValueFrom(
      this.http.get<{ logs: Array<any>; pagination: any }>(`${this.apiBase}/admin/audit-logs`, {
        params: { page: String(page), pageSize: String(pageSize) }
      })
    );
  }

  getPayments(params: {
    page?: number;
    pageSize?: number;
    status?: 'ALL' | 'CREATED' | 'PAID' | 'FAILED';
    from?: string;
    to?: string;
  }) {
    return firstValueFrom(
      this.http.get<{
        payments: Array<any>;
        summary: { total: number; paid: number; failedCount: number; pendingCount: number };
        pagination: any;
      }>(`${this.apiBase}/admin/payments`, {
        params: {
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? 10),
          status: params.status ?? 'ALL',
          from: params.from ?? '',
          to: params.to ?? ''
        }
      })
    );
  }

  async exportPaymentsCsv(params: {
    page?: number;
    pageSize?: number;
    status?: 'ALL' | 'CREATED' | 'PAID' | 'FAILED';
    from?: string;
    to?: string;
  }) {
    const query = new URLSearchParams({
      page: String(params.page ?? 1),
      pageSize: String(params.pageSize ?? 100),
      status: params.status ?? 'ALL',
      export: 'csv'
    });
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    const response = await fetch(`${this.apiBase}/admin/payments?${query.toString()}`, {
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
    sortBy?: 'name' | 'createdAt' | 'status';
    sortDirection?: 'asc' | 'desc';
  }) {
    return firstValueFrom(
      this.http.get<{ doctors: Array<any>; pagination: any }>(`${this.apiBase}/admin/doctors`, {
        params: {
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? 6),
          q: params.q ?? '',
          status: params.status ?? 'ALL',
          sortBy: params.sortBy ?? 'createdAt',
          sortDirection: params.sortDirection ?? 'desc'
        }
      })
    );
  }

  getPendingDoctorsPaged(params: { page?: number; pageSize?: number; q?: string }) {
    return firstValueFrom(
      this.http.get<{ pendingDoctors: Array<any>; pagination: any }>(`${this.apiBase}/admin/doctors/pending`, {
        params: {
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? 6),
          q: params.q ?? ''
        }
      })
    );
  }

  approveDoctor(doctorId: string) {
    return firstValueFrom(this.http.post(`${this.apiBase}/admin/doctors/${doctorId}/approve`, {}));
  }

  rejectDoctor(doctorId: string) {
    return firstValueFrom(this.http.post(`${this.apiBase}/admin/doctors/${doctorId}/reject`, {}));
  }

  setDoctorStatus(doctorId: string, isActive: boolean) {
    return firstValueFrom(this.http.post(`${this.apiBase}/admin/doctors/${doctorId}/status`, { isActive }));
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
    return firstValueFrom(this.http.put(`${this.apiBase}/admin/doctors/${doctorId}`, payload));
  }

  createDoctor(payload: {
    name: string;
    email: string;
    mobile?: string;
    password: string;
    specialty: string;
    registrationNo?: string;
  }) {
    return firstValueFrom(this.http.post(`${this.apiBase}/admin/doctors`, payload));
  }

  getConsultations() {
    return firstValueFrom(this.http.get<{ consultations: Array<any> }>(`${this.apiBase}/consultations`));
  }

  getConsumersPaged(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    sortBy?: 'name' | 'consultations';
    sortDirection?: 'asc' | 'desc';
  }) {
    return firstValueFrom(
      this.http.get<{ consumers: Array<any>; pagination: any }>(`${this.apiBase}/admin/consumers`, {
        params: {
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? 8),
          q: params.q ?? '',
          sortBy: params.sortBy ?? 'consultations',
          sortDirection: params.sortDirection ?? 'desc'
        }
      })
    );
  }

  getConsumerDetail(consumerId: string) {
    return firstValueFrom(
      this.http.get<{ consumer: any; consultations: Array<any>; adherence: any }>(
        `${this.apiBase}/admin/consumers/${consumerId}`
      )
    );
  }

  assignDoctor(consultationId: string, doctorId: string) {
    return firstValueFrom(
      this.http.post(`${this.apiBase}/consultations/${consultationId}/assign`, { doctorId })
    );
  }

  getActiveDoctors() {
    return firstValueFrom(
      this.http.get<{ doctors: Array<{ id: string; name: string; doctorProfile?: { specialty?: string } | null }> }>(
        `${this.apiBase}/admin/doctors`,
        { params: { status: 'ACTIVE', pageSize: '100', page: '1', q: '', sortBy: 'name', sortDirection: 'asc' } }
      )
    );
  }

  getDiseases() {
    return firstValueFrom(
      this.http.get<{ diseases: Array<{ id: string; name: string; description: string; feeInPaise: number; isActive: boolean; intakeQuestions: string[] }> }>(
        `${this.apiBase}/admin/diseases/list`
      )
    );
  }

  createDisease(payload: { name: string; description: string; feeInPaise: number; intakeQuestions: string[] }) {
    return firstValueFrom(this.http.post(`${this.apiBase}/admin/diseases`, payload));
  }

  updateDisease(id: string, payload: { name: string; description: string; feeInPaise: number; isActive: boolean; intakeQuestions: string[] }) {
    return firstValueFrom(this.http.put(`${this.apiBase}/admin/diseases/${id}`, payload));
  }

  // HR — Doctors
  getHrDoctors() {
    return firstValueFrom(this.http.get<{ doctors: Array<any> }>(`${this.apiBase}/hr/doctors`));
  }

  getHrDoctor(id: string) {
    return firstValueFrom(this.http.get<{ doctor: any }>(`${this.apiBase}/hr/doctors/${id}`));
  }

  updateHrDoctor(id: string, data: Record<string, unknown>) {
    return firstValueFrom(this.http.put<{ doctor: any }>(`${this.apiBase}/hr/doctors/${id}`, data));
  }

  generateDoctorLetter(id: string, clinicName?: string, clinicAddress?: string) {
    return firstValueFrom(
      this.http.post<{ letter: any }>(`${this.apiBase}/hr/doctors/${id}/letter`, { clinicName, clinicAddress })
    );
  }

  createHrUser(payload: { name: string; email: string; password: string; designation?: string; department?: string }) {
    return firstValueFrom(this.http.post(`${this.apiBase}/hr/users`, payload));
  }

  getHrUsers() {
    return firstValueFrom(this.http.get<{ hrUsers: any[] }>(`${this.apiBase}/hr/users`));
  }

  setHrUserStatus(id: string, isActive: boolean) {
    return firstValueFrom(this.http.patch(`${this.apiBase}/hr/users/${id}/status`, { isActive }));
  }

  getDoctorLetter(id: string) {
    return firstValueFrom(this.http.get<{ letter: any }>(`${this.apiBase}/hr/doctors/${id}/letter`));
  }

  // HR Store Access Management
  getHrUserStores(hrUserId: string) {
    return firstValueFrom(
      this.http.get<{ assigned: any[]; all: any[] }>(`${this.apiBase}/hr/users/${hrUserId}/stores`)
    );
  }

  grantHrStoreAccess(hrUserId: string, storeId: string) {
    return firstValueFrom(this.http.post(`${this.apiBase}/hr/users/${hrUserId}/stores`, { storeId }));
  }

  revokeHrStoreAccess(hrUserId: string, storeId: string) {
    return firstValueFrom(this.http.delete(`${this.apiBase}/hr/users/${hrUserId}/stores/${storeId}`));
  }

  grantAllStores(hrUserId: string) {
    return firstValueFrom(this.http.post(`${this.apiBase}/hr/users/${hrUserId}/stores/all`, {}));
  }

  // HR — Employees (unified)
  getHrEmployees(params: { q?: string; type?: string; status?: string }) {
    return firstValueFrom(
      this.http.get<{ employees: Array<any>; total: number }>(`${this.apiBase}/hr/employees`, {
        params: { q: params.q ?? '', type: params.type ?? 'ALL', status: params.status ?? 'ALL' }
      })
    );
  }

  updateHrStoreStaff(id: string, data: Record<string, unknown>) {
    return firstValueFrom(this.http.put<{ staff: any }>(`${this.apiBase}/hr/store/staff/${id}`, data));
  }

  generateStoreStaffLetter(id: string) {
    return firstValueFrom(this.http.post<{ letter: any }>(`${this.apiBase}/hr/store/staff/${id}/letter`, {}));
  }

  getStoreStaffLetter(id: string) {
    return firstValueFrom(this.http.get<{ letter: any }>(`${this.apiBase}/hr/store/staff/${id}/letter`));
  }

  setDoctorAssignment(id: string, data: { isOnline: boolean; clinicStoreId?: string | null }) {
    return firstValueFrom(this.http.put(`${this.apiBase}/hr/doctors/${id}/assignment`, data));
  }

  // HR — Leaves
  getAdminLeaves(params: { status?: string; empType?: string; page?: number; pageSize?: number }) {
    return firstValueFrom(
      this.http.get<{ leaves: Array<any>; total: number }>(`${this.apiBase}/hr/leaves`, {
        params: {
          status: params.status ?? 'ALL',
          empType: params.empType ?? 'ALL',
          page: String(params.page ?? 1),
          pageSize: String(params.pageSize ?? 20)
        }
      })
    );
  }

  createAdminLeave(data: any) {
    return firstValueFrom(this.http.post<{ leave: any }>(`${this.apiBase}/hr/leaves`, data));
  }

  updateAdminLeave(id: string, data: { status: string; hrNote?: string }) {
    return firstValueFrom(this.http.patch<{ leave: any }>(`${this.apiBase}/hr/leaves/${id}`, data));
  }

  // HR — Stores
  getAdminStores() {
    return firstValueFrom(this.http.get<{ stores: Array<any> }>(`${this.apiBase}/hr/stores`));
  }

  createAdminStore(data: { name: string; code: string; address?: string; phone?: string }) {
    return firstValueFrom(this.http.post<{ store: any }>(`${this.apiBase}/hr/stores`, data));
  }

  createAdminManager(storeId: string, data: any) {
    return firstValueFrom(this.http.post<{ manager: any }>(`${this.apiBase}/hr/stores/${storeId}/managers`, data));
  }

  createAdminStoreStaff(storeId: string, data: any) {
    return firstValueFrom(this.http.post<{ staff: any }>(`${this.apiBase}/hr/stores/${storeId}/staff`, data));
  }

  setAdminStoreStaffStatus(id: string, data: any) {
    return firstValueFrom(this.http.patch(`${this.apiBase}/hr/store/staff/${id}/status`, data));
  }
}
