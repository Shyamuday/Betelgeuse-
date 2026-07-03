import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoreApiService } from '../../../services/store-api.service';
import { formatPaise } from './constants/my-pay.constants';

@Component({
  selector: 'app-my-pay-page',
  imports: [FormsModule],
  templateUrl: './my-pay-page.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './my-pay-page.scss'
})
export class MyPayPage implements OnInit {
  private api = inject(StoreApiService);

  loading = signal(true);
  selectedMonth = new Date().toISOString().slice(0, 7);
  payslip = signal<any>(null);
  history = signal<any[]>([]);
  error = signal('');

  readonly formatPaise = formatPaise;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getMyPayslip(this.selectedMonth).subscribe({
      next: (res: { payslip: any; history: any[] }) => {
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
