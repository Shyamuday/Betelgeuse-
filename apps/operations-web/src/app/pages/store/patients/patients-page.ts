import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { StoreApiService } from '../../../services/store-api.service';
import { StoreRouteContext } from '../../../services/store-route-context.service';
import { StoreAuthService } from '../../../services/store-auth.service';

type PatientResult = {
  id: string;
  name: string;
  patientCode?: string | null;
  mobile?: string | null;
  email?: string | null;
  homeClinicStore?: { id: string; name: string; code: string } | null;
};

function emptyRegisterForm() {
  return { name: '', mobile: '', email: '' };
}

@Component({
  selector: 'app-patients-page',
  imports: [CommonModule, FormField],
  templateUrl: './patients-page.html',
  styleUrl: './patients-page.scss'
})
export class PatientsPage {
  private readonly api = inject(StoreApiService);
  private readonly auth = inject(StoreAuthService);
  private readonly router = inject(Router);
  readonly storeRoutes = inject(StoreRouteContext);
  private readonly search$ = new Subject<string>();

  readonly searchModel = signal({ q: '' });
  readonly searchForm = form(this.searchModel);

  readonly query = signal('');
  readonly patients = signal<PatientResult[]>([]);
  readonly scopeUsed = signal<'clinic' | 'global' | 'none'>('none');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly registerOpen = signal(false);
  readonly registerSaving = signal(false);
  readonly registerError = signal('');

  readonly registerFormModel = signal(emptyRegisterForm());
  readonly registerForm = form(this.registerFormModel);

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

  isManager(): boolean {
    return this.auth.isManager();
  }

  onSearchFromField(): void {
    const value = this.searchModel().q;
    this.query.set(value);
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
    this.registerFormModel.set(emptyRegisterForm());
  }

  createPatient(): void {
    const form = this.registerFormModel();
    if (!form.name.trim()) {
      this.registerError.set('Name is required.');
      return;
    }
    this.registerSaving.set(true);
    this.registerError.set('');
    this.api.createPatient({
      name: form.name.trim(),
      mobile: form.mobile.trim() || undefined,
      email: form.email.trim() || undefined
    }).subscribe({
      next: (res) => {
        this.registerSaving.set(false);
        this.closeRegister();
        if (res.patient.patientCode) {
          void this.router.navigate(this.storeRoutes.link('scan', 'patient', res.patient.patientCode));
        }
      },
      error: (err) => {
        this.registerSaving.set(false);
        this.registerError.set(err.error?.message || 'Could not register patient.');
      }
    });
  }

  openScan(patientCode: string | null | undefined): void {
    if (!patientCode) return;
    void this.router.navigate(this.storeRoutes.link('scan', 'patient', patientCode));
  }
}
