import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { StoreApiService } from '../../../services/store-api.service';
import { formatPaise } from './constants/my-pay.constants';

@Component({
  selector: 'app-my-pay-page',
  imports: [FormField],
  templateUrl: './my-pay-page.html',
  styleUrl: './my-pay-page.scss'
})
export class MyPayPage implements OnInit {
  private api = inject(StoreApiService);

  loading = signal(true);
  payslip = signal<any>(null);
  history = signal<any[]>([]);
  error = signal('');

  readonly monthModel = signal({ selectedMonth: new Date().toISOString().slice(0, 7) });
  readonly monthForm = form(this.monthModel);

  readonly formatPaise = formatPaise;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getMyPayslip(this.monthModel().selectedMonth).subscribe({
      next: (res) => {
        this.payslip.set(res.payslip);
        this.history.set(res.history ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load payslip.');
        this.loading.set(false);
      }
    });
  }
}
