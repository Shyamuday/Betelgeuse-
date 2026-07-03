import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { AdminApi } from '../../../core/services/admin-api';

@Component({
  selector: 'app-inventory-page',
  imports: [FormField],
  templateUrl: './inventory-page.html',
  styleUrl: './inventory-page.scss'
})
export class InventoryPage implements OnInit {
  private api = inject(AdminApi);

  overview = signal<any[]>([]);
  stocks = signal<any[]>([]);
  selectedStoreId = signal('');
  selectedStore = signal<any>(null);
  loading = signal(true);
  stockLoading = signal(false);
  error = signal('');

  readonly filterModel = signal({ q: '', statusFilter: '' });
  readonly filterForm = form(this.filterModel);

  ngOnInit(): void {
    void this.loadOverview();
  }

  async loadOverview() {
    this.loading.set(true);
    this.error.set('');
    try {
      const response = await this.api.getInventoryOverview();
      this.overview.set(response.stores);
      if (!this.selectedStoreId() && response.stores.length) {
        this.selectStore(response.stores[0].id);
      }
    } catch {
      this.error.set('Could not load inventory overview.');
    } finally {
      this.loading.set(false);
    }
  }

  selectStore(storeId: string) {
    this.selectedStoreId.set(storeId);
    void this.loadStock();
  }

  async loadStock(page = 1) {
    const storeId = this.selectedStoreId();
    if (!storeId) return;
    this.stockLoading.set(true);
    const filters = this.filterModel();
    try {
      const response = await this.api.getStoreStock(storeId, {
        q: filters.q,
        status: filters.statusFilter,
        page
      });
      this.stocks.set(response.stocks);
      this.selectedStore.set(response.store);
    } catch {
      this.error.set('Could not load store stock.');
    } finally {
      this.stockLoading.set(false);
    }
  }
}
