import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import { ReceptionApiService } from '../../services/reception-api.service';
import { ROUTE_PATHS } from '../../core/constants/app-routes.constants';

@Component({
  selector: 'app-walk-in',
  standalone: true,
  imports: [FormField],
  templateUrl: './walk-in.component.html',
  styleUrl: './walk-in.component.scss'
})
export class WalkInComponent implements OnInit {
  private api = inject(ReceptionApiService);
  private router = inject(Router);

  diseases = signal<Array<{ id: string; name: string; feeInPaise: number }>>([]);
  loading = signal(false);
  error = signal('');
  toast = signal('');

  readonly walkInModel = signal({
    name: '',
    mobile: '',
    email: '',
    diseaseId: '',
    collectCash: true,
    notes: ''
  });
  readonly walkInForm = form(this.walkInModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.mobile, { message: 'Mobile is required' });
    required(schema.diseaseId, { message: 'Concern is required' });
  });

  ngOnInit(): void {
    this.api.getDiseases()
      .then(r => this.diseases.set(r.diseases ?? []))
      .catch(() => this.error.set('Could not load diseases.'));
  }

  formatPaise(paise: number): string {
    return (paise / 100).toLocaleString('en-IN');
  }

  async submit(): Promise<void> {
    const form = this.walkInModel();
    if (this.walkInForm().invalid()) {
      this.error.set('Name, mobile, and concern are required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.api.walkIn({
        name: form.name,
        mobile: form.mobile,
        email: form.email || null,
        diseaseId: form.diseaseId,
        collectCash: form.collectCash,
        notes: form.notes || undefined
      });
      this.toast.set('Walk-in registered');
      setTimeout(() => this.router.navigate([`/${ROUTE_PATHS.QUEUE}`]), 800);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.error?.message ?? 'Registration failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
