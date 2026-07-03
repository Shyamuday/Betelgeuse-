import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { AdminApi } from '../../../core/services/admin-api';
import {
  EMPTY_EXPENSE_FORM,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  FINANCE_TABS,
  formatPaise,
  paiseToK,
  type FinanceTabId
} from '../constants/finance.constants';

@Component({
  selector: 'app-finance-page',
  imports: [FormField, DatePipe],
  templateUrl: './finance-page.html',
  styleUrl: './finance-page.scss'
})
export class FinancePage implements OnInit {
  private api = inject(AdminApi);

  tab = signal<FinanceTabId>('overview');
  loading = signal(true);
  error = signal('');
  exporting = signal(false);
  toast = signal('');

  readonly exportFilterModel = signal({ branchExportFilter: '' });
  readonly exportFilterForm = form(this.exportFilterModel);
  readonly monthModel = signal({ selectedMonth: new Date().toISOString().slice(0, 7) });
  readonly monthForm = form(this.monthModel);
  readonly medicineFilterModel = signal({
    medicineFrom: '',
    medicineTo: '',
    storeFilter: ''
  });
  readonly medicineFilterForm = form(this.medicineFilterModel);
  readonly storeExpenseFilterModel = signal({ storeFilter: '' });
  readonly storeExpenseFilterForm = form(this.storeExpenseFilterModel);

  summary = signal<any>(null);
  branchPnl = signal<any[]>([]);
  branchTotals = signal<any>(null);
  trend = signal<any[]>([]);
  byDoctor = signal<any[]>([]);
  byDisease = signal<any[]>([]);
  medicine = signal<{ movements: any[]; totalInPaise: number }>({ movements: [], totalInPaise: 0 });
  clinicExpenses = signal<any[]>([]);
  storeExpenses = signal<any[]>([]);
  outstanding = signal<any[]>([]);
  stores = signal<any[]>([]);

  expenseModal = signal(false);
  editingExpense = signal<any | null>(null);
  readonly expenseModel = signal({ ...EMPTY_EXPENSE_FORM });
  readonly expenseForm = form(this.expenseModel);

  readonly tabs = FINANCE_TABS;
  readonly categories = EXPENSE_CATEGORIES;
  readonly categoryLabels = EXPENSE_CATEGORY_LABELS;
  readonly formatPaise = formatPaise;
  readonly paiseToK = paiseToK;

  ngOnInit(): void {
    this.loadStores();
    this.loadAll();
  }

  loadStores(): void {
    this.api.getAdminStores().then(r => this.stores.set(r.stores)).catch(() => {});
  }

  setTab(id: FinanceTabId): void {
    this.tab.set(id);
    this.loadTab();
  }

  loadAll(): void {
    this.loading.set(true);
    this.error.set('');
    const month = this.monthModel().selectedMonth;
    const medicineFilters = this.medicineFilterModel();
    const storeFilter = this.storeExpenseFilterModel().storeFilter;
    Promise.all([
      this.api.getFinanceSummary(month),
      this.api.getBranchPnl(month),
      this.api.getRevenueTrend(6),
      this.api.getRevenueByDoctor(month),
      this.api.getRevenueByDisease(month),
      this.api.getMedicineRevenue({
        from: medicineFilters.medicineFrom || undefined,
        to: medicineFilters.medicineTo || undefined,
        storeId: medicineFilters.storeFilter || undefined
      }),
      this.api.getExpenses({ level: 'CLINIC' }),
      this.api.getExpenses({ level: 'STORE', storeId: storeFilter || undefined })
    ]).then(([summary, branchData, trend, byDoctor, byDisease, medicine, clinicExpenses, storeExpenses]) => {
      this.summary.set(summary);
      this.branchPnl.set(branchData.branches ?? []);
      this.branchTotals.set(branchData.totals ?? null);
      this.trend.set(trend.rows);
      this.byDoctor.set(byDoctor.rows);
      this.byDisease.set(byDisease.rows);
      this.medicine.set(medicine);
      this.clinicExpenses.set(clinicExpenses.expenses);
      this.storeExpenses.set(storeExpenses.expenses);
      this.loading.set(false);
    }).catch(() => {
      this.error.set('Could not load finance data. Please try again.');
      this.loading.set(false);
    });
  }

  loadTab(): void {
    const month = this.monthModel().selectedMonth;
    const medicineFilters = this.medicineFilterModel();
    const storeFilter = this.storeExpenseFilterModel().storeFilter;
    if (this.tab() === 'overview') {
      this.api.getFinanceSummary(month).then(s => this.summary.set(s)).catch(() => {});
    }
    if (this.tab() === 'outstanding') {
      this.api.getOutstandingPayments().then(r => this.outstanding.set(r.payments || [])).catch(() => {});
    }
    if (this.tab() === 'branches') {
      this.api.getBranchPnl(month).then(r => {
        this.branchPnl.set(r.branches ?? []);
        this.branchTotals.set(r.totals ?? null);
      }).catch(() => {});
    }
    if (this.tab() === 'medicine') {
      this.api.getMedicineRevenue({
        from: medicineFilters.medicineFrom || undefined,
        to: medicineFilters.medicineTo || undefined,
        storeId: medicineFilters.storeFilter || undefined
      }).then(r => this.medicine.set(r)).catch(() => {});
    }
    if (this.tab() === 'clinic-expenses') {
      this.api.getExpenses({ level: 'CLINIC' }).then(r => this.clinicExpenses.set(r.expenses)).catch(() => {});
    }
    if (this.tab() === 'store-expenses') {
      this.api.getExpenses({ level: 'STORE', storeId: storeFilter || undefined }).then(r => this.storeExpenses.set(r.expenses)).catch(() => {});
    }
  }

  openExpenseModal(expense?: any, level: 'CLINIC' | 'STORE' = 'CLINIC'): void {
    if (expense) {
      this.editingExpense.set(expense);
      this.expenseModel.set({
        level: expense.level,
        storeId: expense.storeId ?? '',
        category: expense.category,
        description: expense.description,
        vendor: expense.vendor ?? '',
        billNo: expense.billNo ?? '',
        amountInPaise: expense.amountInPaise,
        expenseDate: expense.expenseDate.slice(0, 10)
      });
    } else {
      this.editingExpense.set(null);
      this.expenseModel.set({
        ...EMPTY_EXPENSE_FORM,
        level,
        storeId: level === 'STORE' ? (this.storeExpenseFilterModel().storeFilter || '') : ''
      });
    }
    this.expenseModal.set(true);
  }

  closeExpenseModal(): void {
    this.expenseModal.set(false);
    this.editingExpense.set(null);
  }

  saveExpense(): void {
    const form = this.expenseModel();
    const amountInPaise = Math.round(Number(form.amountInPaise));
    if (!form.description || !amountInPaise) return;

    const payload = {
      ...form,
      amountInPaise,
      storeId: form.level === 'STORE' ? form.storeId : null
    };

    const req = this.editingExpense()
      ? this.api.updateExpense(this.editingExpense()!.id, payload)
      : this.api.createExpense(payload);

    req.then(() => {
      this.closeExpenseModal();
      this.loadAll();
      this.toast.set('Expense saved');
      setTimeout(() => this.toast.set(''), 2500);
    }).catch(() => this.toast.set('Save failed'));
  }

  deleteExpense(id: string): void {
    if (!confirm('Delete this expense?')) return;
    this.api.deleteExpense(id).then(() => {
      this.loadAll();
      this.toast.set('Expense deleted');
      setTimeout(() => this.toast.set(''), 2500);
    });
  }

  async exportBundle(): Promise<void> {
    this.exporting.set(true);
    try {
      const csv = await this.api.exportAccountantBundle({
        month: this.monthModel().selectedMonth,
        storeId: this.exportFilterModel().branchExportFilter || undefined
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const suffix = this.exportFilterModel().branchExportFilter ? `-${this.exportFilterModel().branchExportFilter}` : '';
      anchor.download = `accountant-bundle-${this.monthModel().selectedMonth}${suffix}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      this.toast.set('Accountant bundle exported');
      setTimeout(() => this.toast.set(''), 2500);
    } catch {
      this.toast.set('Export failed');
      setTimeout(() => this.toast.set(''), 2500);
    } finally {
      this.exporting.set(false);
    }
  }
}
