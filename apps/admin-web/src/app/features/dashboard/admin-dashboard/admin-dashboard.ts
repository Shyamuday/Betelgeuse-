import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin-api';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard {
  revenueInPaise = 0;
  activeDoctors = 0;
  consultationsCount = 0;
  auditLogs: Array<{
    id: string;
    action: string;
    actorRole?: string;
    targetType: string;
    targetId: string;
    summary?: string;
    createdAt: string;
  }> = [];
  payments: Array<any> = [];
  paymentsPage = 1;
  paymentsTotalPages = 1;
  paymentStatus: 'ALL' | 'CREATED' | 'PAID' | 'FAILED' = 'ALL';
  paymentFrom = '';
  paymentTo = '';
  paymentSummary = { total: 0, paid: 0, failedCount: 0, pendingCount: 0 };
  error = '';

  constructor(private readonly api: AdminApi) {
    void this.load();
  }

  async load() {
    this.error = '';
    try {
      const report = (await this.api.getReports()) as {
        revenueInPaise: number;
        activeDoctors: number;
        consultations: Array<unknown>;
      };
      this.revenueInPaise = report.revenueInPaise || 0;
      this.activeDoctors = report.activeDoctors || 0;
      this.consultationsCount = report.consultations?.length || 0;
      const audit = await this.api.getAuditLogs(1, 15);
      this.auditLogs = audit.logs || [];
      await this.loadPayments();
    } catch {
      this.error = 'Could not load admin dashboard summary.';
    }
  }

  async loadPayments(page = this.paymentsPage) {
    this.paymentsPage = page;
    const result = await this.api.getPayments({
      page,
      pageSize: 10,
      status: this.paymentStatus,
      from: this.paymentFrom || undefined,
      to: this.paymentTo || undefined
    });
    this.payments = result.payments || [];
    this.paymentSummary = result.summary || this.paymentSummary;
    this.paymentsTotalPages = result.pagination?.totalPages || 1;
  }

  async applyPaymentFilters() {
    await this.loadPayments(1);
  }

  paymentPages() {
    return Array.from({ length: this.paymentsTotalPages }, (_, i) => i + 1);
  }

  async exportPaymentsCsv() {
    const csv = await this.api.exportPaymentsCsv({
      page: this.paymentsPage,
      pageSize: 100,
      status: this.paymentStatus,
      from: this.paymentFrom || undefined,
      to: this.paymentTo || undefined
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admin-payments.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
