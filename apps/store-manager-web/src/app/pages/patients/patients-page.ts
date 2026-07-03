import { CommonModule } from '@angular/common';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { StoreApiService } from '../../services/store-api.service';

type PatientResult = {
  id: string;
  name: string;
  patientCode?: string | null;
  mobile?: string | null;
  email?: string | null;
  homeClinicStore?: { id: string; name: string; code: string } | null;
};

@Component({
  selector: 'app-patients-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './patients-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './patients-page.scss'
})
export class PatientsPage {
  private readonly api = inject(StoreApiService);
  private readonly search$ = new Subject<string>();

  readonly query = signal('');
  readonly patients = signal<PatientResult[]>([]);
  readonly scopeUsed = signal<'clinic' | 'global' | 'none'>('none');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly registerOpen = signal(false);
  readonly registerSaving = signal(false);
  readonly registerError = signal('');
  readonly successMsg = signal('');

  registerForm = {
    name: '',
    mobile: '',
    email: ''
  };

  constructor() {
    this.search$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((q) => {
        this.loading.set(true);
        this.error.set('');
        return this.api.searchPatients(q);
      })
    ).subscribe({
      next: (res) => {
        this.patients.set(res.patients);
        this.scopeUsed.set(res.scopeUsed);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Search failed.');
        this.patients.set([]);
      }
    });
  }

  onSearch(value: string): void {
    this.query.set(value);
    this.successMsg.set('');
    if (value.trim().length < 2) {
      this.patients.set([]);
      this.scopeUsed.set('none');
      return;
    }
    this.search$.next(value.trim());
  }

  openRegister(): void {
    this.registerOpen.set(true);
    this.registerError.set('');
  }

  closeRegister(): void {
    this.registerOpen.set(false);
    this.registerForm = { name: '', mobile: '', email: '' };
  }

  createPatient(): void {
    if (!this.registerForm.name.trim()) {
      this.registerError.set('Name is required.');
      return;
    }
    this.registerSaving.set(true);
    this.registerError.set('');
    this.api.createPatient({
      name: this.registerForm.name.trim(),
      mobile: this.registerForm.mobile.trim() || undefined,
      email: this.registerForm.email.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.registerSaving.set(false);
        this.closeRegister();
        this.successMsg.set(`Registered ${res.patient.name} — ID ${res.patient.patientCode ?? 'pending'}`);
        if (res.patient.patientCode) {
          this.onSearch(res.patient.patientCode);
        }
      },
      error: (err) => {
        this.registerSaving.set(false);
        this.registerError.set(err.error?.message || 'Could not register patient.');
      }
    });
  }
}
