import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminApi } from '../../../core/services/admin-api';
import { PAISE_PER_RUPEE } from '../../../shared/constants/currency.constants';
import {
  EMPLOYEE_STATUS_COLORS,
  EMPLOYEE_STATUS_FALLBACK_COLOR,
  type EmployeeStatus
} from '../constants/employee-status.constants';
import { DEFAULT_HOMEOPATHIC_CLINIC_NAME } from '../constants/organization.constants';
import {
  DEFAULT_WORK_SHIFT,
  WEEK_DAYS,
  WORK_SHIFT_LABELS,
  type WorkShift
} from '../constants/shift.constants';

@Component({
  selector: 'app-doctor-hr',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="hr-page">
      <div class="hr-header">
        <h1>🩺 Doctor HR Records</h1>
        <p>Manage joining dates, shift schedules & employment letters for all doctors</p>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="doctor-grid">
          @for (d of doctors(); track d.id) {
            <div class="doctor-card" (click)="openProfile(d)">
              <div class="doc-avatar">{{ d.user?.name?.charAt(0)?.toUpperCase() ?? 'D' }}</div>
              <div class="doc-body">
                <div class="doc-name">{{ d.user?.name }}</div>
                <div class="doc-meta">
                  <span class="specialty">{{ d.specialty }}</span>
                  <span class="status-dot" [style.color]="statusColor(d.employeeStatus)">●</span>
                  <span class="status-lbl">{{ d.employeeStatus }}</span>
                </div>
                <div class="doc-info-row">
                  <span>{{ d.designation ?? 'Doctor' }}</span>
                  @if (d.workShift) { <span class="sep">|</span><span class="shift">{{ shiftLabel(d.workShift) }}</span> }
                </div>
                @if (d.joiningDate) {
                  <div class="joining-chip">Joined {{ d.joiningDate | date:'dd MMM yyyy' }}</div>
                }
              </div>
              @if (d.joiningLetter) { <div class="letter-icon">📄</div> }
            </div>
          }
        </div>

        @if (doctors().length === 0) {
          <div class="empty">
            <div>🩺</div><h3>No doctors found</h3><p>Add doctors first from the Doctors page.</p>
          </div>
        }
      }
    </div>

    <!-- Profile Drawer -->
    @if (profileOpen() && selected()) {
      <div class="overlay" (click)="close()">
        <div class="drawer" (click)="$event.stopPropagation()">
          <div class="dh">
            <div class="dh-avatar">{{ selected()?.user?.name?.charAt(0)?.toUpperCase() ?? 'D' }}</div>
            <div class="dh-info">
              <div class="dh-name">{{ selected()?.user?.name }}</div>
              <div class="dh-sub">{{ selected()?.specialty }}</div>
            </div>
            <div class="dh-tabs">
              <button [class.active]="tab() === 'profile'" (click)="tab.set('profile')">Profile</button>
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
                  <div class="fg">
                    <label>Employee ID</label>
                    <input [(ngModel)]="form.employeeId" placeholder="DOC-001" />
                  </div>
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
                  <div class="fg">
                    <label>Designation</label>
                    <input [(ngModel)]="form.designation" placeholder="Senior Doctor" />
                  </div>
                  <div class="fg">
                    <label>Department</label>
                    <input [(ngModel)]="form.department" placeholder="Homeopathy" />
                  </div>
                </div>
                <div class="frow">
                  <div class="fg">
                    <label>Joining Date</label>
                    <input type="date" [(ngModel)]="form.joiningDate" />
                  </div>
                  <div class="fg">
                    <label>Probation End</label>
                    <input type="date" [(ngModel)]="form.probationEndDate" />
                  </div>
                </div>
                <div class="frow">
                  <div class="fg">
                    <label>Monthly Salary (₹)</label>
                    <input type="number" [(ngModel)]="salaryDisplay" placeholder="50000" />
                  </div>
                  <div class="fg">
                    <label>Consultation Fee (₹)</label>
                    <input type="number" [(ngModel)]="feeDisplay" placeholder="500" />
                  </div>
                </div>
              </div>

              <div class="fsect">
                <div class="ftitle">Shift & Schedule</div>
                <div class="shift-grid">
                  @for (s of shifts; track s.value) {
                    <button class="shift-btn" [class.active]="form.workShift === s.value" (click)="form.workShift = s.value">
                      {{ s.label }}
                    </button>
                  }
                </div>
                <div class="frow" style="margin-top:12px">
                  <div class="fg">
                    <label>Start Time</label>
                    <input type="time" [(ngModel)]="form.shiftStart" />
                  </div>
                  <div class="fg">
                    <label>End Time</label>
                    <input type="time" [(ngModel)]="form.shiftEnd" />
                  </div>
                </div>
                <div class="fg full" style="margin-top:12px">
                  <label>Weekly Off Days</label>
                  <div class="days-grid">
                    @for (d of days; track d) {
                      <button class="day-btn" [class.active]="isOff(d)" (click)="toggleOff(d)">{{ d.slice(0,3) }}</button>
                    }
                  </div>
                </div>
              </div>

              <div class="fsect">
                <div class="ftitle">Contact</div>
                <div class="frow">
                  <div class="fg">
                    <label>Phone</label>
                    <input type="tel" [(ngModel)]="form.phone" placeholder="+91 99999 00000" />
                  </div>
                  <div class="fg full">
                    <label>Address</label>
                    <textarea [(ngModel)]="form.address" rows="2" placeholder="Full address"></textarea>
                  </div>
                </div>
                <div class="frow">
                  <div class="fg">
                    <label>Emergency Contact</label>
                    <input [(ngModel)]="form.emergencyContact" placeholder="Name" />
                  </div>
                  <div class="fg">
                    <label>Emergency Phone</label>
                    <input type="tel" [(ngModel)]="form.emergencyPhone" />
                  </div>
                </div>
              </div>

              <button class="btn-save" [disabled]="saving()" (click)="save()">
                {{ saving() ? 'Saving…' : '💾 Save HR Profile' }}
              </button>
            </div>
          }

          <!-- Letter Tab -->
          @if (tab() === 'letter') {
            <div class="letter-section">
              @if (letterLoading()) {
                <div class="loading"><div class="spinner"></div></div>
              } @else if (letter()) {
                <div class="letter-preview" id="print-area">
                  <div class="letter-doc">
                    <div class="letter-top">
                      <div class="org-name">{{ letter()!.content['organizationName'] }}</div>
                      <div class="org-addr">{{ letter()!.content['organizationAddress'] }}</div>
                    </div>
                    <div class="lmeta">
                      <span><strong>Letter No:</strong> {{ letter()!.content['letterNumber'] }}</span>
                      <span><strong>Date:</strong> {{ letter()!.content['issuedDate'] | date:'dd MMMM yyyy' }}</span>
                    </div>
                    <div class="lsubject"><strong>APPOINTMENT / JOINING LETTER</strong></div>
                    <p class="lsalut">Dear Dr. {{ letter()!.content['employeeName'] }},</p>
                    <p>We are pleased to appoint you as <strong>{{ letter()!.content['designation'] }}</strong> in the <strong>{{ letter()!.content['department'] }}</strong> department effective from <strong>{{ letter()!.content['joiningDate'] | date:'dd MMMM yyyy' }}</strong>.</p>
                    <table class="ltable">
                      <tr><td>Employee Code</td><td>{{ letter()!.content['employeeCode'] }}</td></tr>
                      <tr><td>Designation</td><td>{{ letter()!.content['designation'] }}</td></tr>
                      <tr><td>Specialty</td><td>{{ letter()!.content['specialty'] }}</td></tr>
                      <tr><td>Registration No.</td><td>{{ letter()!.content['registrationNo'] }}</td></tr>
                      <tr><td>Date of Joining</td><td>{{ letter()!.content['joiningDate'] | date:'dd MMMM yyyy' }}</td></tr>
                      @if (letter()!.content['probationEndDate']) {
                        <tr><td>Probation Until</td><td>{{ letter()!.content['probationEndDate'] | date:'dd MMMM yyyy' }}</td></tr>
                      }
                      <tr><td>Salary</td><td>{{ letter()!.content['salary'] }}</td></tr>
                      <tr><td>Consultation Fee</td><td>{{ letter()!.content['consultationFee'] }}</td></tr>
                      <tr><td>Working Hours</td><td>{{ letter()!.content['shift'] }}</td></tr>
                      <tr><td>Weekly Off</td><td>{{ letter()!.content['weeklyOff'] }}</td></tr>
                    </table>
                    <p>You are expected to maintain professional conduct and comply with all clinic policies.</p>
                    <div class="lsign">
                      <div><div class="sline"></div><div class="slbl">Authorised Signatory</div></div>
                      <div><div class="sline"></div><div class="slbl">Doctor's Acceptance & Date</div></div>
                    </div>
                  </div>
                </div>
                <div class="letter-actions">
                  <button class="btn-sec" (click)="regen()">🔄 Re-generate</button>
                  <button class="btn-print" (click)="print()">🖨️ Print / PDF</button>
                </div>
              } @else {
                <div class="no-letter">
                  <div>📄</div><p>No joining letter yet.</p>
                  <button class="btn-gen" (click)="generate()">✨ Generate Letter</button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .hr-page { padding: 24px; max-width: 960px; margin: 0 auto; color: white; }
    .hr-header { margin-bottom: 24px; }
    .hr-header h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
    .hr-header p { font-size: 14px; color: #64748b; margin: 0; }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .doctor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 12px; }

    .doctor-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
      padding: 16px; display: flex; align-items: flex-start; gap: 12px; cursor: pointer;
      transition: all 0.2s; position: relative;
      &:hover { background: rgba(255,255,255,0.06); border-color: rgba(99,102,241,0.3); }
    }

    .doc-avatar { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg,#6366f1,#4f46e5); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; flex-shrink: 0; }
    .doc-body { flex: 1; min-width: 0; }
    .doc-name { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
    .doc-meta { display: flex; gap: 6px; align-items: center; margin-bottom: 5px; font-size: 12px; flex-wrap: wrap; }
    .specialty { color: #94a3b8; }
    .status-dot { font-size: 12px; }
    .status-lbl { color: #64748b; }
    .doc-info-row { font-size: 12px; color: #94a3b8; margin-bottom: 5px; display: flex; gap: 5px; }
    .sep { color: #334155; }
    .shift { color: #60a5fa; }
    .joining-chip { display: inline-flex; padding: 2px 8px; border-radius: 6px; background: rgba(74,222,128,0.1); color: #4ade80; font-size: 11px; font-weight: 600; }
    .letter-icon { position: absolute; top: 10px; right: 10px; font-size: 16px; }
    .empty { text-align: center; padding: 60px; color: #64748b; }

    /* Drawer */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 400; display: flex; align-items: flex-end; @media (min-width: 700px) { align-items: center; justify-content: flex-end; } }

    .drawer {
      background: #0f1623; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px 24px 0 0;
      width: 100%; max-height: 92vh; overflow-y: auto; animation: su 0.25s ease;
      @media (min-width: 700px) { border-radius: 24px; width: 540px; max-height: 92vh; margin-right: 20px; margin-bottom: 20px; animation: si 0.25s ease; }
    }
    @keyframes su { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes si { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .dh { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); position: sticky; top: 0; background: #0f1623; z-index: 10; }
    .dh-avatar { width: 44px; height: 44px; border-radius: 13px; background: linear-gradient(135deg,#6366f1,#4f46e5); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; flex-shrink: 0; }
    .dh-info { flex: 1; }
    .dh-name { font-size: 15px; font-weight: 700; }
    .dh-sub { font-size: 12px; color: #64748b; }
    .dh-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 3px; }
    .dh-tabs button { padding: 5px 12px; border-radius: 6px; border: none; background: transparent; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; &.active { background: rgba(99,102,241,0.2); color: #a5b4fc; } }
    .close-btn { width: 30px; height: 30px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; flex-shrink: 0; }

    .form-body { padding: 16px 20px; }
    .fsect { margin-bottom: 22px; }
    .ftitle { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 12px; }
    .frow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .fg { display: flex; flex-direction: column; gap: 4px; &.full { grid-column: span 2; } }
    label { font-size: 12px; color: #94a3b8; font-weight: 600; }
    input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; color: white; font-size: 14px; outline: none; transition: border-color 0.2s; &:focus { border-color: rgba(99,102,241,0.5); } option { background: #1e293b; } }
    textarea { resize: vertical; min-height: 56px; }

    .shift-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; }
    .shift-btn { padding: 8px 6px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 12px; cursor: pointer; transition: all 0.2s; &.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #a5b4fc; font-weight: 700; } }

    .days-grid { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    .day-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); color: #94a3b8; font-size: 12px; cursor: pointer; &.active { background: rgba(248,113,113,0.15); border-color: rgba(248,113,113,0.4); color: #f87171; font-weight: 700; } }

    .btn-save { width: 100%; padding: 14px; border-radius: 12px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 4px; &:disabled { opacity: 0.5; } }

    /* Letter */
    .letter-section { padding: 16px 20px; }
    .no-letter { text-align: center; padding: 40px; }
    .no-letter p { color: #64748b; margin: 12px 0 20px; }
    .btn-gen { padding: 12px 28px; border-radius: 12px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 14px; font-weight: 700; cursor: pointer; }
    .letter-preview { background: white; border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
    .letter-actions { display: flex; gap: 10px; }
    .btn-sec { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid rgba(99,102,241,0.3); background: transparent; color: #a5b4fc; font-size: 13px; font-weight: 700; cursor: pointer; }
    .btn-print { flex: 1; padding: 12px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 13px; font-weight: 700; cursor: pointer; }

    /* Letter doc */
    .letter-doc { padding: 32px; font-family: 'Times New Roman', serif; color: #1e293b; font-size: 14px; line-height: 1.75; }
    .letter-top { border-bottom: 2px solid #1e293b; padding-bottom: 14px; margin-bottom: 20px; }
    .org-name { font-size: 22px; font-weight: 900; color: #4f46e5; }
    .org-addr { font-size: 13px; color: #475569; margin-top: 3px; }
    .lmeta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; color: #475569; }
    .lsubject { text-align: center; font-size: 16px; letter-spacing: 0.05em; margin-bottom: 20px; text-decoration: underline; }
    .lsalut { margin-bottom: 14px; font-size: 15px; }
    .ltable { width: 100%; border-collapse: collapse; margin: 14px 0 20px; font-size: 13px; }
    .ltable td { padding: 7px 10px; border: 1px solid #cbd5e1; }
    .ltable tr td:first-child { background: #f1f5f9; font-weight: 600; width: 40%; }
    .lsign { display: flex; justify-content: space-between; margin-top: 40px; gap: 20px; }
    .lsign > div { flex: 1; }
    .sline { border-top: 1px solid #94a3b8; margin-bottom: 6px; }
    .slbl { font-size: 12px; font-weight: 700; color: #475569; }

    @media print {
      .overlay { position: static !important; background: transparent !important; }
      .drawer { position: static !important; max-height: none !important; border: none !important; width: 100% !important; }
      .dh, .dh-tabs, .close-btn, .letter-actions, .btn-save, .hr-page { display: none !important; }
    }
  `]
})
export class DoctorHrComponent implements OnInit {
  private api = inject(AdminApi);

  doctors = signal<any[]>([]);
  loading = signal(true);
  profileOpen = signal(false);
  selected = signal<any>(null);
  saving = signal(false);
  tab = signal<'profile' | 'letter'>('profile');
  letter = signal<any>(null);
  letterLoading = signal(false);

  form: any = {};
  salaryDisplay = 0;
  feeDisplay = 0;

  shifts = Object.entries(WORK_SHIFT_LABELS).map(([value, label]) => ({ value: value as WorkShift, label }));
  days = WEEK_DAYS;

  ngOnInit(): void { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const r = await this.api.getHrDoctors();
      this.doctors.set(r.doctors);
    } finally { this.loading.set(false); }
  }

  openProfile(d: any): void {
    this.selected.set(d);
    this.letter.set(d.joiningLetter ?? null);
    this.tab.set('profile');
    this.form = { ...d, workShift: d.workShift ?? DEFAULT_WORK_SHIFT, weeklyOffDays: d.weeklyOffDays ?? [] };
    this.salaryDisplay = d.salaryPerMonth ? d.salaryPerMonth / PAISE_PER_RUPEE : 0;
    this.feeDisplay = d.consultationFee ? d.consultationFee / PAISE_PER_RUPEE : 0;
    this.profileOpen.set(true);
  }

  close(): void { this.profileOpen.set(false); }

  async save() {
    if (!this.selected()) return;
    this.saving.set(true);
    try {
      const r = await this.api.updateHrDoctor(this.selected().id, {
        ...this.form,
        salaryPerMonth: Math.round(this.salaryDisplay * PAISE_PER_RUPEE),
        consultationFee: Math.round(this.feeDisplay * PAISE_PER_RUPEE)
      });
      this.doctors.update(list => list.map(d => d.id === r.doctor.id ? { ...d, ...r.doctor } : d));
      this.selected.set({ ...this.selected(), ...r.doctor });
    } finally { this.saving.set(false); }
  }

  openLetter(): void {
    this.tab.set('letter');
    if (!this.letter()) {
      this.letterLoading.set(true);
      this.api.getDoctorLetter(this.selected().id)
        .then(r => { this.letter.set(r.letter); this.letterLoading.set(false); })
        .catch(() => this.letterLoading.set(false));
    }
  }

  async generate() {
    this.letterLoading.set(true);
    try {
      const r = await this.api.generateDoctorLetter(this.selected().id, DEFAULT_HOMEOPATHIC_CLINIC_NAME);
      this.letter.set(r.letter);
    } finally { this.letterLoading.set(false); }
  }

  async regen() { this.letter.set(null); await this.generate(); }
  print(): void { window.print(); }

  shiftLabel(s: WorkShift): string { return WORK_SHIFT_LABELS[s] ?? s; }
  statusColor(s: EmployeeStatus): string { return EMPLOYEE_STATUS_COLORS[s] ?? EMPLOYEE_STATUS_FALLBACK_COLOR; }
  isOff(d: string): boolean { return (this.form.weeklyOffDays ?? []).includes(d); }
  toggleOff(d: string): void {
    const c = this.form.weeklyOffDays ?? [];
    this.form.weeklyOffDays = c.includes(d) ? c.filter((x: string) => x !== d) : [...c, d];
  }
}
