import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { AdminApi } from '../../../core/services/admin-api';

type ConfigEntry = { key: string; value: string; label: string; description: string };

@Component({
  selector: 'app-site-config-page',
  imports: [CommonModule],
  templateUrl: './site-config-page.html',
  styleUrl: './site-config-page.scss'
})
export class SiteConfigPage {
  readonly config = signal<ConfigEntry[]>([]);
  readonly loading = signal(false);
  readonly saving = signal<string | null>(null);
  readonly error = signal('');
  readonly message = signal('');

  readonly localValues = signal<Record<string, string>>({});

  constructor(private readonly api: AdminApi) { void this.load(); }

  async load() {
    this.loading.set(true);
    try {
      const res = await this.api.getSiteConfig();
      this.config.set(res.config);
      const map: Record<string, string> = {};
      res.config.forEach((c) => { map[c.key] = c.value; });
      this.localValues.set(map);
    } catch {
      this.error.set('Could not load settings.');
    } finally {
      this.loading.set(false);
    }
  }

  updateLocal(key: string, value: string) {
    this.localValues.update((m) => ({ ...m, [key]: value }));
  }

  async save(key: string) {
    const value = this.localValues()[key];
    if (!value?.trim()) return;
    this.saving.set(key);
    this.message.set('');
    try {
      await this.api.setSiteConfig(key, value.trim());
      this.message.set(`"${key}" saved.`);
      await this.load();
    } catch {
      this.error.set(`Could not save "${key}".`);
    } finally {
      this.saving.set(null);
    }
  }
}
