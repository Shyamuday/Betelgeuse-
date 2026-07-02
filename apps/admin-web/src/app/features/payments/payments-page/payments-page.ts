import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AdminApi } from '../../../core/services/admin-api';
import {
  formatPaise,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_STATUS_STYLES,
  PAYMENTS_PAGE_SIZE
} from '../constants/payment-status.constants';

@Component({
  selector: 'app-payments-page',
  imports: [FormsModule, DatePipe],
  templateUrl: './payments-page.html',
  styleUrl: './payments-page.scss'
})
export class PaymentsPage implements OnInit {
  private api = inject(AdminApi);

  payments = signal<any[]>([]);
  summary = signal({ total: 0, paid: 0, failedCount: 0, pendingCount: 0 });
  loading = signal(true);
  page = signal(1);
  pageSize = PAYMENTS_PAGE_SIZE;
  total = signal(0);
  statusFilter = signal('ALL');
  from = '';
  to = '';
  toast = signal('');
  exporting = signal(false);

  readonly statusOptions = PAYMENT_STATUS_OPTIONS;
  readonly statusStyles = PAYMENT_STATUS_STYLES;
  readonly formatPaise = formatPaise;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getPayments({
      page: this.page(),
      pageSize: this.pageSize,
      status: this.statusFilter() as any,
      from: this.from || undefined,
      to: this.to || undefined
    }).then(r => {
      this.payments.set(r.payments);
      this.summary.set(r.summary);
      this.total.set(r.pagination?.total ?? r.payments.length);
      this.loading.set(false);
    }).catch(() => this.loading.set(false));
  }

  setStatus(value: string): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.load();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.load();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.load();
    }
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  async exportCsv(): Promise<void> {
    this.exporting.set(true);
    try {
      const csv = await this.api.exportPaymentsCsv({
        status: this.statusFilter() as any,
        from: this.from || undefined,
        to: this.to || undefined
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      this.toast.set('CSV exported');
    } catch {
      this.toast.set('Export failed');
    } finally {
      this.exporting.set(false);
      setTimeout(() => this.toast.set(''), 2500);
    }
  }
}
