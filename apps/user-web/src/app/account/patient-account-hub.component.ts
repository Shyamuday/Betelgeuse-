import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ClinicApiService } from '../clinic-api.service';
import { ROUTE_PATHS } from '../core/constants/app-routes.constants';
import { computeProfileCompletion } from '../core/constants/patient-profile.constants';
import type { PatientProfile } from '../core/constants/patient-profile.constants';
import { PATIENT_ACCOUNT_NAV } from './constants/patient-account.constants';

@Component({
  selector: 'app-patient-account-hub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patient-account-hub.component.html',
  styleUrl: './patient-account-hub.component.scss',
})
export class PatientAccountHubComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ClinicApiService);

  readonly loading = signal(true);
  readonly profile = signal<PatientProfile | null>(null);
  readonly profileCompletion = signal(0);

  readonly quickLinks = PATIENT_ACCOUNT_NAV.filter((item) =>
    [
      'profile',
      'addresses',
      'consultations',
      'orders',
      'lab-results',
      // Offline clinic card hidden for now. Platform is online-only.
      // 'card',
      'refer',
      'rewards',
      'dashboard',
    ].includes(item.id),
  );

  readonly walletBalanceInPaise = signal(0);
  readonly referralCode = signal('');

  readonly dashboardLink = `/${ROUTE_PATHS.PATIENT_DASHBOARD}`;
  readonly CURRENCY_CODE = 'INR';

  formatInr(paise: number) {
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  }

  ngOnInit() {
    forkJoin({
      profile: this.api.patientProfile(),
      rewards: this.api.patientRewards(),
      referral: this.api.patientReferralsSummary(),
    }).subscribe({
      next: ({ profile, rewards, referral }) => {
        this.profile.set(profile.profile);
        this.profileCompletion.set(computeProfileCompletion(profile.profile));
        this.walletBalanceInPaise.set(rewards.balanceInPaise ?? 0);
        this.referralCode.set(referral.code ?? '');
        this.loading.set(false);
      },
      error: () => {
        const user = this.auth.user();
        if (user) {
          const fallback = { name: user.name, mobile: user.mobile, email: user.email, id: user.id };
          this.profile.set(fallback);
          this.profileCompletion.set(computeProfileCompletion(fallback));
        }
        this.loading.set(false);
      },
    });
  }
}
