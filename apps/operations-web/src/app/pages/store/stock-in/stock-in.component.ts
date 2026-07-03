import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreApiService } from '../../../services/store-api.service';
import { StoreRouteContext } from '../../../services/store-route-context.service';
import { MedicineWithStock, StoreRack } from '../../../models/store';
import { ROUTE_PATHS } from '../../../core/constants/store/app-routes.constants';
import { PAGE_SIZES } from '../../../core/constants/store/pagination.constants';

function emptyStockForm() {
  return {
    batchNumber: '',
    manufacturer: '',
    qty: 0,
    expiryDate: '',
    purchasePriceRs: 0,
    sellingPriceRs: 0,
    rackId: '',
    note: ''
  };
}

@Component({
  selector: 'app-stock-in',
  imports: [FormField],
  templateUrl: './stock-in.component.html',
  styleUrl: './stock-in.component.scss'
})
export class StockInComponent implements OnInit {
  private api = inject(StoreApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly storeRoutes = inject(StoreRouteContext);

  readonly searchModel = signal({ q: '' });
  readonly searchForm = form(this.searchModel);

  searchResults = signal<MedicineWithStock[]>([]);
  selectedMedicine = signal<MedicineWithStock | null>(null);
  searching = signal(false);
  racks = signal<StoreRack[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');

  today = new Date().toISOString().split('T')[0];

  readonly stockFormModel = signal(emptyStockForm());
  readonly stockForm = form(this.stockFormModel);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.api.getRacks().subscribe({ next: (r) => this.racks.set(r.racks) });

    const preselect = this.route.snapshot.queryParamMap.get('medicineId');
    if (preselect) {
      this.api.getMedicine(preselect).subscribe({
        next: (res) => {
          if (res.medicine) this.selectedMedicine.set(res.medicine);
        }
      });
    }
  }

  onSearchChange(): void {
    const medicineSearch = this.searchModel().q;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (!medicineSearch.trim()) {
      this.searchResults.set([]);
      return;
    }
    this.searching.set(true);
    this.searchTimer = setTimeout(() => {
      this.api.getMedicines({ q: medicineSearch, pageSize: PAGE_SIZES.STOCK_LOOKUP }).subscribe({
        next: (res) => {
          this.searchResults.set(res.medicines);
          this.searching.set(false);
        },
        error: () => this.searching.set(false)
      });
    }, 300);
  }

  selectMedicine(m: MedicineWithStock): void {
    this.selectedMedicine.set(m);
    this.searchResults.set([]);
    this.searchModel.set({ q: '' });
  }

  clearMedicine(): void {
    this.selectedMedicine.set(null);
    this.searchResults.set([]);
    this.searchModel.set({ q: '' });
  }

  isValid(): boolean {
    const form = this.stockFormModel();
    return !!(this.selectedMedicine() && form.batchNumber && form.qty > 0 &&
      form.expiryDate && form.purchasePriceRs >= 0 && form.sellingPriceRs >= 0);
  }

  marginPercent(): number {
    const form = this.stockFormModel();
    if (!form.purchasePriceRs) return 0;
    return ((form.sellingPriceRs - form.purchasePriceRs) / form.purchasePriceRs) * 100;
  }

  submit(): void {
    if (!this.isValid()) return;
    const form = this.stockFormModel();
    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    const med = this.selectedMedicine()!;
    this.api.addStock({
      medicineId: med.id,
      qty: form.qty,
      batchNumber: form.batchNumber,
      expiryDate: form.expiryDate,
      purchasePricePerUnit: Math.round(form.purchasePriceRs * 100),
      sellingPricePerUnit: Math.round(form.sellingPriceRs * 100),
      rackId: form.rackId || undefined,
      note: form.note || undefined
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(`Successfully added ${form.qty} bottles of ${med.name} ${med.potency}`);
        this.clearMedicine();
        this.stockFormModel.set(emptyStockForm());
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to add stock');
      }
    });
  }

  goBack(): void { void this.router.navigate(this.storeRoutes.link(ROUTE_PATHS.DASHBOARD)); }
}
