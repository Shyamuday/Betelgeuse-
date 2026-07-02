import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_PATHS } from '../../../core/constants/api-paths.constants';
import { TOAST_DURATION_MS } from '../../../core/constants/timing.constants';
import { Auth } from '../../../core/services/auth';
import {
  DEFAULT_LEAVE_TYPE,
  LEAVE_STATUS_FALLBACK_STYLE,
  LEAVE_STATUS_STYLES,
  LEAVE_TYPES
} from '../constants/leave.constants';

@Component({
  selector: 'app-my-leaves',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="ml">
      <div class="ml-hdr">
        <div>
          <h2 class="ml-title">📋 My Leaves</h2>
          <p class="ml-sub">View your leave history and request new leaves</p>
        </div>
        <button class="btn-primary" (click)="openModal()">+ Request Leave</button>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="leave-list">
          @for (l of leaves(); track l.id) {
            <div class="leave-card">
              <div class="lc-body">
                <div class="lc-top">
                  <span class="leave-type">{{ l.type }}</span>
                  <span class="days-badge">{{ l.totalDays }} day{{ l.totalDays !== 1 ? 's' : '' }}</span>
                </div>
                <div class="lc-dates">{{ l.startDate | date:'dd MMM yyyy' }} → {{ l.endDate | date:'dd MMM yyyy' }}</div>
                @if (l.reason) { <div class="lc-reason">"{{ l.reason }}"</div> }
                @if (l.hrNote) { <div class="lc-note">📝 HR: {{ l.hrNote }}</div> }
                @if (l.approvedBy) { <div class="lc-by">{{ l.approvedBy.name }}</div> }
              </div>
              <div class="status-badge" [style.background]="statusStyle(l.status).bg" [style.color]="statusStyle(l.status).color">
                {{ l.status }}
              </div>
            </div>
          }
        </div>
        @if (leaves().length === 0) {
          <div class="empty"><div>📋</div><p>No leave requests yet. Request your first leave above.</p></div>
        }
      }
    </div>

    @if (modal()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="mhdr">
            <h3>📋 Request Leave</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="mbody">
            <div class="fg">
              <label>Leave Type *</label>
              <select [(ngModel)]="form.type">
                @for (t of leaveTypes; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>
            <div class="frow">
              <div class="fg"><label>Start Date *</label><input type="date" [(ngModel)]="form.startDate" /></div>
              <div class="fg"><label>End Date *</label><input type="date" [(ngModel)]="form.endDate" /></div>
            </div>
            <div class="fg"><label>Reason</label><textarea [(ngModel)]="form.reason" rows="3" placeholder="Brief reason for leave…"></textarea></div>
          </div>
          <div class="mfooter">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="submit()">
              {{ saving() ? 'Submitting…' : 'Submit Request' }}
            </button>
          </div>
          @if (err()) { <div class="ferr">⚠️ {{ err() }}</div> }
        </div>
      </div>
    }

    @if (toast()) { <div class="toast">{{ toast() }}</div> }
  `,
  styles: [`
    .ml { padding: 24px; max-width: 700px; margin: 0 auto; color: white; }
    .ml-hdr { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
    .ml-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
    .ml-sub { font-size: 13px; color: #64748b; margin: 0; }
    .loading { text-align: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .leave-list { display: flex; flex-direction: column; gap: 10px; }
    .leave-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .lc-body { flex: 1; }
    .lc-top { display: flex; gap: 8px; align-items: center; margin-bottom: 5px; }
    .leave-type { font-size: 12px; font-weight: 700; color: #a5b4fc; background: rgba(99,102,241,0.1); padding: 2px 8px; border-radius: 6px; }
    .days-badge { font-size: 11px; font-weight: 700; color: #64748b; background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 6px; }
    .lc-dates { font-size: 13px; color: #94a3b8; margin-bottom: 4px; }
    .lc-reason { font-size: 12px; color: #64748b; font-style: italic; }
    .lc-note { font-size: 12px; color: #94a3b8; margin-top: 3px; }
    .lc-by { font-size: 11px; color: #475569; margin-top: 2px; }
    .status-badge { padding: 5px 11px; border-radius: 20px; font-size: 11px; font-weight: 800; white-space: nowrap; flex-shrink: 0; }
    .empty { text-align: center; padding: 60px; color: #64748b; }
    .empty > div:first-child { font-size: 40px; margin-bottom: 10px; }
    .btn-primary { padding: 10px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; &:disabled { opacity: 0.5; } }
    .btn-ghost { padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #0f1623; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 420px; animation: popIn 0.2s ease; }
    @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .mhdr { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .mhdr h3 { font-size: 14px; font-weight: 800; margin: 0; }
    .close-btn { width: 26px; height: 26px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; }
    .mbody { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
    .mfooter { padding: 12px 18px; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07); }
    .ferr { margin: 0 18px 14px; padding: 9px 12px; border-radius: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; font-size: 12px; }
    .fg { display: flex; flex-direction: column; gap: 5px; }
    .frow { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    label { font-size: 12px; color: #94a3b8; font-weight: 600; }
    input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 11px; color: white; font-size: 13px; outline: none; &:focus { border-color: rgba(99,102,241,0.5); } option { background: #1e293b; } }
    textarea { resize: vertical; min-height: 72px; }
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 600; }
  `]
})
export class MyLeaves implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private base = environment.apiUrl;

  leaves = signal<any[]>([]);
  loading = signal(true);
  modal = signal(false);
  saving = signal(false);
  err = signal('');
  toast = signal('');

  form = { type: DEFAULT_LEAVE_TYPE, startDate: '', endDate: '', reason: '' };
  leaveTypes = LEAVE_TYPES;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const token = this.auth.token();
    firstValueFrom(
      this.http.get<{ leaves: any[] }>(`${this.base}${API_PATHS.HR.SELF_DOCTOR_LEAVES}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ).then(r => { this.leaves.set(r.leaves); this.loading.set(false); })
     .catch(() => this.loading.set(false));
  }

  openModal(): void { this.form = { type: DEFAULT_LEAVE_TYPE, startDate: '', endDate: '', reason: '' }; this.err.set(''); this.modal.set(true); }
  closeModal(): void { this.modal.set(false); }

  async submit(): Promise<void> {
    if (!this.form.startDate || !this.form.endDate) { this.err.set('Start and end dates are required'); return; }
    this.saving.set(true);
    const token = this.auth.token();
    try {
      await firstValueFrom(
        this.http.post(`${this.base}${API_PATHS.HR.SELF_DOCTOR_LEAVE}`, this.form, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      this.modal.set(false);
      this.showToast('Leave request submitted ✓');
      this.load();
    } catch (e: any) {
      this.err.set(e?.error?.error ?? 'Failed to submit request');
    } finally {
      this.saving.set(false);
    }
  }

  statusStyle(s: string): { bg: string; color: string } {
    return LEAVE_STATUS_STYLES[s] ?? LEAVE_STATUS_FALLBACK_STYLE;
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
