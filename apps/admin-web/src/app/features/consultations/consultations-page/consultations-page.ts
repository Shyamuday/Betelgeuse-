import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminApi } from '../../../core/services/admin-api';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: 'rgba(251,146,60,0.12)',  color: '#fb923c' },
  ACTIVE:    { bg: 'rgba(99,102,241,0.12)',   color: '#a5b4fc' },
  COMPLETED: { bg: 'rgba(74,222,128,0.12)',   color: '#4ade80' },
  CANCELLED: { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8' }
};
const PAYMENT_STYLES: Record<string, { bg: string; color: string }> = {
  CREATED:   { bg: 'rgba(251,146,60,0.1)', color: '#fb923c' },
  PAID:      { bg: 'rgba(74,222,128,0.1)', color: '#4ade80' },
  FAILED:    { bg: 'rgba(248,113,113,0.1)',color: '#f87171' },
  REFUNDED:  { bg: 'rgba(148,163,184,0.1)',color: '#94a3b8' }
};

@Component({
  selector: 'app-consultations-page',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="cp">
      <div class="cp-hdr">
        <div>
          <h2 class="cp-title">🩺 Consultation Queue</h2>
          <p class="cp-sub">Assign unassigned consultations to available doctors</p>
        </div>
        <div class="hdr-stats">
          <div class="stat-pill unassigned">{{ unassignedCount() }} Unassigned</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <input class="search" [(ngModel)]="q" (ngModelChange)="onSearch()" placeholder="🔍 Search by patient or disease…" />
        <div class="ftabs">
          @for (f of statusFilters; track f.value) {
            <button class="ftab" [class.active]="statusFilter() === f.value" (click)="setStatus(f.value)">{{ f.label }}</button>
          }
        </div>
        <div class="ftabs">
          @for (f of assignedFilters; track f.value) {
            <button class="ftab sm" [class.active]="assignedFilter() === f.value" (click)="setAssigned(f.value)">{{ f.label }}</button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="table-wrap">
          <table class="ct">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Disease</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Created</th>
                <th>Assigned Doctor</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              @for (c of consultations(); track c.id) {
                <tr [class.unassigned-row]="!c.assignedDoctor">
                  <td>
                    <div class="pat-name">{{ c.patient?.name ?? '—' }}</div>
                    @if (c.patient?.mobile) { <div class="pat-mobile">{{ c.patient.mobile }}</div> }
                  </td>
                  <td><span class="disease-pill">{{ c.disease?.name ?? '—' }}</span></td>
                  <td>
                    <span class="status-badge" [style.background]="ss(c.status).bg" [style.color]="ss(c.status).color">
                      {{ c.status }}
                    </span>
                  </td>
                  <td>
                    @if (c.payment) {
                      <span class="pay-badge" [style.background]="ps(c.payment.status).bg" [style.color]="ps(c.payment.status).color">
                        {{ c.payment.status }}
                      </span>
                      <div class="pay-amt">₹{{ (c.payment.amountInPaise / 100).toFixed(0) }}</div>
                    }
                  </td>
                  <td><span class="date-txt">{{ c.createdAt | date:'dd MMM yy, h:mm a' }}</span></td>
                  <td>
                    @if (c.assignedDoctor) {
                      <div class="doc-assigned">✓ {{ c.assignedDoctor.name }}</div>
                    } @else {
                      <span class="unassigned-txt">Not assigned</span>
                    }
                  </td>
                  <td>
                    @if (!c.assignedDoctor || c.status === 'PENDING') {
                      <button class="btn-assign" (click)="openAssign(c)">Assign</button>
                    } @else {
                      <button class="btn-reassign" (click)="openAssign(c)">Reassign</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (consultations().length === 0) {
          <div class="empty"><div>🩺</div><p>No consultations match these filters</p></div>
        }
        @if (total() > pageSize) {
          <div class="pagination">
            <button [disabled]="page() <= 1" (click)="prevPage()">‹ Prev</button>
            <span>Page {{ page() }} of {{ totalPages() }}</span>
            <button [disabled]="page() >= totalPages()" (click)="nextPage()">Next ›</button>
          </div>
        }
      }
    </div>

    <!-- Assign Modal -->
    @if (modal() && selectedConsult()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="mhdr">
            <div>
              <h3>Assign Doctor</h3>
              <p class="mhdr-sub">{{ selectedConsult()!.patient?.name }} — {{ selectedConsult()!.disease?.name }}</p>
            </div>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="mbody">
            @if (doctorsLoading()) {
              <div class="loading"><div class="spinner"></div></div>
            } @else {
              <input class="search" [(ngModel)]="doctorQ" (ngModelChange)="filterDoctors()" placeholder="🔍 Filter doctors…" style="margin-bottom:10px" />
              <div class="doc-list">
                @for (d of filteredDoctors(); track d.id) {
                  <div class="doc-item" [class.selected]="selectedDoctorId() === d.id" (click)="selectedDoctorId.set(d.id)">
                    <div class="doc-av">{{ d.name.charAt(0).toUpperCase() }}</div>
                    <div class="doc-info">
                      <div class="doc-name">{{ d.name }}</div>
                      @if (d.doctorProfile?.specialty) {
                        <div class="doc-spec">{{ d.doctorProfile.specialty }}</div>
                      }
                    </div>
                    @if (selectedDoctorId() === d.id) { <span class="check">✓</span> }
                  </div>
                }
                @if (filteredDoctors().length === 0) {
                  <div class="empty-sm">No doctors found</div>
                }
              </div>
            }
          </div>
          <div class="mfooter">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="!selectedDoctorId() || saving()" (click)="confirmAssign()">
              {{ saving() ? 'Assigning…' : 'Confirm Assignment' }}
            </button>
          </div>
          @if (err()) { <div class="ferr">⚠️ {{ err() }}</div> }
        </div>
      </div>
    }

    @if (toast()) { <div class="toast">{{ toast() }}</div> }
  `,
  styles: [`
    .cp { padding: 24px; max-width: 1100px; margin: 0 auto; color: white; }
    .cp-hdr { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
    .cp-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
    .cp-sub { font-size: 13px; color: #64748b; margin: 0; }
    .hdr-stats { display: flex; gap: 8px; align-items: flex-start; }
    .stat-pill { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; &.unassigned { background: rgba(251,146,60,0.12); color: #fb923c; } }
    .filters { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .search { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: white; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; &:focus { border-color: rgba(99,102,241,0.4); } }
    .ftabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .ftab { padding: 7px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; &.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #a5b4fc; } &.sm { padding: 5px 11px; font-size: 11px; } }
    .loading { text-align: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .table-wrap { overflow-x: auto; }
    .ct { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ct th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .ct td { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
    .ct tr:hover td { background: rgba(255,255,255,0.02); }
    .ct tr.unassigned-row td { background: rgba(251,146,60,0.03); }
    .pat-name { font-weight: 600; margin-bottom: 2px; }
    .pat-mobile { font-size: 11px; color: #64748b; }
    .disease-pill { padding: 3px 8px; border-radius: 6px; background: rgba(139,92,246,0.12); color: #c4b5fd; font-size: 11px; font-weight: 600; }
    .status-badge { padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 800; }
    .pay-badge { padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 700; }
    .pay-amt { font-size: 11px; color: #64748b; margin-top: 2px; }
    .date-txt { font-size: 12px; color: #64748b; }
    .doc-assigned { font-size: 12px; color: #4ade80; font-weight: 600; }
    .unassigned-txt { font-size: 12px; color: #fb923c; font-style: italic; }
    .btn-assign { padding: 6px 14px; border-radius: 8px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-reassign { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(99,102,241,0.3); background: transparent; color: #a5b4fc; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .empty { text-align: center; padding: 60px; color: #64748b; }
    .empty > div:first-child { font-size: 40px; margin-bottom: 10px; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; font-size: 13px; color: #94a3b8; }
    .pagination button { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #94a3b8; cursor: pointer; &:disabled { opacity: 0.3; cursor: default; } }
    .btn-primary { padding: 10px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 13px; font-weight: 700; cursor: pointer; &:disabled { opacity: 0.5; } }
    .btn-ghost { padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #0f1623; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 440px; max-height: 88vh; overflow-y: auto; animation: popIn 0.2s ease; }
    @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .mhdr { display: flex; align-items: flex-start; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .mhdr h3 { font-size: 14px; font-weight: 800; margin: 0 0 3px; }
    .mhdr-sub { font-size: 12px; color: #64748b; margin: 0; }
    .close-btn { width: 26px; height: 26px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
    .mbody { padding: 14px 18px; }
    .mfooter { padding: 12px 18px; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07); }
    .ferr { margin: 0 18px 14px; padding: 9px 12px; border-radius: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; font-size: 12px; }
    .doc-list { display: flex; flex-direction: column; gap: 6px; max-height: 300px; overflow-y: auto; }
    .doc-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.07); cursor: pointer; transition: all 0.15s; &:hover { background: rgba(255,255,255,0.04); } &.selected { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.4); } }
    .doc-av { width: 34px; height: 34px; border-radius: 10px; background: rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #a5b4fc; flex-shrink: 0; }
    .doc-info { flex: 1; }
    .doc-name { font-size: 13px; font-weight: 700; }
    .doc-spec { font-size: 11px; color: #64748b; }
    .check { color: #4ade80; font-weight: 800; }
    .empty-sm { text-align: center; padding: 20px; color: #64748b; font-size: 13px; }
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 600; }
  `]
})
export class ConsultationsPage implements OnInit {
  private api = inject(AdminApi);

  consultations = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = 20;
  unassignedCount = signal(0);

  statusFilter = signal('');
  assignedFilter = signal('no');
  q = '';

  modal = signal(false);
  selectedConsult = signal<any>(null);
  doctors = signal<any[]>([]);
  filteredDoctors = signal<any[]>([]);
  doctorsLoading = signal(false);
  selectedDoctorId = signal<string>('');
  doctorQ = '';
  saving = signal(false);
  err = signal('');
  toast = signal('');

  statusFilters = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Completed', value: 'COMPLETED' }
  ];
  assignedFilters = [
    { label: 'All', value: '' },
    { label: 'Unassigned', value: 'no' },
    { label: 'Assigned', value: 'yes' }
  ];

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.load(); this.loadUnassignedCount(); }

  load(): void {
    this.loading.set(true);
    this.api.getAdminConsultations({ status: this.statusFilter(), assigned: this.assignedFilter(), q: this.q, page: this.page(), pageSize: this.pageSize })
      .then(r => { this.consultations.set(r.consultations); this.total.set(r.total); this.loading.set(false); })
      .catch(() => this.loading.set(false));
  }

  loadUnassignedCount(): void {
    this.api.getAdminConsultations({ assigned: 'no', status: 'PENDING', pageSize: 1 })
      .then(r => this.unassignedCount.set(r.total))
      .catch(() => {});
  }

  onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 300);
  }

  setStatus(v: string): void { this.statusFilter.set(v); this.page.set(1); this.load(); }
  setAssigned(v: string): void { this.assignedFilter.set(v); this.page.set(1); this.load(); }
  prevPage(): void { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
  totalPages(): number { return Math.ceil(this.total() / this.pageSize); }

  ss(s: string): { bg: string; color: string } { return STATUS_STYLES[s] ?? { bg: 'rgba(255,255,255,0.06)', color: '#94a3b8' }; }
  ps(s: string): { bg: string; color: string } { return PAYMENT_STYLES[s] ?? { bg: 'rgba(255,255,255,0.06)', color: '#94a3b8' }; }

  openAssign(c: any): void {
    this.selectedConsult.set(c);
    this.selectedDoctorId.set(c.assignedDoctor?.id ?? '');
    this.doctorQ = '';
    this.err.set('');
    this.modal.set(true);
    if (this.doctors().length === 0) {
      this.doctorsLoading.set(true);
      this.api.getActiveDoctors()
        .then(r => {
          this.doctors.set(r.doctors);
          this.filteredDoctors.set(r.doctors);
          this.doctorsLoading.set(false);
        })
        .catch(() => this.doctorsLoading.set(false));
    } else {
      this.filterDoctors();
    }
  }

  filterDoctors(): void {
    const q = this.doctorQ.toLowerCase();
    this.filteredDoctors.set(
      q ? this.doctors().filter(d => d.name.toLowerCase().includes(q)) : this.doctors()
    );
  }

  closeModal(): void { this.modal.set(false); }

  async confirmAssign(): Promise<void> {
    if (!this.selectedDoctorId() || !this.selectedConsult()) return;
    this.saving.set(true);
    this.err.set('');
    try {
      const r = await this.api.assignConsultationDoctor(this.selectedConsult()!.id, this.selectedDoctorId());
      this.consultations.update(list =>
        list.map(c => c.id === this.selectedConsult()!.id ? { ...c, assignedDoctor: r.consultation.assignedDoctor, status: r.consultation.status } : c)
      );
      this.modal.set(false);
      this.loadUnassignedCount();
      this.showToast('Doctor assigned ✓');
    } catch (e: any) {
      this.err.set(e?.error?.message ?? 'Assignment failed');
    } finally {
      this.saving.set(false);
    }
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
