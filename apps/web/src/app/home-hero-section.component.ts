import { Component, Input } from '@angular/core';
import { AuthFormOverlayComponent } from './auth/auth-form-overlay.component';
import { AppOverlayService } from './overlay.service';

@Component({
  selector: 'app-home-hero-section',
  template: `
    <section class="panel">
      <div class="home-hero">
        <p class="eyebrow">Vitalis Care | Chronic care focus</p>
        <h1>Doctor-led chronic care for long-running health concerns.</h1>
        <p class="hero-copy">
          Our primary focus is chronic and recurring conditions that need deeper history, pattern tracking, and consistent follow-up.
        </p>

        <div class="home-actions">
          <a class="primary home-action" href="/login" (click)="openAuthOverlay($event)">Start chronic care consultation</a>
          <a class="whatsapp-action" [href]="whatsappLink" target="_blank" rel="noopener">
            Chat on WhatsApp
          </a>
        </div>

      </div>
    </section>
  `
})
export class HomeHeroSectionComponent {
  @Input() whatsappLink = '';

  constructor(private readonly overlayService: AppOverlayService) { }

  openAuthOverlay(event: Event, mode: 'patient' | 'staff' = 'patient') {
    event.preventDefault();
    this.overlayService.open(AuthFormOverlayComponent, {
      data: { mode },
      width: '480px',
      panelClass: 'app-overlay-panel'
    });
  }
}
