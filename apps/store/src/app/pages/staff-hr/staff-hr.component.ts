import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { StoreApiService } from '../../services/store-api.service';
import { StaffHrProfile, JoiningLetterDoc, WorkShift, EmployeeStatus } from '../../models';
import { STORE_STAFF_ROLES } from '../../core/constants/auth.constants';
import { EMPLOYEE_STATUS_STYLES, SHIFT_LABELS, WEEK_DAYS } from '../../shared/constants/hr.constants';

@Component({
  selector: 'app-staff-hr',
  imports: [FormsModule, DatePipe, NgTemplateOutlet],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">🪪 Staff HR Records</h1>
        <p class="page-sub">Joining details, shift timings & employment letters</p>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="staff-grid">
          @for (s of staff(); track s.id) {
            <div class="staff-card" (click)="openProfile(s)">
              <div class="card-avatar" [class.manager]="s.role === managerRole">
                {{ s.name.charAt(0).toUpperCase() }}
              </div>
              <div class="card-body">
                <div class="card-name">{{ s.name }}</div>
                <div class="card-meta">
                  <span class="code">{{ s.employeeId ?? s.staffCode }}</span>
                  <span class="role-tag" [class.manager]="s.role === managerRole">{{ s.role }}</span>
                  <span class="status-dot" [style.color]="statusColor(s.employeeStatus)">●</span>
                </div>
                <div class="card-info-row">
                  <span class="info-item">{{ s.designation ?? '—' }}</span>
                  <span class="info-sep">|</span>
                  <span class="info-item shift">{{ shiftLabel(s.workShift) }}</span>
                </div>
                @if (s.joiningDate) {
                  <div class="joining-chip">Joined {{ s.joiningDate | date:'dd MMM yyyy' }}</div>
                }
              </div>
              @if (s.joiningLetter) {
                <div class="letter-badge">📄</div>
              }
            </div>
          }
        </div>

        @if (staff().length === 0) {
          <div class="empty">
            <div class="empty-icon">👤</div>
            <h3>No staff found</h3>
            <p>Add staff members first from Store Setup.</p>
          </div>
        }
      }
    </div>

    <!-- Profile Editor Drawer -->
    @if (profileOpen() && selected()) {
      <div class="drawer-overlay" (click)="closeProfile()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="drawer-header">
            <div class="detail-avatar" [class.manager]="selected()!.role === managerRole">
              {{ selected()!.name.charAt(0).toUpperCase() }}
            </div>
            <div class="dh-info">
              <div class="dh-name">{{ selected()!.name }}</div>
              <div class="dh-sub">{{ selected()!.staffCode }}</div>
            </div>
            <div class="dh-tabs">
              <button [class.active]="tab() === 'profile'" (click)="tab.set('profile')">Profile</button>
              <button [class.active]="tab() === 'letter'" (click)="openLetter()">Letter</button>
            </div>
            <button class="close-btn" (click)="closeProfile()">✕</button>
          </div>

          <!-- Profile Tab -->
          @if (tab() === 'profile') {
            <div class="form-body">
              <div class="form-section">
                <div class="section-title">Employment Details</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Employee ID</label>
                    <input type="text" [(ngModel)]="form.employeeId" placeholder="EMP-001" />
                  </div>
                  <div class="form-group">
                    <label>Status</label>
                    <select [(ngModel)]="form.employeeStatus">
                      <option value="ACTIVE">Active</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="RESIGNED">Resigned</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Designation</label>
                    <input type="text" [(ngModel)]="form.designation" placeholder="Store Assistant" />
                  </div>
                  <div class="form-group">
                    <label>Department</label>
                    <input type="text" [(ngModel)]="form.department" placeholder="Store Operations" />
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Joining Date</label>
                    <input type="date" [(ngModel)]="form.joiningDate" />
                  </div>
                  <div class="form-group">
                    <label>Probation End Date</label>
                    <input type="date" [(ngModel)]="form.probationEndDate" />
                  </div>
                </div>
                <div class="form-group full">
                  <label>Monthly Salary (₹)</label>
                  <input type="number" [(ngModel)]="salaryDisplay" placeholder="15000"
                         (ngModelChange)="form.salaryPerMonth = $event * 100" />
                </div>
              </div>

              <div class="form-section">
                <div class="section-title">Shift & Timing</div>
                <div class="form-group full">
                  <label>Work Shift</label>
                  <div class="shift-grid">
                    @for (s of shifts; track s.value) {
                      <button class="shift-btn" [class.active]="form.workShift === s.value"
                              (click)="form.workShift = s.value">
                        {{ s.label }}
                      </button>
                    }
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Shift Start</label>
                    <input type="time" [(ngModel)]="form.shiftStart" />
                  </div>
                  <div class="form-group">
                    <label>Shift End</label>
                    <input type="time" [(ngModel)]="form.shiftEnd" />
                  </div>
                </div>
                <div class="form-group full">
                  <label>Weekly Off Days</label>
                  <div class="days-grid">
                    @for (d of days; track d) {
                      <button class="day-btn" [class.active]="isOffDay(d)" (click)="toggleOffDay(d)">
                        {{ d.slice(0, 3) }}
                      </button>
                    }
                  </div>
                </div>
              </div>

              <div class="form-section">
                <div class="section-title">Contact Information</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" [(ngModel)]="form.phone" placeholder="+91 99999 00000" />
                  </div>
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" [(ngModel)]="form.email" placeholder="staff@example.com" />
                  </div>
                </div>
                <div class="form-group full">
                  <label>Address</label>
                  <textarea [(ngModel)]="form.address" rows="2" placeholder="Full address..."></textarea>
                </div>
              </div>

              <div class="form-section">
                <div class="section-title">Emergency Contact</div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Name</label>
                    <input type="text" [(ngModel)]="form.emergencyContact" placeholder="Contact name" />
                  </div>
                  <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" [(ngModel)]="form.emergencyPhone" placeholder="+91 99999 00000" />
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button class="btn-save" [disabled]="saving()" (click)="saveProfile()">
                  {{ saving() ? 'Saving…' : '💾 Save Profile' }}
                </button>
              </div>
            </div>
          }

          <!-- Letter Tab -->
          @if (tab() === 'letter') {
            <div class="letter-section">
              @if (letterLoading()) {
                <div class="loading"><div class="spinner"></div></div>
              } @else if (letter()) {
                <div class="letter-preview" id="letter-print-area">
                  <ng-container *ngTemplateOutlet="letterTemplate; context: { $implicit: letter()!.content }"></ng-container>
                </div>
                <div class="letter-actions">
                  <button class="btn-secondary" (click)="regenerateLetter()">🔄 Re-generate</button>
                  <button class="btn-print" (click)="printLetter()">🖨️ Print / Save PDF</button>
                </div>
              } @else {
                <div class="no-letter">
                  <div class="nl-icon">📄</div>
                  <p>No joining letter generated yet.</p>
                  <button class="btn-generate" (click)="generateLetter()">✨ Generate Joining Letter</button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }

    <!-- Letter print template (used inline) -->
    <ng-template #letterTemplate let-c>
      <div class="letter-doc">
        <div class="letter-top">
          <div class="org-name">{{ c['storeName'] ?? c['organizationName'] }}</div>
          <div class="org-address">{{ c['storeAddress'] ?? c['organizationAddress'] }}</div>
          @if (c['storePhone']) { <div class="org-phone">📞 {{ c['storePhone'] }}</div> }
        </div>
        <div class="letter-meta-row">
          <span><strong>Letter No:</strong> {{ c['letterNumber'] }}</span>
          <span><strong>Date:</strong> {{ c['issuedDate'] | date:'dd MMMM yyyy' }}</span>
        </div>
        <div class="letter-subject">
          <strong>APPOINTMENT / JOINING LETTER</strong>
        </div>
        <div class="letter-salutation">Dear {{ c['employeeName'] }},</div>
        <div class="letter-body">
          <p>
            We are pleased to appoint you as <strong>{{ c['designation'] }}</strong> in the
            <strong>{{ c['department'] }}</strong> department, effective from
            <strong>{{ c['joiningDate'] | date:'dd MMMM yyyy' }}</strong>.
          </p>
          <p>Your employment details are as follows:</p>
        </div>
        <table class="letter-table">
          <tr><td>Employee Code</td><td>{{ c['employeeCode'] }}</td></tr>
          <tr><td>Designation</td><td>{{ c['designation'] }}</td></tr>
          <tr><td>Department</td><td>{{ c['department'] }}</td></tr>
          <tr><td>Date of Joining</td><td>{{ c['joiningDate'] | date:'dd MMMM yyyy' }}</td></tr>
          @if (c['probationEndDate']) {
            <tr><td>Probation Period</td><td>Until {{ c['probationEndDate'] | date:'dd MMMM yyyy' }}</td></tr>
          }
          <tr><td>Monthly Compensation</td><td>{{ c['salary'] }}</td></tr>
          <tr><td>Working Hours</td><td>{{ c['shift'] }}</td></tr>
          <tr><td>Weekly Off</td><td>{{ c['weeklyOff'] }}</td></tr>
          @if (c['phone']) { <tr><td>Contact</td><td>{{ c['phone'] }}</td></tr> }
        </table>
        <div class="letter-body">
          <p>
            You are required to maintain professional conduct and adhere to the company's policies.
            This appointment is subject to satisfactory completion of the probation period and compliance with all terms.
          </p>
          <p>We look forward to a long and productive association with you.</p>
        </div>
        <div class="letter-sign">
          <div class="sign-block">
            <div class="sign-line"></div>
            <div class="sign-label">Authorised Signatory</div>
            <div class="sign-org">{{ c['storeName'] ?? c['organizationName'] }}</div>
          </div>
          <div class="sign-ack">
            <div class="sign-line"></div>
            <div class="sign-label">Employee Signature & Acceptance</div>
            <div class="sign-date">Date: ____________</div>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .page { padding: 20px; max-width: 900px; margin: 0 auto; color: white; }
    .page-header { margin-bottom: 20px; }
    .page-title { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
    .page-sub { font-size: 14px; color: #64748b; margin: 0; }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(8,145,178,0.2); border-top-color: #0891b2; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .staff-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }

    .staff-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      &:hover { background: rgba(255,255,255,0.06); border-color: rgba(8,145,178,0.3); }
    }

    .card-avatar {
      width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
      background: rgba(8,145,178,0.15); border: 1px solid rgba(8,145,178,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 800; color: #06b6d4;
      &.manager { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.2); color: #c084fc; }
    }

    .card-body { flex: 1; min-width: 0; }
    .card-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .card-meta { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; flex-wrap: wrap; }
    .code { font-size: 11px; color: #64748b; font-family: monospace; }
    .role-tag { padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 700; background: rgba(8,145,178,0.12); color: #06b6d4; &.manager { background: rgba(168,85,247,0.12); color: #c084fc; } }
    .status-dot { font-size: 12px; }
    .card-info-row { display: flex; gap: 6px; align-items: center; font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .info-sep { color: #334155; }
    .shift { color: #60a5fa; }
    .joining-chip { display: inline-flex; padding: 2px 8px; border-radius: 6px; background: rgba(74,222,128,0.1); color: #4ade80; font-size: 11px; font-weight: 600; }
    .letter-badge { position: absolute; top: 10px; right: 10px; font-size: 18px; }

    .empty { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty h3 { color: white; margin: 0 0 8px; }
    .empty p { color: #64748b; font-size: 14px; margin: 0; }

    /* Drawer */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 300; display: flex; align-items: flex-end; @media (min-width: 700px) { align-items: center; justify-content: flex-end; } }

    .drawer {
      background: #0a1628;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px 24px 0 0;
      width: 100%;
      max-height: 92vh;
      overflow-y: auto;
      animation: slideUp 0.25s ease;
      @media (min-width: 700px) { border-radius: 24px; width: 520px; max-height: 92vh; margin-right: 20px; margin-bottom: 20px; animation: slideIn 0.25s ease; }
    }

    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .drawer-header {
      display: flex; align-items: center; gap: 10px; padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.07); position: sticky; top: 0; background: #0a1628; z-index: 10;
    }

    .detail-avatar {
      width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
      background: linear-gradient(135deg,#0891b2,#0e7490);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 800;
      &.manager { background: linear-gradient(135deg,#7c3aed,#6d28d9); }
    }

    .dh-info { flex: 1; }
    .dh-name { font-size: 15px; font-weight: 700; }
    .dh-sub { font-size: 12px; color: #64748b; }

    .dh-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 3px; }
    .dh-tabs button {
      padding: 5px 12px; border-radius: 6px; border: none; background: transparent;
      color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer;
      &.active { background: rgba(8,145,178,0.2); color: #06b6d4; }
    }

    .close-btn { width: 30px; height: 30px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; flex-shrink: 0; }

    .form-body { padding: 16px 20px; }
    .form-section { margin-bottom: 24px; }
    .section-title { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 12px; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; &.full { grid-column: span 2; } }

    label { font-size: 12px; color: #94a3b8; font-weight: 600; }

    input, select, textarea {
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 9px 12px; color: white; font-size: 14px; outline: none;
      transition: border-color 0.2s;
      &:focus { border-color: rgba(8,145,178,0.5); }
      option { background: #1e293b; }
    }

    textarea { resize: vertical; min-height: 60px; }

    .shift-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; }
    .shift-btn {
      padding: 8px 6px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.2s;
      &.active { background: rgba(8,145,178,0.15); border-color: rgba(8,145,178,0.4); color: #06b6d4; font-weight: 700; }
    }

    .days-grid { display: flex; gap: 6px; flex-wrap: wrap; }
    .day-btn {
      padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.2s;
      &.active { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.4); color: #f87171; font-weight: 700; }
    }

    .form-actions { padding-top: 8px; }
    .btn-save {
      width: 100%; padding: 14px; border-radius: 12px; border: none;
      background: linear-gradient(135deg,#0891b2,#0e7490); color: white;
      font-size: 15px; font-weight: 700; cursor: pointer; transition: opacity 0.2s;
      &:disabled { opacity: 0.5; }
    }

    /* Letter */
    .letter-section { padding: 16px 20px; }
    .no-letter { text-align: center; padding: 40px 20px; }
    .nl-icon { font-size: 48px; margin-bottom: 12px; }
    .no-letter p { color: #64748b; margin-bottom: 20px; }
    .btn-generate {
      padding: 12px 28px; border-radius: 12px; border: none;
      background: linear-gradient(135deg,#0891b2,#0e7490); color: white;
      font-size: 14px; font-weight: 700; cursor: pointer;
    }

    .letter-preview {
      background: white; border-radius: 12px; overflow: hidden;
      margin-bottom: 16px;
    }

    .letter-actions { display: flex; gap: 10px; }
    .btn-secondary { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid rgba(8,145,178,0.3); background: transparent; color: #06b6d4; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-print { flex: 1; padding: 12px; border-radius: 10px; border: none; background: linear-gradient(135deg,#0891b2,#0e7490); color: white; font-size: 13px; font-weight: 700; cursor: pointer; }

    /* Letter Document Styles */
    .letter-doc { padding: 32px; font-family: 'Times New Roman', serif; color: #1e293b; font-size: 14px; line-height: 1.7; }
    .letter-top { border-bottom: 2px solid #1e293b; padding-bottom: 14px; margin-bottom: 20px; }
    .org-name { font-size: 22px; font-weight: 900; color: #0e7490; letter-spacing: 0.02em; }
    .org-address, .org-phone { font-size: 13px; color: #475569; margin-top: 2px; }
    .letter-meta-row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #475569; }
    .letter-subject { text-align: center; font-size: 16px; letter-spacing: 0.05em; margin-bottom: 20px; color: #1e293b; text-decoration: underline; }
    .letter-salutation { margin-bottom: 14px; font-size: 15px; }
    .letter-body p { margin: 0 0 12px; }
    .letter-table { width: 100%; border-collapse: collapse; margin: 14px 0 20px; font-size: 13px; }
    .letter-table td { padding: 7px 10px; border: 1px solid #cbd5e1; }
    .letter-table tr td:first-child { background: #f1f5f9; font-weight: 600; width: 40%; }
    .letter-sign { display: flex; justify-content: space-between; margin-top: 40px; gap: 20px; }
    .sign-block, .sign-ack { flex: 1; }
    .sign-line { border-top: 1px solid #94a3b8; margin-bottom: 6px; }
    .sign-label { font-size: 12px; font-weight: 700; color: #475569; }
    .sign-org, .sign-date { font-size: 12px; color: #94a3b8; margin-top: 2px; }

    @media print {
      .drawer-overlay { position: static !important; background: transparent !important; }
      .drawer { position: static !important; max-height: none !important; border: none !important; width: 100% !important; }
      .drawer-header, .dh-tabs, .close-btn, .letter-actions, .btn-save { display: none !important; }
      .letter-doc { padding: 20px; }
    }
  `]
})
export class StaffHrComponent implements OnInit {
  private api = inject(StoreApiService);

  readonly managerRole = STORE_STAFF_ROLES.MANAGER;

  staff = signal<StaffHrProfile[]>([]);
  loading = signal(true);
  profileOpen = signal(false);
  selected = signal<StaffHrProfile | null>(null);
  saving = signal(false);
  tab = signal<'profile' | 'letter'>('profile');
  letter = signal<JoiningLetterDoc | null>(null);
  letterLoading = signal(false);

  form: Partial<StaffHrProfile> & { salaryDisplay?: number } = {};
  salaryDisplay = 0;

  shifts = Object.entries(SHIFT_LABELS).map(([value, label]) => ({ value: value as WorkShift, label }));
  days = WEEK_DAYS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getHrStaffList().subscribe({
      next: (r) => { this.staff.set(r.staff); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openProfile(s: StaffHrProfile): void {
    this.selected.set(s);
    this.letter.set(s.joiningLetter ?? null);
    this.tab.set('profile');
    this.form = { ...s };
    this.salaryDisplay = s.salaryPerMonth ? s.salaryPerMonth / 100 : 0;
    this.profileOpen.set(true);
  }

  closeProfile(): void { this.profileOpen.set(false); }

  openLetter(): void {
    this.tab.set('letter');
    if (!this.letter()) {
      this.letterLoading.set(true);
      this.api.getStaffLetter(this.selected()!.id).subscribe({
        next: (r) => { this.letter.set(r.letter); this.letterLoading.set(false); },
        error: () => this.letterLoading.set(false)
      });
    }
  }

  saveProfile(): void {
    if (!this.selected()) return;
    this.saving.set(true);
    const payload = { ...this.form, salaryPerMonth: this.salaryDisplay * 100 };
    this.api.updateHrStaff(this.selected()!.id, payload).subscribe({
      next: (r) => {
        this.staff.update(list => list.map(s => s.id === r.staff.id ? { ...s, ...r.staff } : s));
        this.selected.set({ ...this.selected()!, ...r.staff });
        this.saving.set(false);
      },
      error: () => this.saving.set(false)
    });
  }

  generateLetter(): void {
    if (!this.selected()) return;
    this.letterLoading.set(true);
    this.api.generateStaffLetter(this.selected()!.id).subscribe({
      next: (r) => { this.letter.set(r.letter); this.letterLoading.set(false); },
      error: () => this.letterLoading.set(false)
    });
  }

  regenerateLetter(): void {
    this.letter.set(null);
    this.generateLetter();
  }

  printLetter(): void { window.print(); }

  shiftLabel(s: WorkShift): string { return SHIFT_LABELS[s] ?? s; }
  statusColor(s: EmployeeStatus): string { return EMPLOYEE_STATUS_STYLES[s]?.color ?? '#94a3b8'; }
  isOffDay(d: string): boolean { return (this.form.weeklyOffDays ?? []).includes(d); }
  toggleOffDay(d: string): void {
    const current = this.form.weeklyOffDays ?? [];
    this.form.weeklyOffDays = current.includes(d) ? current.filter(x => x !== d) : [...current, d];
  }
}
