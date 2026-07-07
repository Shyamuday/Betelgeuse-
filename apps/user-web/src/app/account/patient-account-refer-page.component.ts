import { Component, OnInit, inject, signal } from '@angular/core';
import { API_PATHS } from '../core/constants/api-paths.constants';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-patient-account-refer-page',
  standalone: true,
  templateUrl: './patient-account-refer-page.component.html',
  styleUrl: './patient-account-refer-page.component.scss'
})
export class PatientAccountReferPageComponent implements OnInit {
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly code = signal('');
  readonly shareUrl = signal('');
  readonly stats = signal({ total: 0, registered: 0, qualified: 0, rewarded: 0 });
  readonly referrals = signal<
    Array<{ status: string; referredUser?: { name: string; createdAt: string } }>
  >([]);
  readonly copied = signal(false);

  ngOnInit() {
    void this.load();
  }

  private async load() {
    const token = this.auth.token;
    try {
      if (!token) return;
      const res = await fetch(`${environment.apiUrl}${API_PATHS.PATIENT.REFERRALS_SUMMARY}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      this.code.set(data.code);
      this.shareUrl.set(`${window.location.origin}${data.sharePath}`);
      this.stats.set(data.stats);
      this.referrals.set(data.referrals || []);
    } finally {
      this.loading.set(false);
    }
  }

  async copyLink() {
    const url = this.shareUrl();
    if (!url) return;
    await navigator.clipboard.writeText(url);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  whatsappShare() {
    const url = this.shareUrl();
    const text = encodeURIComponent(`Join me on Vitalis Care for doctor-led homeopathic consultations. Use my code ${this.code()} or link: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  }
}
