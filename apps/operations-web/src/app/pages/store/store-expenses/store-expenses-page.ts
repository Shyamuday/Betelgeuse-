import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { StoreApiService } from '../../../services/store-api.service';
import {
  EMPTY_STORE_EXPENSE,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  formatPaise
} from './constants/store-expenses.constants';

@Component({
  selector: 'app-store-expenses-page',
  imports: [FormField, DatePipe],
  templateUrl: './store-expenses-page.html',
  styleUrl: './store-expenses-page.scss'
})
export class StoreExpensesPage implements OnInit {
  private api = inject(StoreApiService);

  expenses = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  toast = signal('');

  readonly filterModel = signal({ categoryFilter: '' });
  readonly filterForm = form(this.filterModel);

  readonly expenseFormModel = signal({ ...EMPTY_STORE_EXPENSE });
  readonly expenseForm = form(this.expenseFormModel);

  readonly categories = EXPENSE_CATEGORIES;
  readonly categoryLabels = EXPENSE_CATEGORY_LABELS;
  readonly formatPaise = formatPaise;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getStoreExpenses(this.filterModel().categoryFilter || undefined).subscribe({
      next: (res) => {
        this.expenses.set(res.expenses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openForm(): void {
    this.expenseFormModel.set({ ...EMPTY_STORE_EXPENSE });
    this.showForm.set(true);
  }

  submit(): void {
    const form = this.expenseFormModel();
    const amountInPaise = Math.round(Number(form.amountInPaise));
    if (!form.description || !amountInPaise) return;
    this.saving.set(true);
    this.api.createStoreExpense({ ...form, amountInPaise }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
        this.toast.set('Expense logged');
        setTimeout(() => this.toast.set(''), 2500);
      },
      error: () => {
        this.saving.set(false);
        this.toast.set('Failed to save expense');
      }
    });
  }
}
