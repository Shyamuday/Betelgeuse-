import { Component, Input } from '@angular/core';
import { AuthFormOverlayComponent } from './auth/auth-form-overlay.component';
import { AppOverlayService } from './overlay.service';

@Component({
  selector: 'app-home-final-cta-section',
  template: `
    <section class="about-cta panel">
      <div>
        <p class="eyebrow">Start chronic care</p>
        <h2>Begin your chronic care plan with Vitalis Care.</h2>
        <p>Book a consultation now, or chat on WhatsApp first to see if your case fits our chronic-care path.</p>
      </div>
      <div class="home-actions">
        <a class="primary home-action" href="/login" (click)="openAuthOverlay($event)">Book chronic care consult</a>
        <a class="whatsapp-action" [href]="whatsappLink" target="_blank" rel="noopener">Chat on WhatsApp</a>
      </div>
    </section>
  `
})
export class HomeFinalCtaSectionComponent {
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
