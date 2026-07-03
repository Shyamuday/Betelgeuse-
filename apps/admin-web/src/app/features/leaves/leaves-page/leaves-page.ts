import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { AdminApi } from '../../../core/services/admin-api';
import { PAGE_SIZES } from '../../../core/constants/pagination.constants';
import { SEARCH_DEBOUNCE_MS, TOAST_DURATION_MS } from '../../../core/constants/timing.constants';
import { FILTER_ALL } from '../../../shared/constants/filter.constants';
import { EMPLOYEE_TYPE_STAFF_FILTER_OPTIONS, EMPLOYEE_TYPES, type EmployeeType } from '../../hr/constants/employee-type.constants';
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

type AddLeaveForm = {
  employeeType: EmployeeType;
  doctorId: string;
  storeStaffId: string;
  type: typeof DEFAULT_LEAVE_TYPE;
  startDate: string;
  endDate: string;
  reason: string;
};

function emptyAddForm(): AddLeaveForm {
  return {
    employeeType: EMPLOYEE_TYPES.DOCTOR,
    doctorId: '',
    storeStaffId: '',
    type: DEFAULT_LEAVE_TYPE,
    startDate: '',
    endDate: '',
    reason: ''
  };
}

@Component({
  selector: 'app-leaves-page',
  imports: [FormField, DatePipe],
  templateUrl: './leaves-page.html',
  styleUrl: './leaves-page.scss'
})
export class LeavesPage implements OnInit {
  private api = inject(AdminApi);

  leaves = signal<any[]>([]);
  loading = signal(true);
  error = signal('');
  total = signal(0);
  page = signal(1);
  pageSize = PAGE_SIZES.LEAVES;

  statusFilter = signal<string>(FILTER_ALL);
  empTypeFilter = signal<string>(FILTER_ALL);
  modal = signal<'add'|'reject'|null>(null);
  saving = signal(false);
  toast = signal('');
  formError = signal('');
  rejectTarget = signal<any>(null);
  empResults = signal<any[]>([]);
  selectedEmp = signal<any>(null);

  readonly addModel = signal(emptyAddForm());
  readonly addForm = form(this.addModel);
  readonly rejectNoteModel = signal({ note: '' });
  readonly rejectNoteForm = form(this.rejectNoteModel);
  readonly empSearchModel = signal({ q: '' });
  readonly empSearchForm = form(this.empSearchModel);

  statusFilters = [...LEAVE_STATUS_FILTER_OPTIONS];
  typeFilters = [...EMPLOYEE_TYPE_STAFF_FILTER_OPTIONS];
  leaveTypes = LEAVE_TYPES;

  private empSearchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getAdminLeaves({ status: this.statusFilter(), empType: this.empTypeFilter(), page: this.page(), pageSize: this.pageSize })
      .then(r => { this.leaves.set(r.leaves); this.total.set(r.total); this.loading.set(false); })
      .catch(() => { this.loading.set(false); this.error.set('Could not load leave records. Check your connection and try again.'); });
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

  openReject(l: any): void {
    this.rejectTarget.set(l);
    this.rejectNoteModel.set({ note: '' });
    this.modal.set('reject');
  }

  async submitReject(): Promise<void> {
    const note = this.rejectNoteModel().note;
    this.saving.set(true);
    try {
      await this.api.updateAdminLeave(this.rejectTarget()!.id, { status: LEAVE_STATUSES.REJECTED, hrNote: note });
      this.leaves.update(list => list.map(x => x.id === this.rejectTarget()!.id ? { ...x, status: LEAVE_STATUSES.REJECTED, hrNote: note } : x));
      this.modal.set(null);
      this.showToast('Leave rejected');
    } finally { this.saving.set(false); }
  }

  openAdd(): void {
    this.addModel.set(emptyAddForm());
    this.selectedEmp.set(null);
    this.empSearchModel.set({ q: '' });
    this.empResults.set([]);
    this.formError.set('');
    this.modal.set('add');
  }

  searchEmps(): void {
    if (this.empSearchTimer) clearTimeout(this.empSearchTimer);
    const q = this.empSearchModel().q;
    if (q.length < 2) { this.empResults.set([]); return; }
    this.empSearchTimer = setTimeout(() => {
      this.api.getHrEmployees({ q, type: this.addModel().employeeType })
        .then(r => this.empResults.set(r.employees.slice(0, PAGE_SIZES.EMP_SEARCH_RESULTS)))
        .catch(() => {});
    }, SEARCH_DEBOUNCE_MS);
  }

  selectEmp(e: any): void {
    this.selectedEmp.set(e);
    this.empSearchModel.set({ q: e.name });
    this.empResults.set([]);
    if (e.empType === 'DOCTOR') {
      this.addModel.update(form => ({ ...form, doctorId: e.id, storeStaffId: '' }));
    } else {
      this.addModel.update(form => ({ ...form, storeStaffId: e.id, doctorId: '' }));
    }
  }

  async submitAdd(): Promise<void> {
    if (!this.selectedEmp()) { this.formError.set('Please select an employee'); return; }
    const form = this.addModel();
    if (!form.startDate || !form.endDate) { this.formError.set('Start and end dates required'); return; }
    this.saving.set(true);
    try {
      await this.api.createAdminLeave(form);
      this.modal.set(null);
      this.showToast('Leave added ✓');
      this.load();
    } catch (e: any) {
      this.formError.set(e?.error?.error ?? 'Failed to add leave');
    } finally { this.saving.set(false); }
  }

  setAddEmployeeType(type: EmployeeType): void {
    this.addModel.update((form) => ({
      ...form,
      employeeType: type,
      doctorId: '',
      storeStaffId: ''
    }));
    this.selectedEmp.set(null);
    this.empSearchModel.set({ q: '' });
    this.empResults.set([]);
  }

  closeModal(): void { this.modal.set(null); }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
