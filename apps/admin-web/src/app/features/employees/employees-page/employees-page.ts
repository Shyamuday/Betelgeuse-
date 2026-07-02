import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminApi } from '../../../core/services/admin-api';
import { SEARCH_DEBOUNCE_MS, TOAST_DURATION_MS } from '../../../core/constants/timing.constants';
import { PAISE_PER_RUPEE } from '../../../shared/constants/currency.constants';
import { FILTER_ALL } from '../../../shared/constants/filter.constants';
import {
  DEFAULT_EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_COLORS,
  EMPLOYEE_STATUS_FALLBACK_COLOR,
  EMPLOYEE_STATUS_FILTER_OPTIONS,
  type EmployeeStatus
} from '../../hr/constants/employee-status.constants';
import { EMPLOYEE_TYPE_FILTER_OPTIONS } from '../../hr/constants/employee-type.constants';
import { DEFAULT_CLINIC_NAME } from '../../hr/constants/organization.constants';
import {
  DEFAULT_WORK_SHIFT,
  WEEK_DAYS,
  WORK_SHIFT_LABELS,
  type WorkShift
} from '../../hr/constants/shift.constants';

@Component({
  selector: 'app-employees-page',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="ep">
      <div class="ep-hdr">
        <div>
          <h2 class="ep-title">👥 Employee Directory</h2>
          <p class="ep-sub">All doctors and store staff — HR profiles, shifts & joining letters</p>
        </div>
      </div>

      <!-- Search + Filters -->
      <div class="filters">
        <input class="search" [(ngModel)]="q" (ngModelChange)="onSearch()" placeholder="🔍 Search by name…" />
        <div class="filter-tabs">
          @for (f of filters; track f.value) {
            <button class="ftab" [class.active]="activeFilter() === f.value" (click)="setFilter(f.value)">{{ f.label }}</button>
          }
        </div>
        <div class="filter-tabs">
          @for (s of statusFilters; track s.value) {
            <button class="ftab sm" [class.active]="activeStatus() === s.value" (click)="setStatus(s.value)">{{ s.label }}</button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="emp-count">{{ employees().length }} employees</div>
        <div class="emp-grid">
          @for (e of employees(); track e.id) {
            <div class="emp-card" (click)="open(e)">
              <div class="emp-av" [class.doc]="e.empType === 'DOCTOR'">
                {{ e.name.charAt(0).toUpperCase() }}
              </div>
              <div class="emp-body">
                <div class="emp-name">{{ e.name }}</div>
                <div class="emp-desg">{{ e.designation ?? '—' }}</div>
                <div class="emp-meta">
                  <span class="type-badge" [class.doc]="e.empType === 'DOCTOR'">
                    {{ e.empType === 'DOCTOR' ? '🩺 Doctor' : '🏪 Staff' }}
                  </span>
                  <span class="status-dot" [style.color]="statusColor(e.employeeStatus)">● {{ e.employeeStatus }}</span>
                </div>
                @if (e.empType === 'DOCTOR') {
                  <div class="online-row">
                    @if (e.isOnline) { <span class="online-chip">🌐 Online</span> }
                    @else if (e.clinicStore) { <span class="loc-chip">📍 {{ e.clinicStore.name }}</span> }
                  </div>
                } @else {
                  <div class="store-row">🏪 {{ e.storeName }}</div>
                }
                @if (e.joiningDate) {
                  <div class="joining-chip">Joined {{ e.joiningDate | date:'dd MMM yyyy' }}</div>
                }
              </div>
              @if (e.hasLetter) { <div class="letter-badge">📄</div> }
            </div>
          }
        </div>
        @if (employees().length === 0) {
          <div class="empty"><div>👥</div><p>No employees found</p></div>
        }
      }
    </div>

    <!-- Drawer -->
    @if (drawerOpen() && selected()) {
      <div class="overlay" (click)="close()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="dh">
            <div class="dh-av" [class.doc]="selected()!.empType === 'DOCTOR'">
              {{ selected()!.name.charAt(0).toUpperCase() }}
            </div>
            <div class="dh-info">
              <div class="dh-name">{{ selected()!.name }}</div>
              <div class="dh-sub">{{ selected()!.empType === 'DOCTOR' ? '🩺 Doctor' : '🏪 ' + selected()!.storeName }}</div>
            </div>
            <div class="dh-tabs">
              <button [class.active]="tab() === 'profile'" (click)="tab.set('profile')">Profile</button>
              <button [class.active]="tab() === 'shift'" (click)="tab.set('shift')">Shift</button>
              @if (selected()!.empType === 'DOCTOR') {
                <button [class.active]="tab() === 'assign'" (click)="tab.set('assign')">Assign</button>
              }
              <button [class.active]="tab() === 'letter'" (click)="openLetter()">Letter</button>
            </div>
            <button class="close-btn" (click)="close()">✕</button>
          </div>

          <!-- Profile Tab -->
          @if (tab() === 'profile') {
            <div class="form-body">
              <div class="fsect">
                <div class="ftitle">Employment</div>
                <div class="frow">
                  <div class="fg"><label>Employee ID</label><input [(ngModel)]="form.employeeId" placeholder="EMP-001" /></div>
                  <div class="fg">
                    <label>Status</label>
                    <select [(ngModel)]="form.employeeStatus">
                      <option value="ACTIVE">Active</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="RESIGNED">Resigned</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  </div>
                </div>
                <div class="frow">
                  <div class="fg"><label>Designation</label><input [(ngModel)]="form.designation" /></div>
                  <div class="fg"><label>Department</label><input [(ngModel)]="form.department" /></div>
                </div>
                <div class="frow">
                  <div class="fg"><label>Joining Date</label><input type="date" [(ngModel)]="form.joiningDate" /></div>
                  <div class="fg"><label>Probation End</label><input type="date" [(ngModel)]="form.probationEndDate" /></div>
                </div>
                <div class="fg full"><label>Salary (₹/month)</label><input type="number" [(ngModel)]="salaryDisplay" /></div>
              </div>
              <div class="fsect">
                <div class="ftitle">Contact</div>
                <div class="frow">
                  <div class="fg"><label>Phone</label><input [(ngModel)]="form.phone" /></div>
                  <div class="fg"><label>Email</label><input [(ngModel)]="form.email" /></div>
                </div>
                <div class="fg full"><label>Address</label><textarea [(ngModel)]="form.address" rows="2"></textarea></div>
                <div class="frow">
                  <div class="fg"><label>Emergency Contact</label><input [(ngModel)]="form.emergencyContact" /></div>
                  <div class="fg"><label>Emergency Phone</label><input [(ngModel)]="form.emergencyPhone" /></div>
                </div>
              </div>
              <button class="btn-save" [disabled]="saving()" (click)="saveProfile()">
                {{ saving() ? 'Saving…' : '💾 Save Profile' }}
              </button>
            </div>
          }

          <!-- Shift Tab -->
          @if (tab() === 'shift') {
            <div class="form-body">
              <div class="fsect">
                <div class="ftitle">Work Shift</div>
                <div class="shift-grid">
                  @for (s of shifts; track s.value) {
                    <button class="shift-btn" [class.active]="form.workShift === s.value" (click)="form.workShift = s.value">{{ s.label }}</button>
                  }
                </div>
                <div class="frow" style="margin-top:12px">
                  <div class="fg"><label>Start Time</label><input type="time" [(ngModel)]="form.shiftStart" /></div>
                  <div class="fg"><label>End Time</label><input type="time" [(ngModel)]="form.shiftEnd" /></div>
                </div>
                <div class="fg full" style="margin-top:10px">
                  <label>Weekly Off Days</label>
                  <div class="days-grid">
                    @for (d of days; track d) {
                      <button class="day-btn" [class.active]="isOff(d)" (click)="toggleOff(d)">{{ d.slice(0,3) }}</button>
                    }
                  </div>
                </div>
              </div>
              <button class="btn-save" [disabled]="saving()" (click)="saveProfile()">
                {{ saving() ? 'Saving…' : '💾 Save Shift' }}
              </button>
            </div>
          }

          <!-- Assignment Tab (Doctor only) -->
          @if (tab() === 'assign' && selected()!.empType === 'DOCTOR') {
            <div class="form-body">
              <div class="fsect">
                <div class="ftitle">Doctor Assignment</div>
                <div class="assign-toggle">
                  <button class="assign-btn" [class.active]="assignOnline()" (click)="assignOnline.set(true)">🌐 Online (Telemedicine)</button>
                  <button class="assign-btn" [class.active]="!assignOnline()" (click)="assignOnline.set(false)">📍 Location-Based</button>
                </div>
                @if (!assignOnline()) {
                  <div class="fg" style="margin-top:12px">
                    <label>Assign to Store/Clinic</label>
                    @if (storesLoading()) { <div class="loading-sm">Loading stores…</div> }
                    @else {
                      <select [(ngModel)]="assignStoreId">
                        <option value="">— Select Store —</option>
                        @for (s of stores(); track s.id) {
                          <option [value]="s.id">{{ s.name }} ({{ s.code }})</option>
                        }
                      </select>
                    }
                  </div>
                }
              </div>
              <div class="assign-info">
                @if (assignOnline()) {
                  <p>This doctor will be available for online consultations across all locations.</p>
                } @else {
                  <p>This doctor will only handle patients at their assigned clinic store.</p>
                }
              </div>
              <button class="btn-save" [disabled]="saving()" (click)="saveAssignment()">
                {{ saving() ? 'Saving…' : '💾 Save Assignment' }}
              </button>
            </div>
          }

          <!-- Letter Tab -->
          @if (tab() === 'letter') {
            <div class="form-body">
              @if (letterLoading()) {
                <div class="loading"><div class="spinner"></div></div>
              } @else if (letter()) {
                <div class="letter-preview">
                  <div class="letter-doc">
                    <div class="ld-top">
                      <div class="ld-org">{{ letter()!['storeName'] ?? letter()!['organizationName'] ?? defaultClinicName }}</div>
                      <div class="ld-addr">{{ letter()!['storeAddress'] ?? letter()!['organizationAddress'] }}</div>
                    </div>
                    <div class="ld-meta">
                      <span><strong>Ref:</strong> {{ letter()!['letterNumber'] }}</span>
                      <span><strong>Date:</strong> {{ letter()!['issuedDate'] | date:'dd MMM yyyy' }}</span>
                    </div>
                    <div class="ld-subject">APPOINTMENT / JOINING LETTER</div>
                    <p>Dear <strong>{{ letter()!['employeeName'] }}</strong>,</p>
                    <p>We are pleased to appoint you as <strong>{{ letter()!['designation'] }}</strong> in <strong>{{ letter()!['department'] }}</strong>, effective <strong>{{ letter()!['joiningDate'] | date:'dd MMMM yyyy' }}</strong>.</p>
                    <table class="ld-table">
                      <tr><td>Employee Code</td><td>{{ letter()!['employeeCode'] }}</td></tr>
                      <tr><td>Designation</td><td>{{ letter()!['designation'] }}</td></tr>
                      <tr><td>Department</td><td>{{ letter()!['department'] }}</td></tr>
                      <tr><td>Salary</td><td>{{ letter()!['salary'] }}</td></tr>
                      <tr><td>Working Hours</td><td>{{ letter()!['shift'] }}</td></tr>
                      <tr><td>Weekly Off</td><td>{{ letter()!['weeklyOff'] }}</td></tr>
                    </table>
                    <div class="ld-sign">
                      <div><div class="sline"></div><div class="slbl">Authorised Signatory</div></div>
                      <div><div class="sline"></div><div class="slbl">Employee Acceptance</div></div>
                    </div>
                  </div>
                </div>
                <div class="letter-actions">
                  <button class="btn-sec" (click)="regen()">🔄 Re-generate</button>
                  <button class="btn-save" (click)="print()">🖨️ Print / PDF</button>
                </div>
              } @else {
                <div class="no-letter">
                  <p>No joining letter generated yet.</p>
                  <button class="btn-save" (click)="generate()">✨ Generate Letter</button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
    @if (toast()) { <div class="toast">{{ toast() }}</div> }
  `,
  styles: [`
    .ep { padding: 24px; max-width: 1000px; margin: 0 auto; color: white; }
    .ep-hdr { margin-bottom: 20px; }
    .ep-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
    .ep-sub { font-size: 13px; color: #64748b; margin: 0; }

    .filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
    .search { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; color: white; font-size: 14px; outline: none; width: 100%; box-sizing: border-box; &:focus { border-color: rgba(99,102,241,0.4); } }
    .filter-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .ftab { padding: 7px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; &.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #a5b4fc; } &.sm { padding: 5px 11px; font-size: 11px; } }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .emp-count { font-size: 13px; color: #64748b; margin-bottom: 12px; }
    .emp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 12px; }

    .emp-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px;
      padding: 14px; cursor: pointer; transition: all 0.2s; position: relative; display: flex; gap: 12px;
      &:hover { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.25); }
    }
    .emp-av { width: 44px; height: 44px; border-radius: 13px; background: rgba(8,145,178,0.15); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #06b6d4; flex-shrink: 0; &.doc { background: rgba(99,102,241,0.15); color: #a5b4fc; } }
    .emp-body { flex: 1; min-width: 0; }
    .emp-name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
    .emp-desg { font-size: 12px; color: #94a3b8; margin-bottom: 5px; }
    .emp-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 4px; }
    .type-badge { padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 700; background: rgba(8,145,178,0.12); color: #06b6d4; &.doc { background: rgba(99,102,241,0.12); color: #a5b4fc; } }
    .status-dot { font-size: 11px; }
    .online-chip { padding: 2px 7px; border-radius: 6px; background: rgba(74,222,128,0.1); color: #4ade80; font-size: 11px; font-weight: 600; }
    .loc-chip { padding: 2px 7px; border-radius: 6px; background: rgba(251,146,60,0.1); color: #fb923c; font-size: 11px; }
    .store-row { font-size: 11px; color: #64748b; margin-bottom: 3px; }
    .online-row, .store-row { margin-bottom: 4px; }
    .joining-chip { display: inline-flex; padding: 1px 7px; border-radius: 5px; background: rgba(99,102,241,0.1); color: #a5b4fc; font-size: 10px; font-weight: 600; }
    .letter-badge { position: absolute; top: 8px; right: 8px; font-size: 14px; }
    .empty { text-align: center; padding: 60px; color: #64748b; font-size: 14px; }
    .empty div { font-size: 40px; margin-bottom: 10px; }

    /* Drawer */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 400; display: flex; align-items: flex-end; @media (min-width: 700px) { align-items: center; justify-content: flex-end; } }
    .drawer { background: #0f1623; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px 24px 0 0; width: 100%; max-height: 92vh; overflow-y: auto; animation: su 0.22s ease; @media (min-width: 700px) { border-radius: 22px; width: 500px; max-height: 92vh; margin-right: 20px; margin-bottom: 20px; animation: si 0.22s ease; } }
    @keyframes su { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }
    @keyframes si { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }

    .dh { display: flex; align-items: center; gap: 10px; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); position: sticky; top: 0; background: #0f1623; z-index: 10; }
    .dh-av { width: 42px; height: 42px; border-radius: 13px; background: rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 800; color: #a5b4fc; flex-shrink: 0; &.doc { background: rgba(99,102,241,0.15); color: #a5b4fc; } }
    .dh-info { flex: 1; min-width: 0; }
    .dh-name { font-size: 15px; font-weight: 700; }
    .dh-sub { font-size: 12px; color: #64748b; }
    .dh-tabs { display: flex; gap: 3px; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 3px; flex-wrap: wrap; }
    .dh-tabs button { padding: 5px 10px; border-radius: 6px; border: none; background: transparent; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; &.active { background: rgba(99,102,241,0.2); color: #a5b4fc; } }
    .close-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; flex-shrink: 0; }

    .form-body { padding: 16px 18px; }
    .fsect { margin-bottom: 20px; }
    .ftitle { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 10px; }
    .frow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
    .fg { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; &.full { grid-column: span 2; } }
    label { font-size: 12px; color: #94a3b8; font-weight: 600; }
    input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 11px; color: white; font-size: 13px; outline: none; &:focus { border-color: rgba(99,102,241,0.5); } option { background: #1e293b; } }
    textarea { resize: vertical; min-height: 54px; }

    .shift-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; }
    .shift-btn { padding: 8px 4px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.07); background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.15s; &.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #a5b4fc; font-weight: 700; } }
    .days-grid { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 5px; }
    .day-btn { padding: 5px 11px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 12px; cursor: pointer; &.active { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.4); color: #f87171; font-weight: 700; } }

    .assign-toggle { display: flex; gap: 8px; }
    .assign-btn { flex: 1; padding: 12px 8px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; &.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #a5b4fc; } }
    .assign-info { background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px; font-size: 13px; color: #94a3b8; margin-bottom: 16px; }
    .loading-sm { font-size: 12px; color: #64748b; padding: 8px; }

    .btn-save { width: 100%; padding: 12px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 14px; font-weight: 700; cursor: pointer; &:disabled { opacity: 0.5; } }
    .btn-sec { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid rgba(99,102,241,0.3); background: transparent; color: #a5b4fc; font-size: 13px; font-weight: 700; cursor: pointer; margin-bottom: 8px; }

    .no-letter { text-align: center; padding: 40px; }
    .no-letter p { color: #64748b; margin-bottom: 16px; }

    .letter-preview { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 14px; }
    .letter-doc { padding: 24px; font-family: 'Times New Roman', serif; color: #1e293b; font-size: 13px; line-height: 1.7; }
    .ld-top { border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 14px; }
    .ld-org { font-size: 20px; font-weight: 900; color: #4f46e5; }
    .ld-addr { font-size: 12px; color: #475569; margin-top: 2px; }
    .ld-meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; color: #475569; }
    .ld-subject { text-align: center; font-size: 14px; font-weight: 700; letter-spacing: 0.04em; text-decoration: underline; margin-bottom: 14px; }
    .ld-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    .ld-table td { padding: 6px 8px; border: 1px solid #cbd5e1; }
    .ld-table tr td:first-child { background: #f1f5f9; font-weight: 600; width: 38%; }
    .ld-sign { display: flex; justify-content: space-between; margin-top: 30px; }
    .ld-sign > div { flex: 1; }
    .sline { border-top: 1px solid #94a3b8; margin-bottom: 4px; }
    .slbl { font-size: 11px; font-weight: 700; color: #475569; }
    .letter-actions { display: flex; flex-direction: column; gap: 8px; }

    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 600; }
  `]
})
export class EmployeesPage implements OnInit {
  private api = inject(AdminApi);

  readonly defaultClinicName = DEFAULT_CLINIC_NAME;

  employees = signal<any[]>([]);
  loading = signal(true);
  q = '';
  activeFilter = signal<string>(FILTER_ALL);
  activeStatus = signal<string>(FILTER_ALL);

  drawerOpen = signal(false);
  selected = signal<any>(null);
  tab = signal<'profile'|'shift'|'assign'|'letter'>('profile');
  saving = signal(false);
  letterLoading = signal(false);
  letter = signal<Record<string,any> | null>(null);
  storesLoading = signal(false);
  stores = signal<any[]>([]);
  assignOnline = signal(true);
  assignStoreId = '';
  toast = signal('');
  form: any = {};
  salaryDisplay = 0;

  filters = [...EMPLOYEE_TYPE_FILTER_OPTIONS];
  statusFilters = [...EMPLOYEE_STATUS_FILTER_OPTIONS];
  shifts = Object.entries(WORK_SHIFT_LABELS).map(([value, label]) => ({ value: value as WorkShift, label }));
  days = WEEK_DAYS;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getHrEmployees({ q: this.q, type: this.activeFilter(), status: this.activeStatus() })
      .then(r => { this.employees.set(r.employees); this.loading.set(false); })
      .catch(() => this.loading.set(false));
  }

  onSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), SEARCH_DEBOUNCE_MS);
  }

  setFilter(v: string): void { this.activeFilter.set(v); this.load(); }
  setStatus(v: string): void { this.activeStatus.set(v); this.load(); }

  open(e: any): void {
    this.selected.set(e);
    this.letter.set(null);
    this.tab.set('profile');
    this.form = {
      employeeId: e.employeeId, designation: e.designation, department: e.department,
      phone: e.phone, email: e.email, address: e.address,
      joiningDate: e.joiningDate ? e.joiningDate.slice(0,10) : '',
      probationEndDate: e.probationEndDate ? e.probationEndDate.slice(0,10) : '',
      workShift: e.workShift ?? DEFAULT_WORK_SHIFT, shiftStart: e.shiftStart ?? '',
      shiftEnd: e.shiftEnd ?? '', weeklyOffDays: [...(e.weeklyOffDays ?? [])],
      emergencyContact: e.emergencyContact, emergencyPhone: e.emergencyPhone,
      employeeStatus: e.employeeStatus ?? DEFAULT_EMPLOYEE_STATUS
    };
    this.salaryDisplay = e.salaryPerMonth ? e.salaryPerMonth / PAISE_PER_RUPEE : 0;
    this.assignOnline.set(e.isOnline !== false);
    this.assignStoreId = e.clinicStore?.id ?? '';
    this.drawerOpen.set(true);
  }

  close(): void { this.drawerOpen.set(false); }

  async saveProfile(): Promise<void> {
    if (!this.selected()) return;
    this.saving.set(true);
    const payload = { ...this.form, salaryPerMonth: Math.round(this.salaryDisplay * PAISE_PER_RUPEE) };
    try {
      if (this.selected().empType === 'DOCTOR') {
        await this.api.updateHrDoctor(this.selected().id, payload);
      } else {
        await this.api.updateHrStoreStaff(this.selected().id, payload);
      }
      this.employees.update(list => list.map(e => e.id === this.selected().id ? { ...e, ...payload } : e));
      this.showToast('Saved ✓');
    } finally { this.saving.set(false); }
  }

  async saveAssignment(): Promise<void> {
    if (!this.selected()) return;
    this.saving.set(true);
    try {
      await this.api.setDoctorAssignment(this.selected().id, {
        isOnline: this.assignOnline(),
        clinicStoreId: this.assignOnline() ? null : this.assignStoreId
      });
      this.showToast('Assignment saved ✓');
    } finally { this.saving.set(false); }
  }

  openLetter(): void {
    this.tab.set('letter');
    if (!this.letter() && !this.letterLoading()) {
      this.letterLoading.set(true);
      const fn = this.selected().empType === 'DOCTOR'
        ? this.api.getDoctorLetter(this.selected().id)
        : this.api.getStoreStaffLetter(this.selected().id);
      fn.then(r => { this.letter.set(r.letter?.content ?? {}); this.letterLoading.set(false); })
        .catch(() => this.letterLoading.set(false));
    }
    // Load stores for assignment tab
    if (this.stores().length === 0) {
      this.storesLoading.set(true);
      this.api.getAdminStores().then(r => { this.stores.set(r.stores); this.storesLoading.set(false); }).catch(() => this.storesLoading.set(false));
    }
  }

  async generate(): Promise<void> {
    this.letterLoading.set(true);
    try {
      const r = this.selected().empType === 'DOCTOR'
        ? await this.api.generateDoctorLetter(this.selected().id)
        : await this.api.generateStoreStaffLetter(this.selected().id);
      this.letter.set((r as any).letter?.content ?? {});
    } finally { this.letterLoading.set(false); }
  }

  async regen(): Promise<void> { this.letter.set(null); await this.generate(); }
  print(): void { window.print(); }

  statusColor(s: EmployeeStatus): string { return EMPLOYEE_STATUS_COLORS[s] ?? EMPLOYEE_STATUS_FALLBACK_COLOR; }
  isOff(d: string): boolean { return (this.form.weeklyOffDays ?? []).includes(d); }
  toggleOff(d: string): void {
    const c = this.form.weeklyOffDays ?? [];
    this.form.weeklyOffDays = c.includes(d) ? c.filter((x: string) => x !== d) : [...c, d];
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
