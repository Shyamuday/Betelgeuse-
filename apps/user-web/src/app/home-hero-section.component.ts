import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { POST_LOGIN_REDIRECT_DELAY_MS } from './core/constants/timing.constants';
import { CURRENCY_CODE } from './core/constants/billing.constants';
import { ROUTE_PATHS } from './core/constants/app-routes.constants';
import { HOME_CONTENT } from './core/constants/public-site-content.constants';
import { AuthService } from './auth/auth.service';
import { ClinicApiService } from './clinic-api.service';
import { Disease } from './models';

type BookStep = 'form' | 'otp' | 'loading' | 'done';

@Component({
  selector: 'app-home-hero-section',
  imports: [CommonModule, CurrencyPipe, FormField],
  styleUrl: './home-hero-section.component.scss',
  templateUrl: './home-hero-section.component.html',
})
export class HomeHeroSectionComponent {
  @Input() whatsappLink = '';

  readonly copy = HOME_CONTENT;
  readonly currencyCode = CURRENCY_CODE;

  readonly bookingFormModel = signal({ diseaseId: '', mobile: '', otp: '' });
  readonly bookingForm = form(this.bookingFormModel);
  readonly diseases = signal<Disease[]>([]);
  readonly diseasesLoading = signal(true);

  readonly step = signal<BookStep>('form');
  readonly busy = signal(false);
  readonly error = signal('');

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly api = inject(ClinicApiService);

  constructor() {
    void this.loadDiseases();
  }

  selectedDisease() {
    const id = this.bookingFormModel().diseaseId;
    return this.diseases().find((disease) => disease.id === id) ?? null;
  }

  private async loadDiseases() {
    this.diseasesLoading.set(true);
    try {
      const response = await firstValueFrom(this.api.diseases());
      this.diseases.set(response.diseases);
    } catch {
      this.diseases.set([]);
    } finally {
      this.diseasesLoading.set(false);
    }
  }

  async sendOtp() {
    const { mobile: rawMobile, diseaseId } = this.bookingFormModel();
    const mobile = rawMobile.trim().replace(/\s+/g, '');
    if (!diseaseId) {
      this.error.set('Select a health concern to continue.');
      return;
    }
    if (!/^\d{10}$/.test(mobile)) {
      this.error.set('Enter a valid 10-digit mobile number.');
      return;
    }

    this.error.set('');
    this.busy.set(true);
    try {
      await firstValueFrom(
        this.auth.requestOtp(mobile, {
          source: 'HOME_BOOKING',
          entryPage: typeof window !== 'undefined' ? window.location.pathname : undefined
        })
      );
      this.bookingFormModel.update((m) => ({ ...m, mobile }));
      this.step.set('otp');
    } catch (err: any) {
      this.error.set(err?.error?.message || 'Could not send OTP. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }

  async verifyOtp() {
    const { otp } = this.bookingFormModel();
    if (!otp.trim()) {
      this.error.set('Enter the OTP.');
      return;
    }
    this.error.set('');
    this.busy.set(true);
    this.step.set('loading');
    try {
      const form = this.bookingFormModel();
      const response = await firstValueFrom(
        this.auth.patientLogin({
          mobile: form.mobile,
          otp: form.otp.trim(),
        }),
      );
      this.step.set('done');
      if ('user' in response) {
        const diseaseId = form.diseaseId;
        if (diseaseId && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('pendingDiseaseId', diseaseId);
        }
        const dashboard = this.auth.dashboardFor(response.user.role);
        const target =
          response.user.role === 'PATIENT' && diseaseId
            ? `${dashboard}?diseaseId=${encodeURIComponent(diseaseId)}`
            : dashboard;
        setTimeout(() => void this.router.navigateByUrl(target), POST_LOGIN_REDIRECT_DELAY_MS);
      }
    } catch (err: any) {
      this.step.set('otp');
      this.error.set(err?.error?.message || 'Incorrect OTP. Please try again.');
    } finally {
      this.busy.set(false);
    }
  }

  goBack() {
    this.bookingFormModel.update((m) => ({ ...m, otp: '' }));
    this.error.set('');
    this.step.set('form');
  }

  browseTreatmentsHref() {
    return `/${ROUTE_PATHS.TREATMENTS}`;
  }
}
