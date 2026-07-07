import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { API_PATHS } from '../core/constants/api-paths.constants';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

type LedgerRow = {
  id: string;
  direction: 'CREDIT' | 'DEBIT';
  amountInPaise: number;
  balanceAfter: number;
  note?: string | null;
  createdAt: string;
  rule?: { code: string; name: string } | null;
};

@Component({
  selector: 'app-patient-account-rewards-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-account-rewards-page.component.html',
  styleUrl: './patient-account-rewards-page.component.scss'
})
export class PatientAccountRewardsPageComponent implements OnInit {
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly balanceInPaise = signal(0);
  readonly ledger = signal<LedgerRow[]>([]);

  ngOnInit() {
    void this.load();
  }

  private async load() {
    const token = this.auth.token;
    try {
      if (!token) return;
      const res = await fetch(`${environment.apiUrl}${API_PATHS.PATIENT.REWARDS}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      this.balanceInPaise.set(data.balanceInPaise ?? 0);
      this.ledger.set(data.ledger ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  formatInr(paise: number) {
    return `₹${(paise / 100).toFixed(2)}`;
  }
}
