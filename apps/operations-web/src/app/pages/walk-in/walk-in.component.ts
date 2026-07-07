import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import { ReceptionApiService } from '../../services/reception-api.service';
import { ROUTE_PATHS } from '../../core/constants/app-routes.constants';

type WalkInMode = 'new' | 'existing';

type PatientHit = {
  id: string;
  name: string;
  patientCode?: string | null;
  mobile?: string | null;
};

type CheckoutQuote = {
  grossAmountInPaise: number;
  discountInPaise: number;
  walletRedeemedInPaise: number;
  payableInPaise: number;
  maxWalletRedeemInPaise: number;
};

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
  private route = inject(ActivatedRoute);

  readonly mode = signal<WalkInMode>('new');
  diseases = signal<Array<{ id: string; name: string; feeInPaise: number }>>([]);
  loading = signal(false);
  searchLoading = signal(false);
  error = signal('');
  toast = signal('');

  readonly patientHits = signal<PatientHit[]>([]);
  readonly selectedPatient = signal<PatientHit | null>(null);
  readonly walletBalanceInPaise = signal(0);
  readonly checkoutQuote = signal<CheckoutQuote | null>(null);
  readonly quoteLoading = signal(false);

  readonly walkInModel = signal({
    name: '',
    mobile: '',
    email: '',
    diseaseId: '',
    collectCash: true,
    notes: '',
    promoCode: ''
  });
  readonly walkInForm = form(this.walkInModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.mobile, { message: 'Mobile is required' });
    required(schema.diseaseId, { message: 'Concern is required' });
  });

  readonly existingModel = signal({
    lookup: '',
    diseaseId: '',
    collectCash: true,
    promoCode: '',
    useWallet: false
  });
  readonly existingForm = form(this.existingModel, (schema) => {
    required(schema.diseaseId, { message: 'Concern is required' });
  });

  ngOnInit(): void {
    this.api.getDiseases()
      .then(r => this.diseases.set(r.diseases ?? []))
      .catch(() => this.error.set('Could not load diseases.'));

    const code = this.route.snapshot.queryParamMap.get('patientCode');
    const name = this.route.snapshot.queryParamMap.get('name');
    const mobile = this.route.snapshot.queryParamMap.get('mobile');
    const notes = this.route.snapshot.queryParamMap.get('notes');

    if (code) {
      this.setMode('existing');
      this.existingModel.update(m => ({ ...m, lookup: code }));
      void this.lookupPatient();
    } else if (name || mobile || notes) {
      this.setMode('new');
      this.walkInModel.update(m => ({
        ...m,
        name: name ?? m.name,
        mobile: mobile ?? m.mobile,
        notes: notes ?? m.notes
      }));
    }
  }

  setMode(next: WalkInMode): void {
    this.mode.set(next);
    this.error.set('');
    this.patientHits.set([]);
    this.selectedPatient.set(null);
  }

  formatPaise(paise: number): string {
    return (paise / 100).toLocaleString('en-IN');
  }

  private extractLookupQuery(raw: string): string {
    const trimmed = raw.trim();
    const fromQr = trimmed.match(/\/go\/p\/([^/?#]+)/i)?.[1] ?? trimmed.match(/\/scan\/patient\/([^/?#]+)/i)?.[1];
    return fromQr ? decodeURIComponent(fromQr) : trimmed;
  }

  async lookupPatient(): Promise<void> {
    const query = this.extractLookupQuery(this.existingModel().lookup);
    if (!query) {
      this.error.set('Enter patient ID, mobile, name, or scan a QR code.');
      return;
    }

    this.searchLoading.set(true);
    this.error.set('');
    this.patientHits.set([]);
    this.selectedPatient.set(null);

    try {
      const result = await this.api.searchPatients(query);
      const patients = (result?.patients ?? []) as PatientHit[];
      this.patientHits.set(patients);
      if (patients.length === 1) {
        this.selectPatient(patients[0]);
      } else if (!patients.length) {
        this.error.set('No patient found. Check the ID or QR code.');
      }
    } catch {
      this.error.set('Patient lookup failed.');
    } finally {
      this.searchLoading.set(false);
    }
  }

  selectPatient(patient: PatientHit): void {
    this.selectedPatient.set(patient);
    this.error.set('');
    this.checkoutQuote.set(null);
    void this.loadPatientWallet(patient.id);
    void this.refreshCheckoutQuote();
  }

  onExistingDiseaseChange(): void {
    void this.refreshCheckoutQuote();
  }

  onPromoChange(): void {
    void this.refreshCheckoutQuote();
  }

  toggleUseWallet(checked: boolean): void {
    this.existingModel.update((m) => ({ ...m, useWallet: checked }));
    void this.refreshCheckoutQuote();
  }

  private async loadPatientWallet(patientId: string): Promise<void> {
    try {
      const res = await this.api.getPatientRewards(patientId);
      this.walletBalanceInPaise.set(res.balanceInPaise ?? 0);
    } catch {
      this.walletBalanceInPaise.set(0);
    }
  }

  private async refreshCheckoutQuote(): Promise<void> {
    const patient = this.selectedPatient();
    const diseaseId = this.existingModel().diseaseId;
    if (!patient?.id || !diseaseId) {
      this.checkoutQuote.set(null);
      return;
    }

    this.quoteLoading.set(true);
    try {
      const form = this.existingModel();
      const basePayload = {
        diseaseId,
        promoCode: form.promoCode.trim() || undefined
      };
      if (!form.useWallet) {
        const res = await this.api.getPatientCheckoutQuote(patient.id, {
          ...basePayload,
          walletRedeemInPaise: 0
        });
        this.checkoutQuote.set(res.quote as CheckoutQuote);
        return;
      }

      const preview = await this.api.getPatientCheckoutQuote(patient.id, basePayload);
      const maxWallet = Number((preview.quote as CheckoutQuote).maxWalletRedeemInPaise ?? 0);
      if (maxWallet <= 0) {
        this.checkoutQuote.set(preview.quote as CheckoutQuote);
        return;
      }
      const withWallet = await this.api.getPatientCheckoutQuote(patient.id, {
        ...basePayload,
        walletRedeemInPaise: maxWallet
      });
      this.checkoutQuote.set(withWallet.quote as CheckoutQuote);
    } catch {
      this.checkoutQuote.set(null);
    } finally {
      this.quoteLoading.set(false);
    }
  }

  walletRedeemForSubmit(): number | undefined {
    const form = this.existingModel();
    if (!form.useWallet) return undefined;
    return this.checkoutQuote()?.walletRedeemedInPaise || undefined;
  }

  async submitNew(): Promise<void> {
    const form = this.walkInModel();
    if (this.walkInForm().invalid()) {
      this.error.set('Name, mobile, and concern are required.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.api.walkIn({
        name: form.name,
        mobile: form.mobile,
        email: form.email || null,
        diseaseId: form.diseaseId,
        collectCash: form.collectCash,
        notes: form.notes || undefined,
        promoCode: form.promoCode.trim() || undefined
      });
      const code = result?.patient?.patientCode;
      this.toast.set(code ? `Registered — Patient ID: ${code}` : 'Walk-in registered');
      setTimeout(() => this.router.navigate([`/${ROUTE_PATHS.QUEUE}`]), 800);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.error?.message ?? 'Registration failed.');
    } finally {
      this.loading.set(false);
    }
  }

  async submitExisting(): Promise<void> {
    const patient = this.selectedPatient();
    const form = this.existingModel();
    if (!patient) {
      this.error.set('Find and select a patient first.');
      return;
    }
    if (this.existingForm().invalid()) {
      this.error.set('Concern is required.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    try {
      await this.api.bookConsultation({
        patientId: patient.id,
        diseaseId: form.diseaseId,
        collectCash: form.collectCash,
        promoCode: form.promoCode.trim() || undefined,
        walletRedeemInPaise: this.walletRedeemForSubmit()
      });
      const code = patient.patientCode;
      this.toast.set(code ? `Added to queue — Patient ID: ${code}` : 'Added to queue');
      setTimeout(() => this.router.navigate([`/${ROUTE_PATHS.QUEUE}`]), 800);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? e?.error?.message ?? 'Could not add patient to queue.');
    } finally {
      this.loading.set(false);
    }
  }
}
