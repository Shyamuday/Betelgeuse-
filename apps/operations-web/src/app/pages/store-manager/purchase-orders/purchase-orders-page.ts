import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { DatePipe } from '@angular/common';
import { StoreApiService } from '../../../services/store-api.service';

type ReceiveLine = {
  purchaseOrderLineId: string;
  label: string;
  qtyRemaining: number;
  qtyReceived: number;
  batchNumber: string;
  expiryDate: string;
  purchasePricePerUnit: number;
  sellingPricePerUnit: number;
};

function emptyReceiveForm() {
  return { note: '', lines: [] as ReceiveLine[] };
}

@Component({
  selector: 'app-purchase-orders-page',
  standalone: true,
  imports: [FormField, DatePipe],
  templateUrl: './purchase-orders-page.html',
  styleUrl: './purchase-orders-page.scss'
})
export class PurchaseOrdersPage implements OnInit {
  private api = inject(StoreApiService);

  loading = signal(true);
  error = signal('');
  orders = signal<any[]>([]);
  receivingId = signal<string | null>(null);
  toast = signal('');

  readonly receiveFormModel = signal(emptyReceiveForm());
  readonly receiveForm = form(this.receiveFormModel);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getPurchaseOrders().subscribe({
      next: (res) => {
        this.orders.set(
          (res.orders ?? []).filter((o) =>
            ['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(o.status)
          )
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load purchase orders.');
        this.loading.set(false);
      }
    });
  }

  openReceive(order: any): void {
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 2);
    const expiry = defaultExpiry.toISOString().slice(0, 10);

    this.receivingId.set(order.id);
    this.receiveFormModel.set({
      note: '',
      lines: order.lines
        .filter((line: any) => line.qtyReceived < line.qtyOrdered)
        .map((line: any) => ({
          purchaseOrderLineId: line.id,
          label: `${line.medicine.name} ${line.medicine.potency}`,
          qtyRemaining: line.qtyOrdered - line.qtyReceived,
          qtyReceived: line.qtyOrdered - line.qtyReceived,
          batchNumber: `B-${line.medicine.name.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
          expiryDate: expiry,
          purchasePricePerUnit: line.unitPriceInPaise,
          sellingPricePerUnit: Math.round(line.unitPriceInPaise * 1.25)
        }))
    });
  }

  closeReceive(): void {
    this.receivingId.set(null);
    this.receiveFormModel.set(emptyReceiveForm());
  }

  submitReceive(): void {
    const id = this.receivingId();
    if (!id) return;
    const form = this.receiveFormModel();
    const lines = form.lines.filter((line) => line.qtyReceived > 0);
    if (!lines.length) return;

    this.api.postPurchaseOrderGrn(id, {
      note: form.note || undefined,
      lines: lines.map((line) => ({
        purchaseOrderLineId: line.purchaseOrderLineId,
        qtyReceived: line.qtyReceived,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate,
        purchasePricePerUnit: line.purchasePricePerUnit,
        sellingPricePerUnit: line.sellingPricePerUnit
      }))
    }).subscribe({
      next: () => {
        this.toast.set('Goods receipt posted — stock updated');
        setTimeout(() => this.toast.set(''), 2500);
        this.closeReceive();
        this.load();
      },
      error: (err) => {
        this.toast.set(err.error?.message || 'GRN failed');
        setTimeout(() => this.toast.set(''), 3000);
      }
    });
  }
}
