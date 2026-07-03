import { Component, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { StoreApiService } from '../../../services/store-api.service';
import { StoreRouteContext } from '../../../services/store-route-context.service';
import { MedicineWithStock } from '../../../models/store';
import { ROUTE_PATHS } from '../../../core/constants/store/app-routes.constants';
import { PAGE_SIZES } from '../../../core/constants/store/pagination.constants';

type RemoveType = 'SALE_OUT' | 'ADJUSTMENT_OUT' | 'EXPIRED_REMOVAL';

function emptyRemoveForm() {
  return { qty: 1, note: '', saleAmountInPaise: 0 };
}

@Component({
  selector: 'app-stock-out',
  imports: [FormField],
  templateUrl: './stock-out.component.html',
  styleUrl: './stock-out.component.scss'
})
export class StockOutComponent {
  private api = inject(StoreApiService);
  router = inject(Router);
  readonly storeRoutes = inject(StoreRouteContext);

  readonly routePaths = ROUTE_PATHS;

  readonly searchModel = signal({ q: '' });
  readonly searchForm = form(this.searchModel);

  searchResults = signal<MedicineWithStock[]>([]);
  selectedMedicine = signal<MedicineWithStock | null>(null);
  searching = signal(false);
  removeType = signal<RemoveType>('SALE_OUT');

  readonly removeFormModel = signal(emptyRemoveForm());
  readonly removeForm = form(this.removeFormModel);

  loading = signal(false);
  error = signal('');
  success = signal('');

  private timer: ReturnType<typeof setTimeout> | null = null;

  onSearch(): void {
    const searchQuery = this.searchModel().q;
    if (this.timer) clearTimeout(this.timer);
    if (!searchQuery.trim()) { this.searchResults.set([]); return; }
    this.searching.set(true);
    this.timer = setTimeout(() => {
      this.api.getMedicines({ q: searchQuery, pageSize: PAGE_SIZES.STOCK_LOOKUP }).subscribe({
        next: (r) => { this.searchResults.set(r.medicines); this.searching.set(false); },
        error: () => this.searching.set(false)
      });
    }, 300);
  }

  select(m: MedicineWithStock): void {
    this.selectedMedicine.set(m);
    this.searchResults.set([]);
    this.searchModel.set({ q: '' });
    this.removeFormModel.set({ ...emptyRemoveForm() });
  }

  clear(): void {
    this.selectedMedicine.set(null);
    this.searchResults.set([]);
    this.searchModel.set({ q: '' });
  }

  adjustQty(delta: number): void {
    const med = this.selectedMedicine();
    if (!med) return;
    this.removeFormModel.update((f) => ({
      ...f,
      qty: Math.min(med.currentQty, Math.max(1, f.qty + delta))
    }));
  }

  notePlaceholder(): string {
    const map: Record<RemoveType, string> = {
      SALE_OUT: 'Customer name or prescription #',
      ADJUSTMENT_OUT: 'Reason for adjustment',
      EXPIRED_REMOVAL: 'Batch number or disposal details'
    };
    return map[this.removeType()];
  }

  submit(): void {
    const med = this.selectedMedicine();
    const form = this.removeFormModel();
    if (!med || !form.qty) return;
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.removeStock({
      stockId: med.stockId,
      qty: form.qty,
      type: this.removeType(),
      note: form.note || undefined,
      saleAmountInPaise: this.removeType() === 'SALE_OUT' && form.saleAmountInPaise > 0 ? form.saleAmountInPaise : undefined
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(`Removed ${form.qty} bottles of ${med.name} ${med.potency}`);
        this.clear();
        this.removeFormModel.set(emptyRemoveForm());
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to remove stock');
      }
    });
  }
}
