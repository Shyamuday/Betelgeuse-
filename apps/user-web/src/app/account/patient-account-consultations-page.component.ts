import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsultationListComponent } from '../consultation-list.component';
import { PaymentStatusOverlayComponent } from '../payment-status-overlay.component';
import { ClinicApiService } from '../clinic-api.service';
import { DashboardPaymentService } from '../dashboard-data.service';
import { ROUTE_PATHS } from '../core/constants/app-routes.constants';
import { Consultation } from '../models';

@Component({
  selector: 'app-patient-account-consultations-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ConsultationListComponent, PaymentStatusOverlayComponent],
  templateUrl: './patient-account-consultations-page.component.html',
  styleUrl: './patient-account-consultations-page.component.scss'
})
export class PatientAccountConsultationsPageComponent implements OnInit {
  private readonly api = inject(ClinicApiService);
  readonly paymentService = inject(DashboardPaymentService);

  readonly loading = signal(true);
  readonly processing = signal(false);
  readonly consultations = signal<Consultation[]>([]);
  readonly activeId = signal<string | null>(null);
  readonly notice = signal('');

  readonly dashboardLink = `/${ROUTE_PATHS.PATIENT_DASHBOARD}`;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.api.consultations().subscribe({
      next: ({ consultations }) => {
        this.consultations.set(consultations);
        this.loading.set(false);
      },
      error: () => {
        this.notice.set('Could not load consultations.');
        this.loading.set(false);
      }
    });
  }

  selectConsultation(c: Consultation) {
    this.activeId.set(c.id);
  }

  pay(consultation: Consultation) {
    this.paymentService.pay(
      consultation,
      () => {
        this.notice.set('Payment verified.');
        this.load();
      },
      (message) => this.notice.set(message),
      (p) => this.processing.set(p)
    );
  }

  paymentFlowTitle() {
    return this.paymentService.paymentFlowTitle();
  }

  paymentFlowMessage() {
    return this.paymentService.paymentFlowMessage();
  }

  retryPayment() {
    this.paymentService.retryPayment(
      () => {
        this.notice.set('Payment verified.');
        this.load();
      },
      (message) => this.notice.set(message),
      (p) => this.processing.set(p)
    );
  }

  closePaymentOverlay() {
    this.paymentService.closePaymentOverlay();
  }
}
