import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';
import {
  EMPLOYEE_STATUS_COLORS,
  formatPaise,
  paiseToK,
  PAYROLL_TYPE_FILTERS
} from '../constants/payroll.constants';

interface PayrollRow {
  id: string; empType: string; name: string;
  designation: string | null; department: string | null;
  grossPaise: number; leaveDays: number; netPaise: number;
  employeeStatus: string;
}

@Component({
  selector: 'app-payroll-page',
  imports: [FormField],
  templateUrl: './payroll-page.html',
  styleUrl: './payroll-page.scss'
})
export class PayrollPage implements OnInit {
  private api = inject(AdminApi);

  rows = signal<PayrollRow[]>([]);
  loading = signal(true);
  summary = signal({ totalGross: 0, totalNet: 0, totalLeave: 0, headcount: 0 });
  typeFilter = signal<string>('ALL');
  toast = signal('');

  readonly monthModel = signal({ selectedMonth: new Date().toISOString().slice(0, 7) });
  readonly monthForm = form(this.monthModel);
  readonly searchModel = signal({ q: '' });
  readonly searchForm = form(this.searchModel);

  typeFilters = PAYROLL_TYPE_FILTERS;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.getPayroll(this.monthModel().selectedMonth)
      .then(r => { this.rows.set(r.rows); this.summary.set(r.summary); this.loading.set(false); })
      .catch(() => this.loading.set(false));
  }

  filtered(): PayrollRow[] {
    const q = this.searchModel().q.toLowerCase();
    return this.rows().filter(r => {
      if (this.typeFilter() !== 'ALL' && r.empType !== this.typeFilter()) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  filteredGross(): number { return this.filtered().reduce((a, r) => a + r.grossPaise, 0); }
  filteredNet():   number { return this.filtered().reduce((a, r) => a + r.netPaise,   0); }
  filteredLeave(): number { return this.filtered().reduce((a, r) => a + r.leaveDays,  0); }

  fmt(paise: number): string { return formatPaise(paise); }
  paise2k(paise: number): string { return paiseToK(paise); }

  statusColor(s: string): string {
    return EMPLOYEE_STATUS_COLORS[s] ?? '#94a3b8';
  }

  exportCSV(): void {
    const rows = this.filtered();
    const header = 'Name,Type,Designation,Department,Gross (Rs),Leave Days,Deduction (Rs),Net (Rs)';
    const lines = rows.map(r =>
      `"${r.name}","${r.empType}","${r.designation ?? ''}","${r.department ?? ''}",` +
      `${r.grossPaise / 100},${r.leaveDays},${(r.grossPaise - r.netPaise) / 100},${r.netPaise / 100}`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${this.monthModel().selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('CSV exported ✓');
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
