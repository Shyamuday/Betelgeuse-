import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_PATHS } from '../../../core/constants/api-paths.constants';
import { TOAST_DURATION_MS } from '../../../core/constants/timing.constants';
import { Auth } from '../../../core/services/auth';
import { SLOT_TEMPLATES, WEEKDAY_SHORT_LABELS } from '../constants/slot-templates.constants';

interface Slot { id: string; date: string; startTime: string; endTime: string; isBooked: boolean; isBlocked: boolean; }

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function generateSlots(start: string, end: string, stepMins: number): { startTime: string; endTime: string }[] {
  const result: { startTime: string; endTime: string }[] = [];
  let cur = start;
  while (cur < end) {
    const next = addMinutes(cur, stepMins);
    if (next > end) break;
    result.push({ startTime: cur, endTime: next });
    cur = next;
  }
  return result;
}

@Component({
  selector: 'app-slots-page',
  imports: [FormsModule],
  template: `
    <div class="sp">
      <div class="sp-hdr">
        <div>
          <h2 class="sp-title">📅 Availability & Slots</h2>
          <p class="sp-sub">Manage your time slots — patients can see open slots when booking</p>
        </div>
      </div>

      <!-- Date nav -->
      <div class="date-nav">
        <button class="nav-btn" (click)="prevWeek()">‹</button>
        <div class="week-dates">
          @for (d of weekDates(); track d.iso) {
            <button class="day-btn" [class.active]="selectedDate() === d.iso" (click)="selectDate(d.iso)">
              <span class="day-lbl">{{ d.day }}</span>
              <span class="day-num">{{ d.num }}</span>
            </button>
          }
        </div>
        <button class="nav-btn" (click)="nextWeek()">›</button>
      </div>

      <!-- Bulk template -->
      <div class="template-row">
        <span class="tmpl-lbl">Quick add:</span>
        @for (t of templates; track t.label) {
          <button class="tmpl-btn" (click)="addTemplate(t)">{{ t.label }}</button>
        }
        <button class="tmpl-btn danger" (click)="clearDay()">🗑 Clear day</button>
      </div>

      <!-- Manual add -->
      <div class="manual-add">
        <input type="time" [(ngModel)]="newStart" />
        <span>to</span>
        <input type="time" [(ngModel)]="newEnd" />
        <button class="btn-primary" (click)="addSlot()">+ Add Slot</button>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="slot-grid">
          @for (s of slots(); track s.id) {
            <div class="slot-card" [class.booked]="s.isBooked" [class.blocked]="s.isBlocked">
              <div class="slot-time">{{ s.startTime }} – {{ s.endTime }}</div>
              <div class="slot-status">
                @if (s.isBooked) { <span class="badge booked">Booked</span> }
                @else if (s.isBlocked) { <span class="badge blocked">Blocked</span> }
                @else { <span class="badge open">Open</span> }
              </div>
              <div class="slot-actions">
                @if (!s.isBooked) {
                  <button class="icon-btn" (click)="toggleBlock(s)" [title]="s.isBlocked ? 'Unblock' : 'Block'">
                    {{ s.isBlocked ? '🔓' : '🔒' }}
                  </button>
                  <button class="icon-btn danger" (click)="deleteSlot(s.id)" title="Delete">✕</button>
                }
              </div>
            </div>
          }
        </div>
        @if (slots().length === 0) {
          <div class="empty">
            <div>📅</div>
            <p>No slots for {{ selectedDate() }}. Use "Quick add" above or add manually.</p>
          </div>
        }
      }
    </div>
    @if (toast()) { <div class="toast">{{ toast() }}</div> }
  `,
  styles: [`
    .sp { padding: 24px; max-width: 800px; margin: 0 auto; color: white; }
    .sp-hdr { margin-bottom: 20px; }
    .sp-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
    .sp-sub { font-size: 13px; color: #64748b; margin: 0; }

    .date-nav { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 10px 14px; }
    .nav-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #a5b4fc; font-size: 18px; cursor: pointer; flex-shrink: 0; }
    .week-dates { display: flex; gap: 6px; flex: 1; justify-content: center; flex-wrap: wrap; }
    .day-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 7px 10px; border-radius: 10px; border: 1px solid transparent; background: transparent; color: #94a3b8; cursor: pointer; min-width: 44px; &.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #a5b4fc; } }
    .day-lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .day-num { font-size: 14px; font-weight: 800; }

    .template-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 10px; }
    .tmpl-lbl { font-size: 12px; color: #64748b; font-weight: 600; }
    .tmpl-btn { padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(99,102,241,0.25); background: rgba(99,102,241,0.06); color: #a5b4fc; font-size: 12px; font-weight: 600; cursor: pointer; &.danger { border-color: rgba(248,113,113,0.25); background: rgba(248,113,113,0.06); color: #f87171; } }

    .manual-add { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .manual-add input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 10px; color: white; font-size: 13px; outline: none; &:focus { border-color: rgba(99,102,241,0.5); } }
    .manual-add span { color: #64748b; font-size: 13px; }
    .btn-primary { padding: 9px 16px; border-radius: 9px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 13px; font-weight: 700; cursor: pointer; }

    .loading { text-align: center; padding: 40px; }
    .spinner { width: 28px; height: 28px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 10px; }
    .slot-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 6px; &.booked { border-color: rgba(251,146,60,0.2); background: rgba(251,146,60,0.04); } &.blocked { border-color: rgba(148,163,184,0.2); background: rgba(148,163,184,0.04); } }
    .slot-time { font-size: 14px; font-weight: 800; }
    .slot-status .badge { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; &.open { background: rgba(74,222,128,0.12); color: #4ade80; } &.booked { background: rgba(251,146,60,0.12); color: #fb923c; } &.blocked { background: rgba(148,163,184,0.12); color: #94a3b8; } }
    .slot-actions { display: flex; gap: 5px; margin-top: 4px; }
    .icon-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: #94a3b8; font-size: 12px; cursor: pointer; &.danger { border-color: rgba(248,113,113,0.2); color: #f87171; } }

    .empty { text-align: center; padding: 40px; color: #64748b; }
    .empty > div:first-child { font-size: 36px; margin-bottom: 10px; }

    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 600; }
  `]
})
export class SlotsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private base = environment.apiUrl;

  slots = signal<Slot[]>([]);
  loading = signal(true);
  toast = signal('');
  selectedDate = signal(this.today());
  weekStart = signal(this.mondayOf(new Date()));
  weekDates = signal(this.buildWeek(this.mondayOf(new Date())));

  newStart = '09:00';
  newEnd = '09:30';
  templates = SLOT_TEMPLATES;

  ngOnInit(): void { this.load(); }

  today(): string { return new Date().toISOString().slice(0, 10); }

  mondayOf(d: Date): Date {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  buildWeek(monday: Date): { iso: string; day: string; num: string }[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        iso: d.toISOString().slice(0, 10),
        day: WEEKDAY_SHORT_LABELS[i],
        num: String(d.getDate())
      };
    });
  }

  prevWeek(): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() - 7);
    this.weekStart.set(d);
    this.weekDates.set(this.buildWeek(d));
  }

  nextWeek(): void {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + 7);
    this.weekStart.set(d);
    this.weekDates.set(this.buildWeek(d));
  }

  selectDate(iso: string): void { this.selectedDate.set(iso); this.load(); }

  load(): void {
    this.loading.set(true);
    const token = this.auth.token();
    firstValueFrom(
      this.http.get<{ slots: Slot[] }>(`${this.base}${API_PATHS.DOCTOR.SLOTS}`, {
        params: { date: this.selectedDate() },
        headers: { Authorization: `Bearer ${token}` }
      })
    ).then(r => { this.slots.set(r.slots); this.loading.set(false); })
     .catch(() => this.loading.set(false));
  }

  async addSlot(): Promise<void> {
    if (!this.newStart || !this.newEnd || this.newEnd <= this.newStart) {
      this.showToast('Invalid time range'); return;
    }
    const token = this.auth.token();
    try {
      await firstValueFrom(
        this.http.post<{ slot: Slot }>(`${this.base}${API_PATHS.DOCTOR.SLOTS}`, {
          date: this.selectedDate(), startTime: this.newStart, endTime: this.newEnd
        }, { headers: { Authorization: `Bearer ${token}` } })
      );
      this.load();
    } catch (e: any) {
      this.showToast(e?.error?.message ?? 'Failed to add slot');
    }
  }

  async addTemplate(t: { start: string; end: string; step: number }): Promise<void> {
    const slotsToCreate = generateSlots(t.start, t.end, t.step);
    const token = this.auth.token();
    let added = 0;
    for (const s of slotsToCreate) {
      try {
        await firstValueFrom(
          this.http.post(`${this.base}${API_PATHS.DOCTOR.SLOTS}`, {
            date: this.selectedDate(), startTime: s.startTime, endTime: s.endTime
          }, { headers: { Authorization: `Bearer ${token}` } })
        );
        added++;
      } catch { /* skip existing */ }
    }
    this.showToast(`Added ${added} slot${added !== 1 ? 's' : ''} ✓`);
    this.load();
  }

  async clearDay(): Promise<void> {
    const openSlots = this.slots().filter(s => !s.isBooked);
    const token = this.auth.token();
    for (const s of openSlots) {
      await firstValueFrom(
        this.http.delete(`${this.base}${API_PATHS.DOCTOR.SLOTS}/${s.id}`, { headers: { Authorization: `Bearer ${token}` } })
      ).catch(() => {});
    }
    this.showToast('Day cleared');
    this.load();
  }

  async toggleBlock(s: Slot): Promise<void> {
    const token = this.auth.token();
    await firstValueFrom(
      this.http.patch(`${this.base}${API_PATHS.DOCTOR.SLOTS}/${s.id}`, { isBlocked: !s.isBlocked }, { headers: { Authorization: `Bearer ${token}` } })
    );
    this.load();
  }

  async deleteSlot(id: string): Promise<void> {
    const token = this.auth.token();
    await firstValueFrom(
      this.http.delete(`${this.base}${API_PATHS.DOCTOR.SLOTS}/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    );
    this.slots.update(list => list.filter(s => s.id !== id));
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
