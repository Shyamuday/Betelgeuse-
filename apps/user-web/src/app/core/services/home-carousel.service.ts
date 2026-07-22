import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ClinicApiClient } from '../../clinic-api/clinic-api.client';
import { API_PATHS } from '../constants/api-paths.constants';

export type HomeCarouselSlide = {
  id: string;
  title: string;
  subtitle?: string | null;
  eyebrow?: string | null;
  imageAlt?: string | null;
  imageUrl?: string | null;
  actionLabel?: string | null;
  actionType: 'BOOK' | 'INTERNAL_LINK' | 'EXTERNAL_LINK';
  actionUrl?: string | null;
};

@Injectable({ providedIn: 'root' })
export class HomeCarouselService {
  private readonly client = inject(ClinicApiClient);
  private slides: HomeCarouselSlide[] | null = null;

  async list() {
    if (this.slides) return this.slides;
    try {
      const res = await this.client.get<{ slides: HomeCarouselSlide[] }>(API_PATHS.HOME_CAROUSEL);
      this.slides = (res.slides || []).map((slide) => ({
        ...slide,
        imageUrl:
          slide.imageUrl && !slide.imageUrl.startsWith('http')
            ? `${environment.apiUrl}${slide.imageUrl}`
            : slide.imageUrl,
      }));
      return this.slides;
    } catch {
      this.slides = [];
      return this.slides;
    }
  }
}
