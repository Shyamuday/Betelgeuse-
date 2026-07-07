import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_PATHS } from '../core/constants/api-paths.constants';
import { AuthService } from '../auth/auth.service';
import { ROUTE_PATHS } from '../core/constants/app-routes.constants';
import { environment } from '../../environments/environment';
import { PATIENT_ACCOUNT_NAV } from './constants/patient-account.constants';

@Component({
  selector: 'app-patient-account-hub',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './patient-account-hub.component.html',
  styleUrl: './patient-account-hub.component.scss'
})
export class PatientAccountHubComponent implements OnInit {
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly profile = signal<{
    name: string;
    mobile?: string | null;
    email?: string | null;
    patientCode?: string | null;
  } | null>(null);

  readonly quickLinks = PATIENT_ACCOUNT_NAV.filter((item) =>
    ['profile', 'addresses', 'consultations', 'orders', 'card', 'refer', 'rewards', 'dashboard'].includes(item.id)
  );

  readonly walletBalanceInPaise = signal(0);
  readonly referralCode = signal('');

  readonly dashboardLink = `/${ROUTE_PATHS.PATIENT_DASHBOARD}`;
  readonly CURRENCY_CODE = 'INR';

  formatInr(paise: number) {
    return (paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  }

  ngOnInit() {
    void this.load();
  }

  private async load() {
    const token = this.auth.token;
    try {
      if (token) {
        const [profileRes, rewardsRes, referRes] = await Promise.all([
          fetch(`${environment.apiUrl}${API_PATHS.PATIENT.PROFILE}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${environment.apiUrl}${API_PATHS.PATIENT.REWARDS}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${environment.apiUrl}${API_PATHS.PATIENT.REFERRALS_SUMMARY}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          this.profile.set(data.profile);
        }
        if (rewardsRes.ok) {
          const rewards = await rewardsRes.json();
          this.walletBalanceInPaise.set(rewards.balanceInPaise ?? 0);
        }
        if (referRes.ok) {
          const refer = await referRes.json();
          this.referralCode.set(refer.code ?? '');
        }
        if (this.profile()) return;
      }
      const user = this.auth.user();
      if (user) this.profile.set({ name: user.name, mobile: user.mobile, email: user.email });
    } catch {
      const user = this.auth.user();
      if (user) this.profile.set({ name: user.name, mobile: user.mobile, email: user.email });
    } finally {
      this.loading.set(false);
    }
  }
}
