import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClinicApiService } from '../clinic-api.service';

type DeliveryDetail = {
  id: string;
  deliveryNumber: string;
  status: string;
  deliveryAddress: string;
  deliveryPhone: string;
  createdAt: string;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  notes?: string | null;
  store?: { name: string; code: string; address?: string | null; phone?: string | null } | null;
  assignedExecutive?: { name: string; mobile?: string | null } | null;
  lines?: Array<{ label: string; qty: number; medicine?: { name: string; potency?: string | null } | null }>;
  totals?: { lineCount: number; itemCount: number };
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Order placed',
  ASSIGNED: 'Preparing',
  OUT_FOR_DELIVERY: 'On the way',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const STATUS_STEPS = ['PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;

@Component({
  selector: 'app-patient-account-order-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-account-order-detail-page.component.html',
  styleUrl: './patient-account-order-detail-page.component.scss',
})
export class PatientAccountOrderDetailPageComponent implements OnInit {
  private readonly api = inject(ClinicApiService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly delivery = signal<DeliveryDetail | null>(null);

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      this.load(id);
    });
  }

  private load(id: string) {
    this.loading.set(true);
    this.notFound.set(false);
    this.api.patientDelivery(id).subscribe({
      next: ({ delivery }) => this.delivery.set(delivery as DeliveryDetail),
      error: () => {
        this.delivery.set(null);
        this.notFound.set(true);
      },
      complete: () => this.loading.set(false),
    });
  }

  statusText(status: string) {
    return STATUS_LABELS[status] ?? status;
  }

  timelineSteps() {
    return STATUS_STEPS.map((step) => ({
      key: step,
      label: STATUS_LABELS[step],
      done: this.isStepDone(step),
      active: this.delivery()?.status === step,
    }));
  }

  private isStepDone(step: (typeof STATUS_STEPS)[number]) {
    const status = this.delivery()?.status;
    if (!status) return false;
    const currentIndex = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
    const stepIndex = STATUS_STEPS.indexOf(step);
    if (currentIndex < 0) return false;
    return stepIndex <= currentIndex;
  }
}
