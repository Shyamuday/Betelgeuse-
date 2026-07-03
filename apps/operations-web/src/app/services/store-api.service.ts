import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  StaffHrProfile,
  JoiningLetterDoc,
  Medicine,
  MedicineWithStock,
  MedicinesResponse,
  MovementsResponse,
  DashboardStats,
  StoreRack,
  StockBatch,
  StockAddRequest,
  StockRemoveRequest,
  RackCreateRequest,
  MedicineCreateRequest,
  MedicineDetailResponse,
  AlertsLowStockResponse,
  AlertsExpiringResponse,
  StockMovement,
  StaffActivityResponse,
  StaffDetailResponse
} from '../models/store';
import { API_PATHS } from '../core/constants/api-paths.constants';
import { ACTIVITY_PERIODS, DEFAULT_PAGE, EXPIRING_ALERTS_DEFAULT_DAYS, PAGE_SIZES } from '../core/constants/store/pagination.constants';

@Service()
export class StoreApiService {
  private http = inject(HttpClient);
  private readonly store = API_PATHS.STORE;

  private url(path: string): string {
    return `${environment.apiUrl}${path}`;
  }

  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.url(this.store.DASHBOARD));
  }

  getMedicines(query?: { q?: string; potency?: string; page?: number; pageSize?: number }): Observable<MedicinesResponse> {
    let params = new HttpParams();
    if (query?.q) params = params.set('q', query.q);
    if (query?.potency) params = params.set('potency', query.potency);
    if (query?.page) params = params.set('page', query.page.toString());
    if (query?.pageSize) params = params.set('pageSize', query.pageSize.toString());
    return this.http.get<MedicinesResponse>(this.url(this.store.MEDICINES), { params });
  }

  getMedicine(id: string): Observable<MedicineDetailResponse> {
    return this.http.get<MedicineDetailResponse>(`${this.url(this.store.MEDICINES)}/${id}`);
  }

  createMedicine(data: MedicineCreateRequest): Observable<{ medicine: Medicine }> {
    return this.http.post<{ medicine: Medicine }>(this.url(this.store.MEDICINES), data);
  }

  updateMedicine(id: string, data: Partial<MedicineCreateRequest>): Observable<{ medicine: Medicine }> {
    return this.http.put<{ medicine: Medicine }>(`${this.url(this.store.MEDICINES)}/${id}`, data);
  }

  getRacks(): Observable<{ racks: StoreRack[] }> {
    return this.http.get<{ racks: StoreRack[] }>(this.url(this.store.RACKS));
  }

  createRack(data: RackCreateRequest): Observable<{ rack: StoreRack }> {
    return this.http.post<{ rack: StoreRack }>(this.url(this.store.RACKS), data);
  }

  addStock(data: StockAddRequest): Observable<{ stock: StockBatch }> {
    return this.http.post<{ stock: StockBatch }>(this.url(this.store.STOCK.ADD), data);
  }

  removeStock(data: StockRemoveRequest): Observable<{ movement: StockMovement }> {
    return this.http.post<{ movement: StockMovement }>(this.url(this.store.STOCK.REMOVE), data);
  }

  getLowStockAlerts(): Observable<AlertsLowStockResponse> {
    return this.http.get<AlertsLowStockResponse>(this.url(this.store.ALERTS.LOW_STOCK));
  }

  getExpiringAlerts(days = EXPIRING_ALERTS_DEFAULT_DAYS): Observable<AlertsExpiringResponse> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<AlertsExpiringResponse>(this.url(this.store.ALERTS.EXPIRING), { params });
  }

  getMovements(page = DEFAULT_PAGE, pageSize = PAGE_SIZES.MOVEMENTS): Observable<MovementsResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<MovementsResponse>(this.url(this.store.MOVEMENTS), { params });
  }

  getStaffActivity(period = ACTIVITY_PERIODS.TODAY): Observable<StaffActivityResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<StaffActivityResponse>(this.url(this.store.STAFF.ACTIVITY), { params });
  }

  getStaffDetail(staffId: string, period = ACTIVITY_PERIODS.WEEK): Observable<StaffDetailResponse> {
    const params = new HttpParams().set('period', period);
    return this.http.get<StaffDetailResponse>(this.url(this.store.STAFF.DETAIL_ACTIVITY(staffId)), { params });
  }

  getHrStaffList(): Observable<{ staff: StaffHrProfile[] }> {
    return this.http.get<{ staff: StaffHrProfile[] }>(this.url(this.store.HR.STAFF));
  }

  getHrStaff(id: string): Observable<{ staff: StaffHrProfile }> {
    return this.http.get<{ staff: StaffHrProfile }>(this.url(this.store.HR.STAFF_DETAIL(id)));
  }

  updateHrStaff(id: string, data: Partial<StaffHrProfile>): Observable<{ staff: StaffHrProfile }> {
    return this.http.put<{ staff: StaffHrProfile }>(this.url(this.store.HR.STAFF_DETAIL(id)), data);
  }

  generateStaffLetter(id: string): Observable<{ letter: JoiningLetterDoc }> {
    return this.http.post<{ letter: JoiningLetterDoc }>(this.url(this.store.HR.STAFF_LETTER(id)), {});
  }

  getStaffLetter(id: string): Observable<{ letter: JoiningLetterDoc }> {
    return this.http.get<{ letter: JoiningLetterDoc }>(this.url(this.store.HR.STAFF_LETTER(id)));
  }

  getMyPayslip(month: string): Observable<{ payslip: any; history: any[] }> {
    const params = new HttpParams().set('month', month);
    return this.http.get<{ payslip: any; history: any[] }>(this.url(this.store.STAFF.MY_PAYSLIP), { params });
  }

  scanPatient(patientCode: string): Observable<{
    patient: { id: string; name: string; patientCode?: string | null; mobile?: string | null };
    todayDoses: Array<{
      id: string;
      scheduledFor: string;
      status: string;
      medicineName: string;
      strength?: string | null;
      dose?: string | null;
      frequency?: string | null;
      instructions?: string | null;
    }>;
    pendingCount: number;
    prescription?: {
      id: string;
      diagnosis: string;
      items: Array<{
        medicineName: string;
        strength?: string | null;
        dose?: string | null;
        frequency?: string | null;
        duration?: string | null;
        instructions?: string | null;
      }>;
    } | null;
  }> {
    return this.http.get<any>(this.url(this.store.SCAN_PATIENT(patientCode)));
  }

  markDoseGiven(doseId: string): Observable<{ doseEvent: { id: string; status: string }; message: string }> {
    return this.http.post<{ doseEvent: { id: string; status: string }; message: string }>(
      this.url(this.store.SCAN_DOSE_GIVE(doseId)),
      {}
    );
  }

  getStoreExpenses(category?: string): Observable<{ expenses: any[] }> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<{ expenses: any[] }>(this.url(this.store.EXPENSES), { params });
  }

  createStoreExpense(data: {
    category: string;
    description: string;
    vendor?: string;
    billNo?: string;
    amountInPaise: number;
    expenseDate: string;
  }): Observable<{ expense: any }> {
    return this.http.post<{ expense: any }>(this.url(this.store.EXPENSES), data);
  }

  searchPatients(q: string, scope: 'auto' | 'clinic' | 'global' = 'auto') {
    const params = new HttpParams().set('q', q).set('scope', scope);
    return this.http.get<{
      patients: Array<{
        id: string;
        name: string;
        patientCode?: string | null;
        mobile?: string | null;
        email?: string | null;
        homeClinicStore?: { id: string; name: string; code: string } | null;
      }>;
      scopeUsed: 'clinic' | 'global' | 'none';
    }>(this.url(this.store.PATIENTS.SEARCH), { params });
  }

  createPatient(payload: { name: string; mobile?: string; email?: string }) {
    return this.http.post<{
      patient: {
        id: string;
        name: string;
        patientCode?: string | null;
        mobile?: string | null;
      };
    }>(this.url(this.store.PATIENTS.CREATE), payload);
  }

  getPurchaseOrders(status?: string) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<{ orders: any[] }>(this.url(this.store.PURCHASE_ORDERS), { params });
  }

  postPurchaseOrderGrn(
    orderId: string,
    payload: {
      note?: string;
      lines: Array<{
        purchaseOrderLineId: string;
        qtyReceived: number;
        batchNumber: string;
        expiryDate: string;
        purchasePricePerUnit: number;
        sellingPricePerUnit: number;
        manufacturer?: string;
      }>;
    }
  ) {
    return this.http.post<any>(this.url(this.store.PURCHASE_ORDER_GRN(orderId)), payload);
  }

  getStockTransfers(status?: string) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<{ transfers: any[] }>(this.url(this.store.STOCK_TRANSFERS), { params });
  }

  postStockTransferReceive(transferId: string) {
    return this.http.post<any>(this.url(this.store.STOCK_TRANSFER_RECEIVE(transferId)), {});
  }

  getDeliveries(status?: string) {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<{ deliveries: any[] }>(this.url(this.store.DELIVERIES), { params });
  }

  postDelivery(payload: {
    patientId: string;
    deliveryAddress: string;
    deliveryPhone: string;
    notes?: string;
    lines: Array<{ medicineId?: string; label: string; qty: number }>;
  }) {
    return this.http.post<any>(this.url(this.store.DELIVERIES), payload);
  }
}
