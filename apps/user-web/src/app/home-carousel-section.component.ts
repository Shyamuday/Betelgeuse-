import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFormOverlayComponent } from './auth/auth-form-overlay.component';
import { HomeCarouselService, type HomeCarouselSlide } from './core/services/home-carousel.service';
import { AppOverlayService } from './overlay.service';

@Component({
  selector: 'app-home-carousel-section',
  imports: [CommonModule],
  templateUrl: './home-carousel-section.component.html',
  styleUrl: './home-carousel-section.component.scss',
})
export class HomeCarouselSectionComponent {
  private readonly carousel = inject(HomeCarouselService);
  private readonly overlay = inject(AppOverlayService);
  private readonly router = inject(Router);

  readonly slides = signal<HomeCarouselSlide[]>([]);
  readonly activeIndex = signal(0);
  readonly activeSlide = computed(() => this.slides()[this.activeIndex()] || null);

  constructor() {
    void this.load();
  }

  async load() {
    const slides = await this.carousel.list();
    this.slides.set(slides.filter((slide) => !!slide.imageUrl));
  }

  go(delta: number) {
    const slides = this.slides();
    if (!slides.length) return;
    this.activeIndex.set((this.activeIndex() + delta + slides.length) % slides.length);
  }

  select(index: number) {
    this.activeIndex.set(index);
  }

  activate(slide: HomeCarouselSlide) {
    if (slide.actionType === 'BOOK') {
      this.overlay.open(AuthFormOverlayComponent, {
        width: '480px',
        panelClass: 'app-overlay-panel',
      });
      return;
    }
    const url = slide.actionUrl?.trim();
    if (!url) return;
    if (slide.actionType === 'EXTERNAL_LINK') {
      window.open(url, '_blank', 'noopener');
      return;
    }
    void this.router.navigateByUrl(url.startsWith('/') ? url : `/${url}`);
  }
}
