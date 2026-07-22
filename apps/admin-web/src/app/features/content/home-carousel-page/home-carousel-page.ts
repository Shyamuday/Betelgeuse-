import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { environment } from '../../../../environments/environment';
import { AdminApi } from '../../../core/services/admin-api';

type Slide = {
  id: string;
  title: string;
  subtitle?: string | null;
  eyebrow?: string | null;
  imageAlt?: string | null;
  imageUrl?: string | null;
  externalImageUrl?: string | null;
  actionLabel?: string | null;
  actionType: 'BOOK' | 'INTERNAL_LINK' | 'EXTERNAL_LINK';
  actionUrl?: string | null;
  isPublished: boolean;
  sortOrder: number;
};

type Draft = {
  title: string;
  subtitle: string;
  eyebrow: string;
  imageAlt: string;
  externalImageUrl: string;
  actionLabel: string;
  actionType: 'BOOK' | 'INTERNAL_LINK' | 'EXTERNAL_LINK';
  actionUrl: string;
  isPublished: boolean;
  sortOrder: number;
  imageUpload?: { mimeType: string; fileName: string; dataBase64: string };
};

const EMPTY_DRAFT: Draft = {
  title: '',
  subtitle: '',
  eyebrow: '',
  imageAlt: '',
  externalImageUrl: '',
  actionLabel: 'Book now',
  actionType: 'BOOK',
  actionUrl: '',
  isPublished: true,
  sortOrder: 0,
};

@Component({
  selector: 'app-home-carousel-page',
  imports: [CommonModule, FormField],
  templateUrl: './home-carousel-page.html',
  styleUrl: './home-carousel-page.scss',
})
export class HomeCarouselPage {
  readonly slides = signal<Slide[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly error = signal('');
  readonly message = signal('');

  readonly createModel = signal<Draft>({ ...EMPTY_DRAFT });
  readonly createForm = form(this.createModel);
  readonly editModel = signal<Draft>({ ...EMPTY_DRAFT });
  readonly editForm = form(this.editModel);

  constructor(private readonly api: AdminApi) {
    void this.load();
  }

  async load() {
    this.loading.set(true);
    this.error.set('');
    try {
      const res = await this.api.listHomeCarouselSlides();
      this.slides.set(res.slides);
    } catch {
      this.error.set('Could not load home carousel slides.');
    } finally {
      this.loading.set(false);
    }
  }

  imageSrc(slide: Slide) {
    if (!slide.imageUrl) return '';
    if (slide.imageUrl.startsWith('http')) return slide.imageUrl;
    return `${environment.apiUrl}${slide.imageUrl}`;
  }

  startEdit(slide: Slide) {
    this.editingId.set(slide.id);
    this.editModel.set({
      title: slide.title,
      subtitle: slide.subtitle || '',
      eyebrow: slide.eyebrow || '',
      imageAlt: slide.imageAlt || '',
      externalImageUrl: slide.externalImageUrl || '',
      actionLabel: slide.actionLabel || '',
      actionType: slide.actionType,
      actionUrl: slide.actionUrl || '',
      isPublished: slide.isPublished,
      sortOrder: slide.sortOrder,
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editModel.set({ ...EMPTY_DRAFT });
  }

  async onFilePicked(event: Event, target: 'create' | 'edit') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.error.set('Use JPEG, PNG, or WebP images only.');
      input.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.error.set('Image must be 3 MB or smaller.');
      input.value = '';
      return;
    }
    const dataBase64 = await this.fileToBase64(file);
    const upload = { mimeType: file.type, fileName: file.name, dataBase64 };
    if (target === 'create')
      this.createModel.update((draft) => ({ ...draft, imageUpload: upload }));
    else this.editModel.update((draft) => ({ ...draft, imageUpload: upload }));
  }

  async create() {
    await this.saveDraft(this.createModel(), null);
    this.createModel.set({ ...EMPTY_DRAFT });
  }

  async update(id: string) {
    await this.saveDraft(this.editModel(), id);
    this.cancelEdit();
  }

  async delete(slide: Slide) {
    if (!confirm(`Delete slide "${slide.title}"?`)) return;
    this.saving.set(true);
    try {
      await this.api.deleteHomeCarouselSlide(slide.id);
      this.message.set('Slide deleted.');
      await this.load();
    } catch {
      this.error.set('Could not delete slide.');
    } finally {
      this.saving.set(false);
    }
  }

  private async saveDraft(draft: Draft, id: string | null) {
    this.saving.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const payload = {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim() || null,
        eyebrow: draft.eyebrow.trim() || null,
        imageAlt: draft.imageAlt.trim() || null,
        externalImageUrl: draft.imageUpload ? null : draft.externalImageUrl.trim() || null,
        actionLabel: draft.actionLabel.trim() || null,
        actionType: draft.actionType,
        actionUrl: draft.actionUrl.trim() || null,
        isPublished: draft.isPublished,
        sortOrder: Number(draft.sortOrder) || 0,
        ...(draft.imageUpload ? { imageUpload: draft.imageUpload } : {}),
      };
      if (id) {
        await this.api.updateHomeCarouselSlide(id, payload);
        this.message.set('Slide saved.');
      } else {
        await this.api.createHomeCarouselSlide(payload);
        this.message.set('Slide created.');
      }
      await this.load();
    } catch (error: any) {
      this.error.set(error?.error?.message || 'Could not save slide.');
    } finally {
      this.saving.set(false);
    }
  }

  private fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
