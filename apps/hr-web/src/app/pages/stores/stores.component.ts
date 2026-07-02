import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HrApiService } from '../../services/hr-api.service';
import { StoreInfo } from '../../models';

@Component({
  selector: 'app-stores',
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">🏪 Store Management</h1>
          <p class="page-sub">Create stores, assign managers and staff</p>
        </div>
        <button class="btn-primary" (click)="openCreateStore()">+ New Store</button>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="store-grid">
          @for (store of stores(); track store.id) {
            <div class="store-card">
              <div class="store-header">
                <div class="store-icon">🏪</div>
                <div class="store-info">
                  <div class="store-name">{{ store.name }}</div>
                  <div class="store-code">{{ store.code }}</div>
                </div>
                <div class="store-status" [class.inactive]="!store.isActive">
                  {{ store.isActive ? 'Active' : 'Inactive' }}
                </div>
              </div>

              @if (store.address) {
                <div class="store-addr">📍 {{ store.address }}</div>
              }
              @if (store.phone) {
                <div class="store-addr">📞 {{ store.phone }}</div>
              }

              <div class="store-stats">
                <div class="stat">
                  <span class="stat-n">{{ store._count?.staff ?? 0 }}</span>
                  <span class="stat-l">Staff</span>
                </div>
                <div class="stat">
                  <span class="stat-n">{{ managerCount(store) }}</span>
                  <span class="stat-l">Managers</span>
                </div>
              </div>

              <!-- Managers list -->
              @if ((store.staff ?? []).length > 0) {
                <div class="managers-section">
                  <div class="ms-title">Managers</div>
                  @for (m of store.staff ?? []; track m.id) {
                    <div class="manager-row">
                      <div class="m-avatar">{{ m.name.charAt(0).toUpperCase() }}</div>
                      <div class="m-info">
                        <div class="m-name">{{ m.name }}</div>
                        @if (m.email) { <div class="m-email">{{ m.email }}</div> }
                      </div>
                      <span class="m-status" [style.color]="m.isActive ? '#4ade80' : '#f87171'">
                        {{ m.isActive ? '● Active' : '● Inactive' }}
                      </span>
                    </div>
                  }
                </div>
              }

              <div class="store-actions">
                <button class="btn-sec" (click)="openCreateManager(store)">+ Manager</button>
                <button class="btn-sec" (click)="openCreateStaff(store)">+ Staff</button>
              </div>
            </div>
          }
        </div>

        @if (stores().length === 0) {
          <div class="empty">
            <div class="ei">🏪</div>
            <h3>No stores yet</h3>
            <p>Create your first store to get started.</p>
            <button class="btn-primary" (click)="openCreateStore()">Create Store</button>
          </div>
        }
      }
    </div>

    <!-- Create Store Modal -->
    @if (modal() === 'store') {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🏪 Create New Store</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="fg">
              <label>Store Name *</label>
              <input [(ngModel)]="storeForm.name" placeholder="e.g. Main Branch" />
            </div>
            <div class="fg">
              <label>Store Code * (unique, e.g. MAIN01)</label>
              <input [(ngModel)]="storeForm.code" placeholder="MAIN01" style="text-transform:uppercase" />
            </div>
            <div class="fg">
              <label>Address</label>
              <textarea [(ngModel)]="storeForm.address" rows="2" placeholder="Full address..."></textarea>
            </div>
            <div class="fg">
              <label>Phone</label>
              <input [(ngModel)]="storeForm.phone" placeholder="+91 99999 00000" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="saveStore()">
              {{ saving() ? 'Creating…' : 'Create Store' }}
            </button>
          </div>
          @if (error()) { <div class="error-msg">⚠️ {{ error() }}</div> }
        </div>
      </div>
    }

    <!-- Create Manager Modal -->
    @if (modal() === 'manager') {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>👔 Add Manager — {{ selectedStore()?.name }}</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="info-box">
              Managers log in with <strong>email + password</strong> on the Store App.
            </div>
            <div class="fg">
              <label>Full Name *</label>
              <input [(ngModel)]="managerForm.name" placeholder="Store Manager Name" />
            </div>
            <div class="fg">
              <label>Email *</label>
              <input type="email" [(ngModel)]="managerForm.email" placeholder="manager@store.com" />
            </div>
            <div class="fg">
              <label>Password * (min 6 characters)</label>
              <input type="password" [(ngModel)]="managerForm.password" placeholder="Set a strong password" />
            </div>
            <div class="fg">
              <label>Designation</label>
              <input [(ngModel)]="managerForm.designation" placeholder="Store Manager" />
            </div>
            <div class="fg">
              <label>Joining Date</label>
              <input type="date" [(ngModel)]="managerForm.joiningDate" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="saveManager()">
              {{ saving() ? 'Creating…' : 'Create Manager' }}
            </button>
          </div>
          @if (error()) { <div class="error-msg">⚠️ {{ error() }}</div> }
        </div>
      </div>
    }

    <!-- Create Staff Modal -->
    @if (modal() === 'staff') {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🧑‍💼 Add Staff — {{ selectedStore()?.name }}</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="info-box">
              Staff log in with a <strong>PIN</strong> on the Store App — no email needed.
            </div>
            <div class="fg">
              <label>Full Name *</label>
              <input [(ngModel)]="staffForm.name" placeholder="Staff Member Name" />
            </div>
            <div class="fg">
              <label>Staff Code * (unique ID, e.g. S001)</label>
              <input [(ngModel)]="staffForm.staffCode" placeholder="S001" style="text-transform:uppercase" />
            </div>
            <div class="fg">
              <label>PIN * (4–8 digits)</label>
              <input type="password" [(ngModel)]="staffForm.pin" placeholder="e.g. 1234" maxlength="8" />
            </div>
            <div class="fg">
              <label>Designation</label>
              <input [(ngModel)]="staffForm.designation" placeholder="Store Assistant" />
            </div>
            <div class="fg">
              <label>Phone</label>
              <input type="tel" [(ngModel)]="staffForm.phone" placeholder="+91 99999 00000" />
            </div>
            <div class="fg">
              <label>Joining Date</label>
              <input type="date" [(ngModel)]="staffForm.joiningDate" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="saveStaff()">
              {{ saving() ? 'Creating…' : 'Add Staff' }}
            </button>
          </div>
          @if (error()) { <div class="error-msg">⚠️ {{ error() }}</div> }
        </div>
      </div>
    }

    <!-- Success toast -->
    @if (toast()) {
      <div class="toast">✅ {{ toast() }}</div>
    }
  `,
  styles: [`
    .page { padding: 24px; max-width: 960px; margin: 0 auto; color: white; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 12px; }
    .page-title { font-size: 22px; font-weight: 800; margin: 0 0 4px; }
    .page-sub { font-size: 14px; color: #64748b; margin: 0; }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 36px; height: 36px; border: 3px solid rgba(8,145,178,0.2); border-top-color: #0891b2; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .store-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

    .store-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 18px;
      padding: 18px;
      transition: border-color 0.2s;
      &:hover { border-color: rgba(8,145,178,0.25); }
    }

    .store-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .store-icon { font-size: 28px; }
    .store-info { flex: 1; }
    .store-name { font-size: 16px; font-weight: 800; }
    .store-code { font-size: 12px; color: #64748b; font-family: monospace; margin-top: 2px; }
    .store-status { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: rgba(74,222,128,0.1); color: #4ade80; &.inactive { background: rgba(248,113,113,0.1); color: #f87171; } }
    .store-addr { font-size: 13px; color: #64748b; margin-bottom: 5px; }

    .store-stats { display: flex; gap: 12px; margin: 12px 0; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 10px; }
    .stat { flex: 1; text-align: center; }
    .stat-n { display: block; font-size: 20px; font-weight: 800; color: #06b6d4; }
    .stat-l { font-size: 11px; color: #64748b; }

    .managers-section { margin: 12px 0; }
    .ms-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
    .manager-row { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.04); &:last-child { border: none; } }
    .m-avatar { width: 30px; height: 30px; border-radius: 9px; background: rgba(8,145,178,0.15); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #06b6d4; }
    .m-info { flex: 1; }
    .m-name { font-size: 13px; font-weight: 600; }
    .m-email { font-size: 11px; color: #64748b; }
    .m-status { font-size: 11px; font-weight: 600; white-space: nowrap; }

    .store-actions { display: flex; gap: 8px; margin-top: 14px; }
    .btn-sec { flex: 1; padding: 9px; border-radius: 9px; border: 1px solid rgba(8,145,178,0.25); background: transparent; color: #06b6d4; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; &:hover { background: rgba(8,145,178,0.1); } }

    .empty { text-align: center; padding: 60px 20px; }
    .ei { font-size: 52px; margin-bottom: 12px; }
    .empty h3 { font-size: 18px; margin: 0 0 8px; }
    .empty p { color: #64748b; margin: 0 0 20px; font-size: 14px; }

    /* Buttons */
    .btn-primary { padding: 10px 20px; border-radius: 10px; border: none; background: linear-gradient(135deg,#0891b2,#0e7490); color: white; font-size: 14px; font-weight: 700; cursor: pointer; white-space: nowrap; &:disabled { opacity: 0.5; } }
    .btn-ghost { padding: 10px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: #94a3b8; font-size: 14px; cursor: pointer; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 400; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #0a1628; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 440px; max-height: 90vh; overflow-y: auto; animation: popIn 0.2s ease; }
    @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .modal-header h2 { font-size: 16px; font-weight: 800; margin: 0; }
    .close-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; }

    .modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .modal-footer { padding: 14px 20px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07); }

    .info-box { background: rgba(8,145,178,0.08); border: 1px solid rgba(8,145,178,0.2); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #94a3b8; }
    .info-box strong { color: #06b6d4; }

    .fg { display: flex; flex-direction: column; gap: 5px; }
    label { font-size: 12px; color: #94a3b8; font-weight: 600; }
    input, select, textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; color: white; font-size: 14px; outline: none; transition: border-color 0.2s; &:focus { border-color: rgba(8,145,178,0.5); } }
    textarea { resize: vertical; min-height: 60px; }

    .error-msg { margin: 0 20px 16px; padding: 10px 14px; border-radius: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; font-size: 13px; }

    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.15); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; z-index: 500; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  `]
})
export class StoresComponent implements OnInit {
  private api = inject(HrApiService);

  stores = signal<StoreInfo[]>([]);
  loading = signal(true);
  saving = signal(false);
  modal = signal<'store' | 'manager' | 'staff' | null>(null);
  selectedStore = signal<StoreInfo | null>(null);
  error = signal('');
  toast = signal('');

  storeForm = { name: '', code: '', address: '', phone: '' };
  managerForm = { name: '', email: '', password: '', designation: 'Store Manager', joiningDate: '' };
  staffForm = { name: '', staffCode: '', pin: '', designation: 'Store Assistant', phone: '', joiningDate: '' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getStores().subscribe({
      next: (r) => { this.stores.set(r.stores); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  managerCount(store: StoreInfo): number {
    return (store.staff ?? []).length;
  }

  openCreateStore(): void {
    this.storeForm = { name: '', code: '', address: '', phone: '' };
    this.error.set('');
    this.modal.set('store');
  }

  openCreateManager(store: StoreInfo): void {
    this.selectedStore.set(store);
    this.managerForm = { name: '', email: '', password: '', designation: 'Store Manager', joiningDate: '' };
    this.error.set('');
    this.modal.set('manager');
  }

  openCreateStaff(store: StoreInfo): void {
    this.selectedStore.set(store);
    this.staffForm = { name: '', staffCode: '', pin: '', designation: 'Store Assistant', phone: '', joiningDate: '' };
    this.error.set('');
    this.modal.set('staff');
  }

  closeModal(): void { this.modal.set(null); this.error.set(''); }

  saveStore(): void {
    if (!this.storeForm.name || !this.storeForm.code) { this.error.set('Name and code are required'); return; }
    this.saving.set(true);
    this.error.set('');
    this.api.createStore(this.storeForm).subscribe({
      next: (r) => {
        this.stores.update(list => [...list, { ...r.store, _count: { staff: 0 }, staff: [] }]);
        this.saving.set(false);
        this.modal.set(null);
        this.showToast(`Store "${r.store.name}" created`);
      },
      error: (e) => { this.error.set(e?.error?.error ?? 'Failed to create store'); this.saving.set(false); }
    });
  }

  saveManager(): void {
    if (!this.managerForm.name || !this.managerForm.email || !this.managerForm.password) {
      this.error.set('Name, email and password are required'); return;
    }
    if (this.managerForm.password.length < 6) { this.error.set('Password must be at least 6 characters'); return; }
    this.saving.set(true);
    this.error.set('');
    this.api.createManager(this.selectedStore()!.id, this.managerForm).subscribe({
      next: (r) => {
        this.load();
        this.saving.set(false);
        this.modal.set(null);
        this.showToast(`Manager "${r.staff.name}" created`);
      },
      error: (e) => { this.error.set(e?.error?.error ?? 'Failed to create manager'); this.saving.set(false); }
    });
  }

  saveStaff(): void {
    if (!this.staffForm.name || !this.staffForm.staffCode || !this.staffForm.pin) {
      this.error.set('Name, staff code and PIN are required'); return;
    }
    if (this.staffForm.pin.length < 4) { this.error.set('PIN must be at least 4 digits'); return; }
    this.saving.set(true);
    this.error.set('');
    this.api.createStoreStaff(this.selectedStore()!.id, this.staffForm).subscribe({
      next: (r) => {
        this.load();
        this.saving.set(false);
        this.modal.set(null);
        this.showToast(`Staff "${r.staff.name}" added to ${this.selectedStore()?.name}`);
      },
      error: (e) => { this.error.set(e?.error?.error ?? 'Failed to create staff'); this.saving.set(false); }
    });
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
