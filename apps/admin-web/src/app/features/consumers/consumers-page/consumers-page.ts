import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApi } from '../../../core/services/admin-api';

type Consumer = {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  consultations: number;
};

@Component({
  selector: 'app-consumers-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './consumers-page.html',
  styleUrl: './consumers-page.scss'
})
export class ConsumersPage {
  consumers: Consumer[] = [];
  searchTerm = '';
  sortBy: 'name' | 'consultations' = 'consultations';
  sortDirection: 'asc' | 'desc' = 'desc';
  pageSize = 8;
  page = 1;
  error = '';

  constructor(private readonly api: AdminApi) {
    void this.load();
  }

  async load() {
    this.error = '';
    try {
      const response = await this.api.getConsultations();
      const consultations = response.consultations || [];
      const grouped = new Map<string, Consumer>();

      for (const consultation of consultations) {
        const patient = consultation.patient;
        if (!patient?.id) {
          continue;
        }

        const existing = grouped.get(patient.id);
        if (existing) {
          existing.consultations += 1;
          continue;
        }

        grouped.set(patient.id, {
          id: patient.id,
          name: patient.name || 'Unknown',
          email: patient.email || '',
          mobile: patient.mobile || '',
          consultations: 1
        });
      }

      this.consumers = Array.from(grouped.values()).sort((a, b) => b.consultations - a.consultations);
    } catch {
      this.error = 'Could not load consumers.';
    }
  }

  setPage(page: number) {
    this.page = page;
  }

  visibleConsumers() {
    const filtered = this.filteredConsumers();
    const start = (Math.max(this.page, 1) - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  }

  totalPages() {
    return Math.max(1, Math.ceil(this.filteredConsumers().length / this.pageSize));
  }

  pages() {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  }

  private filteredConsumers() {
    const search = this.searchTerm.trim().toLowerCase();
    const filtered = this.consumers.filter((consumer) => {
      if (!search) {
        return true;
      }

      return [consumer.name, consumer.email || '', consumer.mobile || ''].join(' ').toLowerCase().includes(search);
    });

    filtered.sort((a, b) => {
      const left = this.sortBy === 'name' ? a.name : String(a.consultations);
      const right = this.sortBy === 'name' ? b.name : String(b.consultations);
      const compare = left.localeCompare(right, undefined, { numeric: true });
      return this.sortDirection === 'asc' ? compare : -compare;
    });

    return filtered;
  }
}
