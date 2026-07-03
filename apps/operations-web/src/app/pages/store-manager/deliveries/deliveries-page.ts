import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { StoreApiService } from '../../../services/store-api.service';

type DeliveryLine = { label: string; qty: number };
type PatientHit = { id: string; name: string; patientCode?: string | null; mobile?: string | null };

function emptyCreateForm() {
  return {
    patientQuery: '',
    deliveryAddress: '',
    deliveryPhone: '',
    notes: '',
    lines: [{ label: '', qty: 1 }] as DeliveryLine[]
  };
}

@Component({
  selector: 'app-deliveries-page',
  standalone: true,
  imports: [FormField, DatePipe],
  templateUrl: './deliveries-page.html',
  styleUrl: './deliveries-page.scss'
})
export class DeliveriesPage implements OnInit {
  private api = inject(StoreApiService);

  loading = signal(true);
  error = signal('');
  deliveries = signal<any[]>([]);
  creating = signal(false);
  toast = signal('');
  createdOtp = signal('');

  patientHits = signal<PatientHit[]>([]);
  selectedPatient = signal<PatientHit | null>(null);

  readonly createFormModel = signal(emptyCreateForm());
  readonly createForm = form(this.createFormModel);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getDeliveries().subscribe({
      next: (res) => {
        this.deliveries.set(res.deliveries ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load deliveries.');
        this.loading.set(false);
      }
    });
  }

  openCreate(): void {
    this.creating.set(true);
    this.createdOtp.set('');
    this.selectedPatient.set(null);
    this.patientHits.set([]);
    this.createFormModel.set({
      ...emptyCreateForm(),
      lines: [{ label: 'Arnica Montana 30C', qty: 1 }]
    });
  }

  closeCreate(): void {
    this.creating.set(false);
    this.createdOtp.set('');
  }

  searchPatients(): void {
    const q = this.createFormModel().patientQuery.trim();
    if (q.length < 2) {
      this.patientHits.set([]);
      return;
    }
    this.api.searchPatients(q).subscribe({
      next: (res) => this.patientHits.set(res.patients ?? []),
      error: () => this.patientHits.set([])
    });
  }

  pickPatient(p: PatientHit): void {
    this.selectedPatient.set(p);
    this.patientHits.set([]);
    this.createFormModel.update((form) => ({
      ...form,
      patientQuery: `${p.name} (${p.patientCode ?? p.id})`,
      deliveryPhone: p.mobile ?? form.deliveryPhone
    }));
  }

  addLine(): void {
    this.createFormModel.update((form) => ({
      ...form,
      lines: [...form.lines, { label: '', qty: 1 }]
    }));
  }

  submitCreate(): void {
    const patient = this.selectedPatient();
    if (!patient) return;
    const form = this.createFormModel();
    const lines = form.lines.filter((line) => line.label.trim() && line.qty > 0);
    if (!lines.length || !form.deliveryAddress.trim() || !form.deliveryPhone.trim()) return;

    this.api.postDelivery({
      patientId: patient.id,
      deliveryAddress: form.deliveryAddress.trim(),
      deliveryPhone: form.deliveryPhone.trim(),
      notes: form.notes.trim() || undefined,
      lines: lines.map((line) => ({ label: line.label.trim(), qty: line.qty }))
    }).subscribe({
      next: (res) => {
        this.createdOtp.set(res.deliveryOtp ?? '');
        this.toast.set('Delivery scheduled — share OTP with patient');
        setTimeout(() => this.toast.set(''), 3000);
        this.load();
      },
      error: (err) => {
        this.toast.set(err.error?.message || 'Create failed');
        setTimeout(() => this.toast.set(''), 3000);
      }
    });
  }
}
