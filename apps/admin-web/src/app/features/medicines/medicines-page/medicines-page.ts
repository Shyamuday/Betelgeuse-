import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';
import { TOAST_DURATION_MS } from '../../../core/constants/timing.constants';

function emptyMedicineForm() {
  return {
    name: '',
    potency: '30C',
    shortName: '',
    manufacturer: '',
    category: '',
    minStockLevel: 10,
    isActive: true
  };
}

@Component({
  selector: 'app-medicines-page',
  imports: [FormField],
  templateUrl: './medicines-page.html',
  styleUrl: './medicines-page.scss'
})
export class MedicinesPage implements OnInit {
  private api = inject(AdminApi);

  medicines = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  modal = signal<'create' | 'edit' | null>(null);
  selected = signal<any>(null);
  error = signal('');
  toast = signal('');

  readonly searchModel = signal({ q: '' });
  readonly searchForm = form(this.searchModel);
  readonly draftModel = signal(emptyMedicineForm());
  readonly draftForm = form(this.draftModel);

  ngOnInit(): void { void this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const response = await this.api.listMedicines({
        q: this.searchModel().q,
        includeInactive: true
      });
      this.medicines.set(response.medicines);
    } catch {
      this.error.set('Could not load medicines.');
    } finally {
      this.loading.set(false);
    }
  }

  openCreate() {
    this.draftModel.set(emptyMedicineForm());
    this.error.set('');
    this.modal.set('create');
  }

  openEdit(medicine: any) {
    this.selected.set(medicine);
    this.draftModel.set({
      name: medicine.name,
      potency: medicine.potency,
      shortName: medicine.shortName || '',
      manufacturer: medicine.manufacturer || '',
      category: medicine.category || '',
      minStockLevel: medicine.minStockLevel ?? 10,
      isActive: medicine.isActive !== false
    });
    this.error.set('');
    this.modal.set('edit');
  }

  closeModal() { this.modal.set(null); }

  async save() {
    const form = this.draftModel();
    if (!form.name || !form.potency) {
      this.error.set('Name and potency are required.');
      return;
    }
    this.saving.set(true);
    try {
      if (this.modal() === 'create') {
        await this.api.createMedicine(form);
        this.showToast('Medicine created.');
      } else {
        await this.api.updateMedicine(this.selected()!.id, form);
        this.showToast('Medicine updated.');
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
