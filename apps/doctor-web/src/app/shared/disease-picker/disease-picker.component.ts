import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  DiseaseCatalogService,
  type DiseaseCategory,
  type GroupedDiseaseCategory
} from '../../core/services/disease-catalog.service';

@Component({
  selector: 'app-disease-picker',
  standalone: true,
  imports: [CommonModule, FormField],
  templateUrl: './disease-picker.component.html',
  styleUrl: './disease-picker.component.scss'
})
export class DiseasePickerComponent implements OnInit {
  private readonly catalog = inject(DiseaseCatalogService);

  @Input() value = '';
  @Input() label = 'Related disease';
  @Input() selectId = 'disease-picker';
  @Output() valueChange = new EventEmitter<string>();

  readonly categories = signal<GroupedDiseaseCategory[]>([]);
  readonly uncategorized = signal<Array<{ id: string; name: string }>>([]);
  readonly categoryOptions = signal<DiseaseCategory[]>([]);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly error = signal('');
  readonly showAddForm = signal(false);

  readonly searchModel = signal({ q: '' });
  readonly searchForm = form(this.searchModel);

  readonly addModel = signal({ name: '', publicCategory: 'miscellaneous' });
  readonly addForm = form(this.addModel);

  ngOnInit() {
    void this.bootstrap();
  }

  async bootstrap() {
    this.loading.set(true);
    this.error.set('');
    try {
      const [categoryOptions, catalog] = await Promise.all([
        this.catalog.loadCategories(),
        this.catalog.loadDiseases()
      ]);
      this.categoryOptions.set(categoryOptions);
      this.categories.set(catalog.categories);
      this.uncategorized.set(catalog.uncategorized);
    } catch {
      this.error.set('Could not load disease list.');
      this.categories.set([]);
      this.uncategorized.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async searchDiseases() {
    const q = this.searchModel().q.trim();
    this.loading.set(true);
    this.error.set('');
    try {
      const catalog = await this.catalog.loadDiseases({ q: q || undefined });
      this.categories.set(catalog.categories);
      this.uncategorized.set(catalog.uncategorized);
    } catch {
      this.error.set('Search failed.');
    } finally {
      this.loading.set(false);
    }
  }

  onSelect(value: string) {
    this.value = value;
    this.valueChange.emit(value);
  }

  toggleAddForm() {
    this.showAddForm.update((open) => !open);
    this.error.set('');
  }

  async createDisease() {
    const draft = this.addModel();
    const name = draft.name.trim();
    if (!name) {
      this.error.set('Enter a disease name.');
      return;
    }

    this.creating.set(true);
    this.error.set('');
    try {
      const disease = await this.catalog.createDisease({
        name,
        publicCategory: draft.publicCategory
      });
      await this.bootstrap();
      this.onSelect(disease.id);
      this.addModel.set({ name: '', publicCategory: draft.publicCategory });
      this.showAddForm.set(false);
    } catch {
      this.error.set('Could not add disease. It may already exist.');
    } finally {
      this.creating.set(false);
    }
  }
}
