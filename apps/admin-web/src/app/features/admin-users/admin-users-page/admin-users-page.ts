import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';
import { TOAST_DURATION_MS } from '../../../core/constants/timing.constants';

function emptyAdminForm() {
  return { name: '', email: '', password: '', mobile: '' };
}

@Component({
  selector: 'app-admin-users-page',
  imports: [FormField],
  templateUrl: './admin-users-page.html',
  styleUrl: './admin-users-page.scss'
})
export class AdminUsersPage implements OnInit {
  private api = inject(AdminApi);

  admins = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  modal = signal(false);
  error = signal('');
  toast = signal('');

  readonly draftModel = signal(emptyAdminForm());
  readonly draftForm = form(this.draftModel);

  ngOnInit(): void { void this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const response = await this.api.getAdmins();
      this.admins.set(response.admins);
    } catch {
      this.error.set('Could not load admin users.');
    } finally {
      this.loading.set(false);
    }
  }

  openCreate() {
    this.draftModel.set(emptyAdminForm());
    this.error.set('');
    this.modal.set(true);
  }

  closeModal() { this.modal.set(false); }

  async create() {
    const form = this.draftModel();
    if (!form.name || !form.email || !form.password) {
      this.error.set('Name, email, and password are required.');
      return;
    }
    this.saving.set(true);
    try {
      await this.api.createAdmin({
        name: form.name,
        email: form.email,
        password: form.password,
        mobile: form.mobile || undefined
      });
      this.modal.set(false);
      this.showToast('Admin user created.');
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Could not create admin.');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleStatus(admin: any) {
    try {
      await this.api.setAdminStatus(admin.id, !admin.isActive);
      this.admins.update(list => list.map(row => row.id === admin.id ? { ...row, isActive: !admin.isActive } : row));
      this.showToast(`${admin.name} ${admin.isActive ? 'deactivated' : 'activated'}.`);
    } catch (e: any) {
      this.showToast(e?.error?.message || 'Could not update status.');
    }
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
