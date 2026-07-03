import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  imports: [FormsModule, DatePipe],
  templateUrl: './store-expenses-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './store-expenses-page.scss'
})
export class StoreExpensesPage implements OnInit {
  private api = inject(StoreApiService);

  expenses = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);
  showForm = signal(false);
  categoryFilter = '';
  form = { ...EMPTY_STORE_EXPENSE };
  toast = signal('');

  readonly categories = EXPENSE_CATEGORIES;
  readonly categoryLabels = EXPENSE_CATEGORY_LABELS;
  readonly formatPaise = formatPaise;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.getStoreExpenses(this.categoryFilter || undefined).subscribe({
      next: (res) => {
        this.expenses.set(res.expenses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openForm(): void {
    this.form = { ...EMPTY_STORE_EXPENSE };
    this.showForm.set(true);
  }

  submit(): void {
    const amountInPaise = Math.round(Number(this.form.amountInPaise));
    if (!this.form.description || !amountInPaise) return;
    this.saving.set(true);
    this.api.createStoreExpense({ ...this.form, amountInPaise }).subscribe({
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
