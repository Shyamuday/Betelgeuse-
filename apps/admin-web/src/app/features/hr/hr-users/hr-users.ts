import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin-api';

@Component({
  selector: 'app-hr-users',
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">👥 HR Managers</h2>
          <p class="page-sub">Create HR users and control which stores they can manage</p>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Add HR Manager</button>
      </div>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div></div>
      } @else {
        <div class="hr-grid">
          @for (u of hrUsers(); track u.id) {
            <div class="hr-card">
              <div class="hr-top">
                <div class="hr-avatar">{{ u.name.charAt(0).toUpperCase() }}</div>
                <div class="hr-info">
                  <div class="hr-name">{{ u.name }}</div>
                  <div class="hr-email">{{ u.email }}</div>
                  <div class="hr-desg">{{ u.hrProfile?.designation ?? 'HR Manager' }}</div>
                </div>
                <div class="hr-status" [class.inactive]="!u.isActive">
                  {{ u.isActive ? '● Active' : '● Inactive' }}
                </div>
              </div>

              <!-- Assigned stores -->
              <div class="stores-section">
                <div class="stores-label">Store Access</div>
                @if ((u.storeAccess ?? []).length === 0) {
                  <div class="no-stores">No stores assigned yet</div>
                } @else {
                  <div class="store-chips">
                    @for (s of u.storeAccess ?? []; track s.id) {
                      <div class="store-chip">
                        {{ s.name }}
                        <button class="chip-remove" (click)="revokeAccess(u, s.id)">✕</button>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="hr-actions">
                <button class="btn-assign" (click)="openAssign(u)">🏪 Assign Stores</button>
                <button class="btn-toggle" [class.deact]="u.isActive" (click)="toggleStatus(u)">
                  {{ u.isActive ? 'Deactivate' : 'Activate' }}
                </button>
              </div>
            </div>
          }
        </div>

        @if (hrUsers().length === 0) {
          <div class="empty">
            <div>👥</div>
            <h3>No HR Managers yet</h3>
            <p>Create an HR Manager and assign them stores to manage.</p>
            <button class="btn-primary" (click)="openCreate()">Add First HR Manager</button>
          </div>
        }
      }
    </div>

    <!-- Create HR Modal -->
    @if (modal() === 'create') {
      <div class="overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hdr">
            <h3>➕ New HR Manager</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="fg">
              <label>Full Name *</label>
              <input [(ngModel)]="createForm.name" placeholder="HR Manager Name" />
            </div>
            <div class="fg">
              <label>Email *</label>
              <input type="email" [(ngModel)]="createForm.email" placeholder="hr@clinic.com" />
            </div>
            <div class="fg">
              <label>Password *</label>
              <input type="password" [(ngModel)]="createForm.password" placeholder="Min 8 characters" />
            </div>
            <div class="fg">
              <label>Designation</label>
              <input [(ngModel)]="createForm.designation" placeholder="HR Manager" />
            </div>
            <div class="fg">
              <label>Department</label>
              <input [(ngModel)]="createForm.department" placeholder="Human Resources" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" [disabled]="saving()" (click)="createHr()">
              {{ saving() ? 'Creating…' : 'Create HR Manager' }}
            </button>
          </div>
          @if (error()) { <div class="err">⚠️ {{ error() }}</div> }
        </div>
      </div>
    }

    <!-- Assign Stores Modal -->
    @if (modal() === 'assign' && selectedHr()) {
      <div class="overlay" (click)="closeModal()">
        <div class="modal wide" (click)="$event.stopPropagation()">
          <div class="modal-hdr">
            <h3>🏪 Store Access — {{ selectedHr()!.name }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="access-legend">
              <span class="leg-assigned">● Assigned</span>
              <span class="leg-none">○ Not assigned</span>
            </div>
            <div class="grant-all-row">
              <button class="btn-grant-all" (click)="grantAll()">⚡ Grant All Stores</button>
            </div>
            <div class="store-list">
              @for (s of allStores(); track s.id) {
                <div class="store-row" [class.assigned]="isAssigned(s.id)">
                  <div class="sr-info">
                    <span class="sr-icon">{{ isAssigned(s.id) ? '✅' : '○' }}</span>
                    <div>
                      <div class="sr-name">{{ s.name }}</div>
                      <div class="sr-code">{{ s.code }}{{ s.address ? ' · ' + s.address : '' }}</div>
                    </div>
                  </div>
                  @if (isAssigned(s.id)) {
                    <button class="btn-revoke" (click)="revokeAccess(selectedHr()!, s.id)">Revoke</button>
                  } @else {
                    <button class="btn-grant" (click)="grantAccess(s.id)">Grant</button>
                  }
                </div>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-primary" (click)="closeModal()">Done</button>
          </div>
        </div>
      </div>
    }

    @if (toast()) { <div class="toast">{{ toast() }}</div> }
  `,
  styles: [`
    .page { padding: 24px; max-width: 960px; margin: 0 auto; color: white; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 24px; }
    .page-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
    .page-sub { font-size: 13px; color: #64748b; margin: 0; }

    .loading { text-align: center; padding: 60px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .hr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 14px; }

    .hr-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; padding: 18px; }

    .hr-top { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 14px; }
    .hr-avatar { width: 46px; height: 46px; border-radius: 14px; background: linear-gradient(135deg,#6366f1,#4f46e5); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; flex-shrink: 0; }
    .hr-info { flex: 1; }
    .hr-name { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
    .hr-email { font-size: 12px; color: #64748b; margin-bottom: 2px; }
    .hr-desg { font-size: 12px; color: #94a3b8; }
    .hr-status { font-size: 11px; font-weight: 700; white-space: nowrap; color: #4ade80; &.inactive { color: #f87171; } }

    .stores-section { margin-bottom: 14px; }
    .stores-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
    .no-stores { font-size: 12px; color: #475569; padding: 6px 0; }
    .store-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .store-chip { display: flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; background: rgba(8,145,178,0.1); border: 1px solid rgba(8,145,178,0.25); color: #06b6d4; font-size: 12px; font-weight: 600; }
    .chip-remove { width: 16px; height: 16px; border-radius: 50%; border: none; background: rgba(248,113,113,0.2); color: #f87171; cursor: pointer; font-size: 10px; padding: 0; display: flex; align-items: center; justify-content: center; }

    .hr-actions { display: flex; gap: 8px; }
    .btn-assign { flex: 2; padding: 9px; border-radius: 9px; border: 1px solid rgba(8,145,178,0.25); background: transparent; color: #06b6d4; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; &:hover { background: rgba(8,145,178,0.1); } }
    .btn-toggle { flex: 1; padding: 9px; border-radius: 9px; border: 1px solid rgba(248,113,113,0.25); background: transparent; color: #f87171; font-size: 12px; cursor: pointer; &.deact { border-color: rgba(74,222,128,0.25); color: #4ade80; } }

    .empty { text-align: center; padding: 60px; }
    .empty > div:first-child { font-size: 48px; margin-bottom: 12px; }
    .empty h3 { margin: 0 0 8px; }
    .empty p { color: #64748b; margin: 0 0 20px; font-size: 14px; }

    /* Buttons */
    .btn-primary { padding: 10px 18px; border-radius: 10px; border: none; background: linear-gradient(135deg,#6366f1,#4f46e5); color: white; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; &:disabled { opacity: 0.5; } }
    .btn-ghost { padding: 10px 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: #94a3b8; font-size: 13px; cursor: pointer; }

    /* Modals */
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 500; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .modal { background: #0f1623; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 420px; max-height: 88vh; overflow-y: auto; animation: popIn 0.2s ease; &.wide { max-width: 520px; } }
    @keyframes popIn { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .modal-hdr { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.07); }
    .modal-hdr h3 { font-size: 15px; font-weight: 800; margin: 0; }
    .close-btn { width: 28px; height: 28px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748b; cursor: pointer; }
    .modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .modal-footer { padding: 14px 20px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid rgba(255,255,255,0.07); }

    .fg { display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 12px; color: #94a3b8; font-weight: 600; }
    input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 9px 12px; color: white; font-size: 14px; outline: none; &:focus { border-color: rgba(99,102,241,0.5); } }

    .err { margin: 0 20px 14px; padding: 10px; border-radius: 8px; background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); color: #f87171; font-size: 13px; }

    /* Store assignment */
    .access-legend { display: flex; gap: 16px; font-size: 12px; color: #64748b; }
    .leg-assigned { color: #4ade80; }
    .grant-all-row { text-align: right; }
    .btn-grant-all { padding: 7px 14px; border-radius: 8px; border: 1px solid rgba(99,102,241,0.3); background: rgba(99,102,241,0.1); color: #a5b4fc; font-size: 13px; font-weight: 700; cursor: pointer; }

    .store-list { display: flex; flex-direction: column; gap: 6px; max-height: 360px; overflow-y: auto; }
    .store-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); transition: all 0.15s; &.assigned { background: rgba(74,222,128,0.04); border-color: rgba(74,222,128,0.15); } }
    .sr-info { flex: 1; display: flex; align-items: center; gap: 10px; }
    .sr-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
    .sr-name { font-size: 14px; font-weight: 600; }
    .sr-code { font-size: 11px; color: #64748b; margin-top: 2px; }
    .btn-grant { padding: 5px 14px; border-radius: 7px; border: 1px solid rgba(74,222,128,0.3); background: transparent; color: #4ade80; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-revoke { padding: 5px 14px; border-radius: 7px; border: 1px solid rgba(248,113,113,0.3); background: transparent; color: #f87171; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; }

    .toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 10px 20px; border-radius: 12px; font-size: 14px; font-weight: 600; z-index: 600; }
  `]
})
export class HrUsersComponent implements OnInit {
  private api = inject(AdminApi);

  hrUsers = signal<any[]>([]);
  allStores = signal<any[]>([]);
  assignedStoreIds = signal<Set<string>>(new Set());
  loading = signal(true);
  saving = signal(false);
  modal = signal<'create' | 'assign' | null>(null);
  selectedHr = signal<any>(null);
  error = signal('');
  toast = signal('');

  createForm = { name: '', email: '', password: '', designation: 'HR Manager', department: 'Human Resources' };

  ngOnInit(): void { this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const r = await this.api.getHrUsers();
      // Load store access for each HR user
      const hrWithAccess = await Promise.all(
        (r.hrUsers as any[]).map(async (u: any) => {
          try {
            const a = await this.api.getHrUserStores(u.id);
            return { ...u, storeAccess: a.assigned };
          } catch { return { ...u, storeAccess: [] }; }
        })
      );
      this.hrUsers.set(hrWithAccess);
    } finally { this.loading.set(false); }
  }

  openCreate(): void {
    this.createForm = { name: '', email: '', password: '', designation: 'HR Manager', department: 'Human Resources' };
    this.error.set('');
    this.modal.set('create');
  }

  async openAssign(u: any) {
    this.selectedHr.set(u);
    const r = await this.api.getHrUserStores(u.id);
    this.allStores.set(r.all);
    this.assignedStoreIds.set(new Set((r.assigned as any[]).map((s: any) => s.id)));
    this.modal.set('assign');
  }

  closeModal(): void { this.modal.set(null); this.error.set(''); }

  async createHr() {
    if (!this.createForm.name || !this.createForm.email || !this.createForm.password) {
      this.error.set('Name, email and password are required'); return;
    }
    this.saving.set(true);
    try {
      await this.api.createHrUser(this.createForm);
      this.modal.set(null);
      this.showToast(`HR Manager "${this.createForm.name}" created`);
      this.load();
    } catch (e: any) {
      this.error.set(e?.error?.error ?? 'Failed to create HR user');
    } finally { this.saving.set(false); }
  }

  async grantAccess(storeId: string) {
    const hr = this.selectedHr();
    if (!hr) return;
    await this.api.grantHrStoreAccess(hr.id, storeId);
    this.assignedStoreIds.update(set => new Set([...set, storeId]));
    // Update local list
    const store = this.allStores().find(s => s.id === storeId);
    this.hrUsers.update(list => list.map(u =>
      u.id === hr.id ? { ...u, storeAccess: [...(u.storeAccess ?? []), store] } : u
    ));
    this.showToast(`Access granted`);
  }

  async revokeAccess(hr: any, storeId: string) {
    await this.api.revokeHrStoreAccess(hr.id, storeId);
    this.assignedStoreIds.update(set => { const s = new Set(set); s.delete(storeId); return s; });
    this.hrUsers.update(list => list.map(u =>
      u.id === hr.id ? { ...u, storeAccess: (u.storeAccess ?? []).filter((s: any) => s.id !== storeId) } : u
    ));
    this.showToast(`Access revoked`);
  }

  async grantAll() {
    const hr = this.selectedHr();
    if (!hr) return;
    await this.api.grantAllStores(hr.id);
    const all = this.allStores();
    this.assignedStoreIds.set(new Set(all.map(s => s.id)));
    this.hrUsers.update(list => list.map(u => u.id === hr.id ? { ...u, storeAccess: all } : u));
    this.showToast(`All stores granted`);
  }

  async toggleStatus(u: any) {
    await this.api.setHrUserStatus(u.id, !u.isActive);
    this.hrUsers.update(list => list.map(x => x.id === u.id ? { ...x, isActive: !x.isActive } : x));
    this.showToast(u.isActive ? 'User deactivated' : 'User activated');
  }

  isAssigned(storeId: string): boolean { return this.assignedStoreIds().has(storeId); }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }
}
