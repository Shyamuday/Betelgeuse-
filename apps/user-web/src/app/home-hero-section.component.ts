import { CommonModule } from '@angular/common';
import { Component, Input, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HOME_CONTENT } from './core/constants/public-site-content.constants';
import { AuthService } from './auth/auth.service';
import { AuthFormOverlayComponent } from './auth/auth-form-overlay.component';
import { PublicConfigService } from './core/services/public-config.service';
import { AppOverlayService } from './overlay.service';

@Component({
  selector: 'app-home-hero-section',
  imports: [CommonModule],
  styleUrl: './home-hero-section.component.scss',
  templateUrl: './home-hero-section.component.html',
})
export class HomeHeroSectionComponent {
  @Input() whatsappLink = '';

  readonly copy = HOME_CONTENT;
  readonly heroEyebrow = signal<string>(HOME_CONTENT.hero.eyebrow);
  readonly heroHeadline = signal<string>(HOME_CONTENT.hero.headline);
  readonly heroLead = signal<string>(HOME_CONTENT.hero.lead);

  readonly busy = signal(false);
  readonly error = signal('');

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly publicConfig = inject(PublicConfigService);
  private readonly overlayService = inject(AppOverlayService);

  constructor() {
    void this.bootstrap();
  }

  private async bootstrap() {
    void this.loadHeroCopy();
  }

  private async loadHeroCopy() {
    try {
      const config = await this.publicConfig.get();
      this.heroEyebrow.set(config.homeHeroEyebrow || HOME_CONTENT.hero.eyebrow);
      this.heroHeadline.set(config.homeHeroHeadline || HOME_CONTENT.hero.headline);
      this.heroLead.set(config.homeHeroLead || HOME_CONTENT.hero.lead);
    } catch {
      // Keep static fallbacks.
    }
  }

  async beginBooking() {
    this.error.set('');
    if (this.auth.isLoggedIn()) {
      await this.router.navigateByUrl(this.auth.dashboardFor(this.auth.user()!.role));
      return;
    }

    this.overlayService.open(AuthFormOverlayComponent, {
      width: '480px',
      panelClass: 'app-overlay-panel',
    });
  }
}
