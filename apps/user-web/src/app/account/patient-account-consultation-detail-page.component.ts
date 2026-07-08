import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConsultationDetailComponent, SendMessagePayload } from '../consultation-detail.component';
import { ClinicApiService } from '../clinic-api.service';
import { Consultation } from '../models';

@Component({
  selector: 'app-patient-account-consultation-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConsultationDetailComponent],
  templateUrl: './patient-account-consultation-detail-page.component.html',
  styleUrl: './patient-account-consultation-detail-page.component.scss',
})
export class PatientAccountConsultationDetailPageComponent implements OnInit {
  private readonly api = inject(ClinicApiService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly processing = signal(false);
  readonly consultation = signal<Consultation | null>(null);
  readonly notice = signal('');

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.consultation.set(null);
        this.loading.set(false);
        return;
      }
      this.load(id);
    });
  }

  private load(id: string) {
    this.loading.set(true);
    this.api.consultations().subscribe({
      next: ({ consultations }) => {
        this.consultation.set(consultations.find((c) => c.id === id) ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.notice.set('Could not load consultation.');
        this.loading.set(false);
      },
    });
  }

  onMessageSent(payload: SendMessagePayload) {
    this.processing.set(true);
    this.api.sendMessage(payload.consultation.id, payload.body).subscribe({
      next: () => this.load(payload.consultation.id),
      error: (error) => {
        this.processing.set(false);
        this.notice.set(error.error?.message || error.message || 'Could not send message.');
      },
      complete: () => this.processing.set(false),
    });
  }
}
