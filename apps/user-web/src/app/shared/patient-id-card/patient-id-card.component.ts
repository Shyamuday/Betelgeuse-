import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { API_PATHS } from '../../core/constants/api-paths.constants';
import { AuthService } from '../../auth/auth.service';
import { environment } from '../../../environments/environment';
import { AppDownloadQrComponent } from '../app-download-qr/app-download-qr.component';

export type PatientIdCard = {
  patientCode: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  clinic?: { id: string; name: string; code: string; address?: string | null } | null;
  issuedAt?: string;
  scanUrl?: string;
};

@Component({
  selector: 'app-patient-id-card',
  standalone: true,
  imports: [CommonModule, AppDownloadQrComponent],
  templateUrl: './patient-id-card.component.html',
  styleUrl: './patient-id-card.component.scss'
})
export class PatientIdCardComponent implements OnInit {
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly card = signal<PatientIdCard | null>(null);

  ngOnInit() {
    void this.load();
  }

  private async load() {
    const token = this.auth.token;
    if (!token) {
      this.loading.set(false);
      return;
    }
    try {
      const res = await fetch(`${environment.apiUrl}${API_PATHS.PATIENT.CARD}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.card.set(data.card);
        return;
      }
      const profileRes = await fetch(`${environment.apiUrl}${API_PATHS.PATIENT.PROFILE}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const { profile } = await profileRes.json();
        if (profile?.patientCode) {
          this.card.set({
            patientCode: profile.patientCode,
            name: profile.name,
            mobile: profile.mobile,
            email: profile.email,
            clinic: profile.homeClinicStore ?? null,
            scanUrl: `${environment.apiUrl}/go/p/${encodeURIComponent(profile.patientCode)}`
          });
        }
      }
    } finally {
      this.loading.set(false);
    }
  }

  printCard() {
    document.body.classList.add('printing-patient-card');
    window.print();
    window.setTimeout(() => document.body.classList.remove('printing-patient-card'), 500);
  }

  scanUrl(card: PatientIdCard) {
    return card.scanUrl ?? `${environment.apiUrl}/go/p/${encodeURIComponent(card.patientCode)}`;
  }

  qrImageUrl(card: PatientIdCard) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(this.scanUrl(card))}`;
  }
}
