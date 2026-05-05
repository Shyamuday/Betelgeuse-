import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Auth } from '../../../core/services/auth';

type OptionType = 'METHOD' | 'DIAGNOSED_DISEASE';

type PrescriptionOption = {
  id: string;
  label: string;
};

@Component({
  selector: 'app-appointments-page',
  imports: [FormsModule],
  templateUrl: './appointments-page.html',
  styleUrl: './appointments-page.scss'
})
export class AppointmentsPage {
  private readonly apiBase = 'http://localhost:4000';

  consultationId = '';
  methodOptionId = '';
  diagnosedDiseaseOptionId = '';
  diagnosis = '';
  notes = '';
  advice = '';

  methods: PrescriptionOption[] = [];
  diagnosedDiseases: PrescriptionOption[] = [];

  newMethod = '';
  newDiagnosedDisease = '';
  message = '';
  error = '';

  constructor(
    private readonly http: HttpClient,
    private readonly auth: Auth
  ) {
    void this.loadOptions();
  }

  private headers() {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.token()}`
    });
  }

  private async loadByType(type: OptionType) {
    const response = await firstValueFrom(
      this.http.get<{ options: PrescriptionOption[] }>(`${this.apiBase}/doctor/prescription-options`, {
        headers: this.headers(),
        params: { type }
      })
    );

    return response.options;
  }

  async loadOptions() {
    this.error = '';
    try {
      this.methods = await this.loadByType('METHOD');
      this.diagnosedDiseases = await this.loadByType('DIAGNOSED_DISEASE');
    } catch {
      this.error = 'Could not load dropdown options. Login with API-backed doctor account.';
    }
  }

  async addOption(type: OptionType) {
    this.message = '';
    this.error = '';

    const label = type === 'METHOD' ? this.newMethod.trim() : this.newDiagnosedDisease.trim();
    if (!label) {
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<{ option: PrescriptionOption }>(
          `${this.apiBase}/doctor/prescription-options`,
          { type, label },
          { headers: this.headers() }
        )
      );

      if (type === 'METHOD') {
        this.newMethod = '';
        this.methods = [...this.methods, response.option].sort((a, b) => a.label.localeCompare(b.label));
        this.methodOptionId = response.option.id;
      } else {
        this.newDiagnosedDisease = '';
        this.diagnosedDiseases = [...this.diagnosedDiseases, response.option].sort((a, b) =>
          a.label.localeCompare(b.label)
        );
        this.diagnosedDiseaseOptionId = response.option.id;
      }
      this.message = 'Option added successfully.';
    } catch {
      this.error = 'Could not add option.';
    }
  }

  async createPrescription() {
    this.message = '';
    this.error = '';

    if (!this.consultationId || !this.methodOptionId || !this.diagnosedDiseaseOptionId || !this.diagnosis || !this.notes) {
      this.error = 'Please fill consultation id, method, diagnosed disease, diagnosis and notes.';
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(
          `${this.apiBase}/doctor/appointments/${this.consultationId}/prescriptions`,
          {
            methodOptionId: this.methodOptionId,
            diagnosedDiseaseOptionId: this.diagnosedDiseaseOptionId,
            diagnosis: this.diagnosis,
            notes: this.notes,
            advice: this.advice || undefined,
            status: 'PUBLISHED',
            items: [{ medicineName: 'See prescription notes', instructions: this.notes }]
          },
          { headers: this.headers() }
        )
      );

      this.message = 'Prescription saved and published.';
    } catch {
      this.error = 'Could not save prescription. Check consultation id and assignment.';
    }
  }
}
