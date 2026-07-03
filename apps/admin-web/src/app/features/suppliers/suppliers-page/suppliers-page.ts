import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';
import { TOAST_DURATION_MS } from '../../../core/constants/timing.constants';

function emptySupplierForm() {
  return { code: '', name: '', email: '', phone: '', address: '', gstin: '', isActive: true };
}

@Component({
  selector: 'app-suppliers-page',
  imports: [FormField],
  templateUrl: './suppliers-page.html',
  styleUrl: './suppliers-page.scss'
})
export class SuppliersPage implements OnInit {
  private api = inject(AdminApi);

  suppliers = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  modal = signal<'create' | 'edit' | null>(null);
  selected = signal<any>(null);
  error = signal('');
  toast = signal('');

  readonly draftModel = signal(emptySupplierForm());
  readonly draftForm = form(this.draftModel);

  ngOnInit(): void { void this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const response = await this.api.listSuppliers(true);
      this.suppliers.set(response.suppliers);
    } catch {
      this.error.set('Could not load suppliers.');
    } finally {
      this.loading.set(false);
    }
  }

  openCreate() {
    this.draftModel.set(emptySupplierForm());
    this.error.set('');
    this.modal.set('create');
  }

  openEdit(supplier: any) {
    this.selected.set(supplier);
    this.draftModel.set({
      code: supplier.code,
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      gstin: supplier.gstin || '',
      isActive: supplier.isActive !== false
    });
    this.error.set('');
    this.modal.set('edit');
  }

  closeModal() { this.modal.set(null); }

  async save() {
    const form = this.draftModel();
    if (!form.name || (!form.code && this.modal() === 'create')) {
      this.error.set('Code and name are required.');
      return;
    }
    this.saving.set(true);
    try {
      if (this.modal() === 'create') {
        await this.api.createSupplier(form);
        this.showToast('Supplier created.');
      } else {
        await this.api.updateSupplier(this.selected()!.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          gstin: form.gstin,
          isActive: form.isActive
        });
        this.showToast('Supplier updated.');
      }
      this.modal.set(null);
      await this.load();
    } catch (e: any) {
      this.error.set(e?.error?.message || 'Save failed.');
    } finally {
      this.saving.set(false);
    }
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), TOAST_DURATION_MS);
  }
}
