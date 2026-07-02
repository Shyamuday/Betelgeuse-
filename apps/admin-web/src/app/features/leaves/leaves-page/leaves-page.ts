import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminApi } from '../../../core/services/admin-api';
import { PAGE_SIZES } from '../../../core/constants/pagination.constants';
import { SEARCH_DEBOUNCE_MS, TOAST_DURATION_MS } from '../../../core/constants/timing.constants';
import { FILTER_ALL } from '../../../shared/constants/filter.constants';
import { EMPLOYEE_TYPE_STAFF_FILTER_OPTIONS, EMPLOYEE_TYPES } from '../../hr/constants/employee-type.constants';
import {
  LEAVE_STATUS_FILTER_OPTIONS,
  LEAVE_STATUS_FALLBACK_STYLE,
  LEAVE_STATUS_STYLES,
  LEAVE_STATUSES
} from '../constants/leave-status.constants';
import {
  DEFAULT_LEAVE_TYPE,
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_FALLBACK_COLOR,
  LEAVE_TYPE_FALLBACK_ICON,
  LEAVE_TYPE_ICONS,
  LEAVE_TYPES
} from '../constants/leave-type.constants';

@Component({
  selector: 'app-leaves-page',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="lp">
      <div class="lp-hdr">
        <div>
          <h2 class="lp-title">📋 Leave Management</h2>
          <p class="lp-sub">Approve, reject and record employee leaves</p>
        </div>
        <button class="btn-primary" (click)="openAdd()">+ Add Leave</button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="ftabs">
          @for (f of statusFilters; track f.value) {
            <button class="ftab" [class.active]="statusFilter() === f.value" (click)="setStatus(f.value)">{{ f.label }}</button>
          }
        </div>
        <div class="ftabs">
          @for (f of typeFilters; track f.value) {
            <button class="ftab sm" [class.active]="empTypeFilter() === f.value" (click)="setEmpType(f.value)">{{ f.label }}</button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="leave-list">
          @for (l of leaves(); track l.id) {
            <div class="leave-card">
              <div class="lc-left">
                <div class="emp-av" [class.doc]="l.employeeType === 'DOCTOR'">
                  {{ empName(l).charAt(0).toUpperCase() }}
                </div>
                <div class="lc-info">
                  <div class="lc-name">{{ empName(l) }}</div>
                  <div class="lc-meta">
                    <span class="emp-type" [class.doc]="l.employeeType === 'DOCTOR'">
                      {{ l.employeeType === 'DOCTOR' ? '🩺' : '🏪' }} {{ l.employeeType === 'DOCTOR' ? 'Doctor' : (l.storeStaff?.store?.name ?? 'Staff') }}
                    </span>
                    <span class="leave-type" [style.color]="leaveColor(l.type)">{{ leaveIcon(l.type) }} {{ l.type }}</span>
                  </div>
                  <div class="lc-dates">
                    📅 {{ l.startDate | date:'dd MMM' }} – {{ l.endDate | date:'dd MMM yyyy' }}
                    <span class="days-badge">{{ l.totalDays }} day{{ l.totalDays !== 1 ? 's' : '' }}</span>
                  </div>
                  @if (l.reason) { <div class="lc-reason">"{{ l.reason }}"</div> }
                  @if (l.hrNote) { <div class="lc-note">📝 {{ l.hrNote }}</div> }
                  @if (l.approvedBy) { <div class="lc-by">By: {{ l.approvedBy.name }}</div> }
                </div>
              </div>
              <div class="lc-right">
                <div class="status-badge" [style.background]="statusStyle(l.status).bg" [style.color]="statusStyle(l.status).color">
                  {{ l.status }}
                </div>
                @if (l.status === 'PENDING') {
                  <div class="action-btns">
                    <button class="btn-approve" (click)="approve(l)">✓ Approve</button>
                    <button class="btn-reject" (click)="openReject(l)">✕ Reject</button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
        @if (leaves().length === 0) {
          <div class="empty"><div>📋</div><p>No leaves found for this filter</p></div>
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

    <!-- Add Leave Modal -->
    @if (modal() === 'add') {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="mhdr"><h3>➕ Add Leave Record</h3><button class="close-btn" (click)="closeModal()">✕</button></div>
          <div class="mbody">
            <div class="fg">
              <label>Employee Type</label>
              <div class="toggle-row">
                <button class="tog" [class.active]="addForm.employeeType === 'DOCTOR'" (click)="addForm.employeeType = 'DOCTOR'; addForm.doctorId = ''; addForm.storeStaffId = ''">🩺 Doctor</button>
                <button class="tog" [class.active]="addForm.employeeType === 'STORE_STAFF'" (click)="addForm.employeeType = 'STORE_STAFF'; addForm.doctorId = ''; addForm.storeStaffId = ''">🏪 Store Staff</button>
              </div>
            </div>
            <div class="fg">
              <label>Employee Name (search)</label>
              <input [(ngModel)]="empSearch" (ngModelChange)="searchEmps()" placeholder="Type to search…" />
              @if (empResults().length > 0) {
                <div class="emp-dropdown">
                  @for (e of empResults(); track e.id) {
                    <div class="emp-opt" (click)="selectEmp(e)">
                      {{ e.name }} — {{ e.empType === 'DOCTOR' ? e.specialty : e.storeName }}
                    </div>
                  }
                </div>
              }
              @if (selectedEmp()) {
                <div class="selected-emp">✅ {{ selectedEmp()!.name }}</div>
              }
            </div>
            <div class="fg">
              <label>Leave Type</label>
              <select [(ngModel)]="addForm.type">
                @for (t of leaveTypes; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>
            <div class="frow">
              <div class="fg"><label>Start Date *</label><input type="date" [(ngModel)]="addForm.startDate" /></div>
              <div class="fg"><label>End Date *</label><input type="date" [(ngModel)]="addForm.endDate" /></div>
            </div>
            <div class="fg"><label>Reason</label><textarea [(ngModel)]="addForm.reason" rows="2" placeholder="Reason for leave…"></textarea></div>
          </div>
          <div class="mfooter">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="submitAdd()">{{ saving() ? 'Adding…' : 'Add Leave' }}</button>
          </div>
          @if (formError()) { <div class="ferr">⚠️ {{ formError() }}</div> }
        </div>
      </div>
    }

    <!-- Reject Modal -->
    @if (modal() === 'reject') {
      <div class="overlay" (click)="closeModal()">
        <div class="modal sm" (click)="$event.stopPropagation()">
          <div class="mhdr"><h3>✕ Reject Leave — {{ empName(rejectTarget()!) }}</h3><button class="close-btn" (click)="closeModal()">✕</button></div>
          <div class="mbody">
            <div class="fg"><label>Reason / HR Note (optional)</label><textarea [(ngModel)]="rejectNote" rows="3" placeholder="Reason for rejection…"></textarea></div>
          </div>
          <div class="mfooter">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-reject-confirm" [disabled]="saving()" (click)="submitReject()">{{ saving() ? 'Rejecting…' : 'Confirm Reject' }}</button>
          </div>
        </div>
      </div>
    }

    @if (toast()) { <div class="toast">{{ toast() }}</div> }
  `,
  styles: [`
    .lp { padding: 24px; max-width: 900px; margin: 0 auto; color: white; }
    .lp-hdr { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
    .lp-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
    .lp-sub { font-size: 13px; color: #64748b; margin: 0; }

    .filters { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .ftabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .ftab { padding: 7px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; &.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #a5b4fc; } &.sm { padding: 5px 11px; font-size: 11px; } }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .leave-list { display: flex; flex-direction: column; gap: 10px; }
    .leave-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px 16px; display: flex; align-items: flex-start; gap: 14px; }
    .lc-left { display: flex; gap: 12px; flex: 1; min-width: 0; }
    .emp-av { width: 40px; height: 40px; border-radius: 12px; background: rgba(8,145,178,0.15); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; color: #06b6d4; flex-shrink: 0; &.doc { background: rgba(99,102,241,0.15); color: #a5b4fc; } }
    .lc-info { flex: 1; }
    .lc-name { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
    .lc-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 5px; }
    .emp-type { font-size: 11px; color: #64748b; background: rgba(255,255,255,0.05); padding: 1px 7px; border-radius: 5px; &.doc { color: #a5b4fc; } }
    .leave-type { font-size: 11px; font-weight: 700; }
    .lc-dates { font-size: 12px; color: #94a3b8; margin-bottom: 4px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .days-badge { padding: 1px 7px; border-radius: 5px; background: rgba(99,102,241,0.1); color: #a5b4fc; font-size: 11px; font-weight: 700; }
    .lc-reason { font-size: 12px; color: #64748b; font-style: italic; margin-top: 3px; }
    .lc-note { font-size: 11px; color: #94a3b8; background: rgba(255,255,255,0.03); border-radius: 6px; padding: 3px 8px; margin-top: 3px; }
    .lc-by { font-size: 11px; color: #475569; margin-top: 2px; }
    .lc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
    .status-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; white-space: nowrap; }
    .action-btns { display: flex; flex-direction: column; gap: 5px; }
    .btn-approve { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(74,222,128,0.3); background: rgba(74,222,128,0.08); color: #4ade80; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-reject { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(248,113,113,0.3); background: rgba(248,113,113,0.08); color: #f87171; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }

    .empty { text-align: center; padding: 60px; color: #64748b; }
    .empty div { font-size: 40px; margin-bottom: 10px; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; font-size: 13px; color: #94a3b8; }
    .pagination button { padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #94a3b8; cursor: pointer; &:disabled { opacity: 0.3; cursor: default; } }

    .btn-primary { padding: 10px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; &:disabled { opacity: 0.5; } }
    .btn-ghost { padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .btn-reject-confirm { padding: 10px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#dc2626,#b91c1c); color: white; font-size: 13px; font-weight: 700; cursor: pointer; &:disabled { opacity: 0.5; } }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #0f1623; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 440px; max-height: 88vh; overflow-y: auto; animation: popIn 0.2s ease; &.sm { max-width: 380px; } }
    @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .mhdr { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .mhdr h3 { font-size: 14px; font-weight: 800; margin: 0; }
    .close-btn { width: 26px; height: 26px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; }
    .mbody { padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; }
    .mfooter { padding: 12px 18px; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07); }
    .ferr { margin: 0 18px 14px; padding: 9px 12px; border-radius: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; font-size: 12px; }
    .fg { display: flex; flex-direction: column; gap: 5px; }
    .frow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    label { font-size: 12px; color: #94a3b8; font-weight: 600; }
    input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 11px; color: white; font-size: 13px; outline: none; &:focus { border-color: rgba(99,102,241,0.5); } option { background: #1e293b; } }
    textarea { resize: vertical; min-height: 54px; }
    .toggle-row { display: flex; gap: 8px; }
    .tog { flex: 1; padding: 9px; border-radius: 9px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; &.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #a5b4fc; } }
    .emp-dropdown { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; overflow: hidden; margin-top: -8px; }
    .emp-opt { padding: 9px 12px; font-size: 13px; cursor: pointer; color: #e2e8f0; &:hover { background: rgba(99,102,241,0.1); } }
    .selected-emp { font-size: 13px; color: #4ade80; font-weight: 600; padding: 4px 0; }
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 600; }
  `]
})
export class LeavesPage implements OnInit {
  private api = inject(AdminApi);

  leaves = signal<any[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  pageSize = PAGE_SIZES.LEAVES;

  statusFilter = signal(FILTER_ALL);
  empTypeFilter = signal(FILTER_ALL);
  modal = signal<'add'|'reject'|null>(null);
  saving = signal(false);
  toast = signal('');
  formError = signal('');
  rejectNote = '';
  rejectTarget = signal<any>(null);
  empSearch = '';
  empResults = signal<any[]>([]);
  selectedEmp = signal<any>(null);

  addForm: any = {
    employeeType: EMPLOYEE_TYPES.DOCTOR,
    doctorId: '',
    storeStaffId: '',
    type: DEFAULT_LEAVE_TYPE,
    startDate: '',
    endDate: '',
    reason: ''
  };

  statusFilters = [...LEAVE_STATUS_FILTER_OPTIONS];
  typeFilters = [...EMPLOYEE_TYPE_STAFF_FILTER_OPTIONS];
  leaveTypes = LEAVE_TYPES;

  private empSearchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getAdminLeaves({ status: this.statusFilter(), empType: this.empTypeFilter(), page: this.page(), pageSize: this.pageSize })
      .then(r => { this.leaves.set(r.leaves); this.total.set(r.total); this.loading.set(false); })
      .catch(() => this.loading.set(false));
  }

  setStatus(v: string): void { this.statusFilter.set(v); this.page.set(1); this.load(); }
  setEmpType(v: string): void { this.empTypeFilter.set(v); this.page.set(1); this.load(); }
  prevPage(): void { if (this.page() > 1) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void { if (this.page() < this.totalPages()) { this.page.update(p => p + 1); this.load(); } }
  totalPages(): number { return Math.ceil(this.total() / this.pageSize); }

  empName(l: any): string {
    return l.doctor?.user?.name ?? l.storeStaff?.name ?? 'Unknown';
  }
  leaveColor(t: string): string { return LEAVE_TYPE_COLORS[t as keyof typeof LEAVE_TYPE_COLORS] ?? LEAVE_TYPE_FALLBACK_COLOR; }
  leaveIcon(t: string): string { return LEAVE_TYPE_ICONS[t as keyof typeof LEAVE_TYPE_ICONS] ?? LEAVE_TYPE_FALLBACK_ICON; }
  statusStyle(s: string): {bg:string,color:string} { return LEAVE_STATUS_STYLES[s as keyof typeof LEAVE_STATUS_STYLES] ?? LEAVE_STATUS_FALLBACK_STYLE; }

  async approve(l: any): Promise<void> {
    await this.api.updateAdminLeave(l.id, { status: LEAVE_STATUSES.APPROVED });
    this.leaves.update(list => list.map(x => x.id === l.id ? { ...x, status: LEAVE_STATUSES.APPROVED } : x));
    this.showToast('Leave approved ✓');
  }

  openReject(l: any): void { this.rejectTarget.set(l); this.rejectNote = ''; this.modal.set('reject'); }

  async submitReject(): Promise<void> {
    this.saving.set(true);
    try {
      await this.api.updateAdminLeave(this.rejectTarget()!.id, { status: LEAVE_STATUSES.REJECTED, hrNote: this.rejectNote });
      this.leaves.update(list => list.map(x => x.id === this.rejectTarget()!.id ? { ...x, status: LEAVE_STATUSES.REJECTED, hrNote: this.rejectNote } : x));
      this.modal.set(null);
      this.showToast('Leave rejected');
    } finally { this.saving.set(false); }
  }

  openAdd(): void {
    this.addForm = {
      employeeType: EMPLOYEE_TYPES.DOCTOR,
      doctorId: '',
      storeStaffId: '',
      type: DEFAULT_LEAVE_TYPE,
      startDate: '',
      endDate: '',
      reason: ''
    };
    this.selectedEmp.set(null);
    this.empSearch = '';
    this.empResults.set([]);
    this.formError.set('');
    this.modal.set('add');
  }

  searchEmps(): void {
    if (this.empSearchTimer) clearTimeout(this.empSearchTimer);
    if (this.empSearch.length < 2) { this.empResults.set([]); return; }
    this.empSearchTimer = setTimeout(() => {
      this.api.getHrEmployees({ q: this.empSearch, type: this.addForm.employeeType })
        .then(r => this.empResults.set(r.employees.slice(0, PAGE_SIZES.EMP_SEARCH_RESULTS)))
        .catch(() => {});
    }, SEARCH_DEBOUNCE_MS);
  }

  selectEmp(e: any): void {
    this.selectedEmp.set(e);
    this.empSearch = e.name;
    this.empResults.set([]);
    if (e.empType === 'DOCTOR') { this.addForm.doctorId = e.id; this.addForm.storeStaffId = ''; }
    else { this.addForm.storeStaffId = e.id; this.addForm.doctorId = ''; }
  }

  async submitAdd(): Promise<void> {
    if (!this.selectedEmp()) { this.formError.set('Please select an employee'); return; }
    if (!this.addForm.startDate || !this.addForm.endDate) { this.formError.set('Start and end dates required'); return; }
    this.saving.set(true);
    try {
      await this.api.createAdminLeave(this.addForm);
      this.modal.set(null);
      this.showToast('Leave added ✓');
      this.load();
    } catch (e: any) {
      this.formError.set(e?.error?.error ?? 'Failed to add leave');
    } finally { this.saving.set(false); }
  }

  closeModal(): void { this.modal.set(null); }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
