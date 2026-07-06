import { Component, signal } from '@angular/core';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { WHATSAPP_CONTACT_URL } from './core/constants/branding.constants';
import { API_PATHS } from './core/constants/api-paths.constants';
import { ClinicApiClient } from './clinic-api/clinic-api.client';

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
}

@Component({
  selector: 'app-faq',
  imports: [AppHeaderComponent, AppFooterComponent],
  templateUrl: './faq.component.html',
})
export class FaqComponent {
  readonly whatsappLink = WHATSAPP_CONTACT_URL;
  readonly entries = signal<FaqEntry[]>([]);
  readonly loading = signal(true);
  private readonly client = new ClinicApiClient();

  constructor() { void this.load(); }

  private async load() {
    try {
      const res = await this.client.get<{ entries: FaqEntry[] }>(API_PATHS.FAQ);
      this.entries.set(res.entries ?? []);
    } catch { /* show empty state */ }
    finally { this.loading.set(false); }
  }

  categories(): string[] {
    return [...new Set(this.entries().map((e) => e.category))];
  }

  entriesForCategory(cat: string): FaqEntry[] {
    return this.entries().filter((e) => e.category === cat);
  }
}
