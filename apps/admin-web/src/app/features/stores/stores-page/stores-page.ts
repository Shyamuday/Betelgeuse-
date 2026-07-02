import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin-api';
import { TOAST_DURATION_MS } from '../../../core/constants/timing.constants';
import {
  STORE_APP_PORT,
  STORE_FORM_DEFAULTS,
  STORE_MODAL_TYPES,
  STORE_STATUS_COLORS,
  STORE_VALIDATION,
  type StoreModalType
} from '../constants/store-form.constants';

@Component({
  selector: 'app-stores-page',
  imports: [FormsModule],
  template: `
    <div class="sp">
      <div class="sp-hdr">
        <div>
          <h2 class="sp-title">🏪 Store Management</h2>
          <p class="sp-sub">Create stores, assign managers and staff from here</p>
        </div>
        <button class="btn-primary" (click)="openModal('store')">+ New Store</button>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="store-grid">
          @for (s of stores(); track s.id) {
            <div class="store-card">
              <div class="sc-hdr">
                <div class="sc-icon">🏪</div>
                <div class="sc-info">
                  <div class="sc-name">{{ s.name }}</div>
                  <div class="sc-code">{{ s.code }}</div>
                </div>
                <div class="sc-status" [class.off]="!s.isActive">{{ s.isActive ? 'Active' : 'Inactive' }}</div>
              </div>
              @if (s.address) { <div class="sc-detail">📍 {{ s.address }}</div> }
              @if (s.phone)   { <div class="sc-detail">📞 {{ s.phone }}</div> }

              <div class="sc-stats">
                <div class="sc-stat"><span class="sn">{{ s._count?.staff ?? 0 }}</span><span class="sl">Total Staff</span></div>
                <div class="sc-stat"><span class="sn">{{ (s.staff ?? []).length }}</span><span class="sl">Managers</span></div>
              </div>

              @if ((s.staff ?? []).length > 0) {
                <div class="mgr-list">
                  <div class="mgr-title">Managers</div>
                  @for (m of s.staff ?? []; track m.id) {
                    <div class="mgr-row">
                      <div class="mgr-av">{{ m.name.charAt(0).toUpperCase() }}</div>
                      <div class="mgr-info">
                        <div class="mgr-name">{{ m.name }}</div>
                        @if (m.email) { <div class="mgr-email">{{ m.email }}</div> }
                      </div>
                      <span class="mgr-dot" [style.color]="m.isActive ? storeStatusColors.ACTIVE : storeStatusColors.INACTIVE">{{ m.isActive ? '●' : '○' }}</span>
                    </div>
                  }
                </div>
              }

              <div class="sc-actions">
                <button class="btn-sec" (click)="openManagerModal(s)">+ Manager</button>
                <button class="btn-sec" (click)="openStaffModal(s)">+ Staff</button>
              </div>
            </div>
          }
        </div>
        @if (stores().length === 0) {
          <div class="empty">
            <div>🏪</div>
            <h3>No stores yet</h3>
            <p>Create your first store to get started.</p>
            <button class="btn-primary" (click)="openModal('store')">Create Store</button>
          </div>
        }
      }
    </div>

    <!-- Create Store -->
    @if (modal() === 'store') {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="mhdr"><h3>🏪 New Store</h3><button class="close-btn" (click)="closeModal()">✕</button></div>
          <div class="mbody">
            <div class="fg"><label>Store Name *</label><input [(ngModel)]="storeForm.name" placeholder="e.g. Main Branch" /></div>
            <div class="fg"><label>Store Code * (unique)</label><input [(ngModel)]="storeForm.code" placeholder="MAIN01" style="text-transform:uppercase" /></div>
            <div class="fg"><label>Address</label><textarea [(ngModel)]="storeForm.address" rows="2" placeholder="Full address…"></textarea></div>
            <div class="fg"><label>Phone</label><input [(ngModel)]="storeForm.phone" placeholder="+91 99999 00000" /></div>
          </div>
          <div class="mfooter">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="saveStore()">{{ saving() ? 'Creating…' : 'Create Store' }}</button>
          </div>
          @if (err()) { <div class="ferr">⚠️ {{ err() }}</div> }
        </div>
      </div>
    }

    <!-- Add Manager -->
    @if (modal() === 'manager') {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="mhdr"><h3>👔 Add Manager — {{ selectedStore()?.name }}</h3><button class="close-btn" (click)="closeModal()">✕</button></div>
          <div class="mbody">
            <div class="info-box">Managers log in with <strong>email + password</strong> on the Store App (port {{ storeAppPort }})</div>
            <div class="fg"><label>Full Name *</label><input [(ngModel)]="mgrForm.name" placeholder="Manager Name" /></div>
            <div class="fg"><label>Email *</label><input type="email" [(ngModel)]="mgrForm.email" placeholder="manager@store.com" /></div>
            <div class="fg"><label>Password * (min 6 chars)</label><input type="password" [(ngModel)]="mgrForm.password" /></div>
            <div class="fg"><label>Designation</label><input [(ngModel)]="mgrForm.designation" placeholder="Store Manager" /></div>
            <div class="fg"><label>Joining Date</label><input type="date" [(ngModel)]="mgrForm.joiningDate" /></div>
          </div>
          <div class="mfooter">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="saveManager()">{{ saving() ? 'Creating…' : 'Add Manager' }}</button>
          </div>
          @if (err()) { <div class="ferr">⚠️ {{ err() }}</div> }
        </div>
      </div>
    }

    <!-- Add Staff -->
    @if (modal() === 'staff') {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="mhdr"><h3>🧑‍💼 Add Staff — {{ selectedStore()?.name }}</h3><button class="close-btn" (click)="closeModal()">✕</button></div>
          <div class="mbody">
            <div class="info-box">Staff log in with a <strong>PIN</strong> on the Store App — no email needed</div>
            <div class="fg"><label>Full Name *</label><input [(ngModel)]="staffForm.name" placeholder="Staff Name" /></div>
            <div class="fg"><label>Staff Code * (unique ID)</label><input [(ngModel)]="staffForm.staffCode" placeholder="S001" style="text-transform:uppercase" /></div>
            <div class="fg"><label>PIN * (4–8 digits)</label><input type="password" [(ngModel)]="staffForm.pin" maxlength="8" placeholder="e.g. 1234" /></div>
            <div class="fg"><label>Designation</label><input [(ngModel)]="staffForm.designation" placeholder="Store Assistant" /></div>
            <div class="fg"><label>Phone</label><input type="tel" [(ngModel)]="staffForm.phone" /></div>
            <div class="fg"><label>Joining Date</label><input type="date" [(ngModel)]="staffForm.joiningDate" /></div>
          </div>
          <div class="mfooter">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="saveStaff()">{{ saving() ? 'Adding…' : 'Add Staff' }}</button>
          </div>
          @if (err()) { <div class="ferr">⚠️ {{ err() }}</div> }
        </div>
      </div>
    }

    @if (toast()) { <div class="toast">{{ toast() }}</div> }
  `,
  styles: [`
    .sp { padding: 24px; max-width: 960px; margin: 0 auto; color: white; }
    .sp-hdr { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
    .sp-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
    .sp-sub { font-size: 13px; color: #64748b; margin: 0; }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .store-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
    .store-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; transition: border-color 0.2s; &:hover { border-color: rgba(99,102,241,0.2); } }

    .sc-hdr { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .sc-icon { font-size: 26px; }
    .sc-info { flex: 1; }
    .sc-name { font-size: 15px; font-weight: 800; }
    .sc-code { font-size: 11px; color: #64748b; font-family: monospace; }
    .sc-status { padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 700; background: rgba(74,222,128,0.1); color: #4ade80; &.off { background: rgba(248,113,113,0.1); color: #f87171; } }
    .sc-detail { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .sc-stats { display: flex; gap: 10px; margin: 12px 0; background: rgba(255,255,255,0.03); border-radius: 10px; padding: 10px; }
    .sc-stat { flex: 1; text-align: center; }
    .sn { display: block; font-size: 18px; font-weight: 800; color: #a5b4fc; }
    .sl { font-size: 11px; color: #64748b; }

    .mgr-list { margin: 10px 0; }
    .mgr-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 7px; }
    .mgr-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); &:last-child { border: none; } }
    .mgr-av { width: 28px; height: 28px; border-radius: 8px; background: rgba(99,102,241,0.15); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #a5b4fc; }
    .mgr-info { flex: 1; }
    .mgr-name { font-size: 12px; font-weight: 600; }
    .mgr-email { font-size: 11px; color: #64748b; }
    .mgr-dot { font-size: 12px; }

    .sc-actions { display: flex; gap: 8px; margin-top: 14px; }
    .btn-sec { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid rgba(99,102,241,0.25); background: transparent; color: #a5b4fc; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; &:hover { background: rgba(99,102,241,0.1); } }

    .empty { text-align: center; padding: 60px 20px; }
    .empty > div:first-child { font-size: 48px; margin-bottom: 12px; }
    .empty h3 { margin: 0 0 8px; }
    .empty p { color: #64748b; font-size: 14px; margin: 0 0 20px; }

    .btn-primary { padding: 10px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; &:disabled { opacity: 0.5; } }
    .btn-ghost { padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #0f1623; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 420px; max-height: 88vh; overflow-y: auto; animation: popIn 0.2s ease; }
    @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .mhdr { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .mhdr h3 { font-size: 14px; font-weight: 800; margin: 0; }
    .close-btn { width: 26px; height: 26px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; }
    .mbody { padding: 14px 18px; display: flex; flex-direction: column; gap: 10px; }
    .mfooter { padding: 12px 18px; display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07); }
    .ferr { margin: 0 18px 14px; padding: 9px 12px; border-radius: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; font-size: 12px; }
    .fg { display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 12px; color: #94a3b8; font-weight: 600; }
    input, textarea, select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 8px 11px; color: white; font-size: 13px; outline: none; &:focus { border-color: rgba(99,102,241,0.5); } }
    textarea { resize: vertical; min-height: 52px; }
    .info-box { background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 9px; padding: 9px 12px; font-size: 12px; color: #94a3b8; strong { color: #a5b4fc; } }
    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 600; z-index: 600; }
  `]
})
export class StoresPage implements OnInit {
  private api = inject(AdminApi);

  readonly storeAppPort = STORE_APP_PORT;
  readonly storeStatusColors = STORE_STATUS_COLORS;

  stores = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  modal = signal<StoreModalType | null>(null);
  selectedStore = signal<any>(null);
  err = signal('');
  toast = signal('');

  storeForm = { name:'', code:'', address:'', phone:'' };
  mgrForm = { name:'', email:'', password:'', designation: STORE_FORM_DEFAULTS.MANAGER_DESIGNATION, joiningDate:'' };
  staffForm = { name:'', staffCode:'', pin:'', designation: STORE_FORM_DEFAULTS.STAFF_DESIGNATION, phone:'', joiningDate:'' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getAdminStores()
      .then(r => { this.stores.set(r.stores); this.loading.set(false); })
      .catch(() => this.loading.set(false));
  }

  openModal(m: StoreModalType): void { this.err.set(''); this.modal.set(m); }
  openManagerModal(s: any): void {
    this.selectedStore.set(s);
    this.mgrForm = { name:'', email:'', password:'', designation: STORE_FORM_DEFAULTS.MANAGER_DESIGNATION, joiningDate:'' };
    this.err.set('');
    this.modal.set(STORE_MODAL_TYPES.MANAGER);
  }
  openStaffModal(s: any): void {
    this.selectedStore.set(s);
    this.staffForm = { name:'', staffCode:'', pin:'', designation: STORE_FORM_DEFAULTS.STAFF_DESIGNATION, phone:'', joiningDate:'' };
    this.err.set('');
    this.modal.set(STORE_MODAL_TYPES.STAFF);
  }
  closeModal(): void { this.modal.set(null); this.err.set(''); }

  async saveStore(): Promise<void> {
    if (!this.storeForm.name || !this.storeForm.code) { this.err.set('Name and code required'); return; }
    this.saving.set(true);
    try {
      const r = await this.api.createAdminStore(this.storeForm);
      this.stores.update(list => [...list, { ...r.store, _count:{ staff:0 }, staff:[] }]);
      this.modal.set(null);
      this.showToast(`Store "${r.store.name}" created`);
    } catch (e: any) { this.err.set(e?.error?.error ?? 'Failed'); }
    finally { this.saving.set(false); }
  }

  async saveManager(): Promise<void> {
    if (!this.mgrForm.name || !this.mgrForm.email || !this.mgrForm.password) { this.err.set('Name, email and password required'); return; }
    if (this.mgrForm.password.length < STORE_VALIDATION.PASSWORD_MIN_LENGTH) { this.err.set('Password must be 6+ characters'); return; }
    this.saving.set(true);
    try {
      await this.api.createAdminManager(this.selectedStore()!.id, this.mgrForm);
      this.modal.set(null);
      this.showToast(`Manager "${this.mgrForm.name}" added`);
      this.load();
    } catch (e: any) { this.err.set(e?.error?.error ?? 'Failed'); }
    finally { this.saving.set(false); }
  }

  async saveStaff(): Promise<void> {
    if (!this.staffForm.name || !this.staffForm.staffCode || !this.staffForm.pin) { this.err.set('Name, code and PIN required'); return; }
    if (this.staffForm.pin.length < STORE_VALIDATION.PIN_MIN_LENGTH) { this.err.set('PIN must be 4+ digits'); return; }
    this.saving.set(true);
    try {
      await this.api.createAdminStoreStaff(this.selectedStore()!.id, this.staffForm);
      this.modal.set(null);
      this.showToast(`Staff "${this.staffForm.name}" added`);
      this.load();
    } catch (e: any) { this.err.set(e?.error?.error ?? 'Failed'); }
    finally { this.saving.set(false); }
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
