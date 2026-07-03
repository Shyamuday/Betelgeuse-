import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
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

function emptyStoreForm() {
  return { name: '', code: '', address: '', phone: '' };
}

function emptyEditForm() {
  return { name: '', address: '', phone: '', isActive: true };
}

function emptyMgrForm() {
  return {
    name: '',
    email: '',
    password: '',
    designation: STORE_FORM_DEFAULTS.MANAGER_DESIGNATION,
    joiningDate: ''
  };
}

function emptyStaffForm() {
  return {
    name: '',
    staffCode: '',
    email: '',
    password: '',
    designation: STORE_FORM_DEFAULTS.STAFF_DESIGNATION,
    phone: '',
    joiningDate: ''
  };
}

@Component({
  selector: 'app-stores-page',
  imports: [FormField],
  templateUrl: './stores-page.html',
  styleUrl: './stores-page.scss'
})
export class StoresPage implements OnInit {
  private api = inject(AdminApi);

  readonly storeAppPort = STORE_APP_PORT;
  readonly storeStatusColors = STORE_STATUS_COLORS;
  readonly modalTypes = STORE_MODAL_TYPES;

  stores = signal<any[]>([]);
  loading = signal(true);
  error = signal('');
  saving = signal(false);
  modal = signal<StoreModalType | null>(null);
  selectedStore = signal<any>(null);
  roster = signal<any[]>([]);
  rosterLoading = signal(false);
  err = signal('');
  toast = signal('');

  readonly storeModel = signal(emptyStoreForm());
  readonly storeForm = form(this.storeModel);
  readonly editModel = signal(emptyEditForm());
  readonly editForm = form(this.editModel);
  readonly mgrModel = signal(emptyMgrForm());
  readonly mgrForm = form(this.mgrModel);
  readonly staffModel = signal(emptyStaffForm());
  readonly staffForm = form(this.staffModel);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getAdminStores()
      .then(r => { this.stores.set(r.stores); this.loading.set(false); })
      .catch(() => { this.loading.set(false); this.error.set('Could not load stores. Check your connection and try again.'); });
  }

  openModal(m: StoreModalType): void { this.err.set(''); this.modal.set(m); }

  openEditModal(s: any): void {
    this.selectedStore.set(s);
    this.editModel.set({
      name: s.name,
      address: s.address || '',
      phone: s.phone || '',
      isActive: s.isActive !== false
    });
    this.err.set('');
    this.modal.set(STORE_MODAL_TYPES.EDIT);
  }

  openManagerModal(s: any): void {
    this.selectedStore.set(s);
    this.mgrModel.set(emptyMgrForm());
    this.err.set('');
    this.modal.set(STORE_MODAL_TYPES.MANAGER);
  }

  openStaffModal(s: any): void {
    this.selectedStore.set(s);
    this.staffModel.set(emptyStaffForm());
    this.err.set('');
    this.modal.set(STORE_MODAL_TYPES.STAFF);
  }

  async openRosterModal(s: any): Promise<void> {
    this.selectedStore.set(s);
    this.roster.set([]);
    this.rosterLoading.set(true);
    this.err.set('');
    this.modal.set(STORE_MODAL_TYPES.ROSTER);
    try {
      const response = await this.api.getAdminStore(s.id);
      this.roster.set(response.store.staff || []);
      this.selectedStore.set(response.store);
    } catch {
      this.err.set('Could not load staff roster.');
    } finally {
      this.rosterLoading.set(false);
    }
  }

  closeModal(): void { this.modal.set(null); this.err.set(''); }

  async saveStore(): Promise<void> {
    const form = this.storeModel();
    if (!form.name || !form.code) { this.err.set('Name and code required'); return; }
    this.saving.set(true);
    try {
      const r = await this.api.createAdminStore(form);
      this.stores.update(list => [...list, { ...r.store, _count: { staff: 0 }, staff: [] }]);
      this.modal.set(null);
      this.showToast(`Store "${r.store.name}" created`);
    } catch (e: any) { this.err.set(e?.error?.error ?? 'Failed'); }
    finally { this.saving.set(false); }
  }

  async saveEdit(): Promise<void> {
    const store = this.selectedStore();
    if (!store) return;
    this.saving.set(true);
    try {
      const r = await this.api.updateAdminStore(store.id, this.editModel());
      this.stores.update(list => list.map(item => item.id === store.id ? { ...item, ...r.store } : item));
      this.modal.set(null);
      this.showToast(`Store "${r.store.name}" updated`);
    } catch (e: any) { this.err.set(e?.error?.error ?? 'Failed'); }
    finally { this.saving.set(false); }
  }

  async saveManager(): Promise<void> {
    const form = this.mgrModel();
    if (!form.name || !form.email || !form.password) { this.err.set('Name, email and password required'); return; }
    if (form.password.length < STORE_VALIDATION.PASSWORD_MIN_LENGTH) { this.err.set('Password must be 6+ characters'); return; }
    this.saving.set(true);
    try {
      await this.api.createAdminManager(this.selectedStore()!.id, form);
      this.modal.set(null);
      this.showToast(`Manager "${form.name}" added`);
      this.load();
    } catch (e: any) { this.err.set(e?.error?.error ?? 'Failed'); }
    finally { this.saving.set(false); }
  }

  async saveStaff(): Promise<void> {
    const form = this.staffModel();
    if (!form.name || !form.staffCode || !form.email || !form.password) {
      this.err.set('Name, code, email and password required'); return;
    }
    if (form.password.length < STORE_VALIDATION.PASSWORD_MIN_LENGTH) {
      this.err.set('Password must be at least 8 characters'); return;
    }
    this.saving.set(true);
    try {
      await this.api.createAdminStoreStaff(this.selectedStore()!.id, form);
      this.modal.set(null);
      this.showToast(`Staff "${form.name}" added`);
      this.load();
    } catch (e: any) { this.err.set(e?.error?.error ?? 'Failed'); }
    finally { this.saving.set(false); }
  }

  async toggleStaffStatus(member: any): Promise<void> {
    try {
      await this.api.setAdminStoreStaffStatus(member.id, { isActive: !member.isActive });
      this.roster.update(list => list.map(row => row.id === member.id ? { ...row, isActive: !member.isActive } : row));
      this.showToast(`${member.name} ${member.isActive ? 'deactivated' : 'activated'}`);
    } catch {
      this.showToast('Could not update staff status.');
    }
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
