import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { WhatsappLinkService } from './core/services/whatsapp-link.service';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, AppHeaderComponent, AppFooterComponent],
  template: `
    <section class="public-shell">
      <app-header subtitle="Page not found" [whatsappLink]="whatsappLink()" />
      <main class="content-page">
        <section class="page-hero panel">
          <p class="eyebrow">404</p>
          <h1>We couldn't find that page</h1>
          <p>The link may be broken or the page may have moved.</p>
          <div class="actions">
            <a class="primary home-action" routerLink="/">Go to home</a>
            <a class="secondary home-action" routerLink="/treatments">Browse treatments</a>
            <a class="secondary home-action" routerLink="/patient/dashboard">Care dashboard</a>
          </div>
        </section>
      </main>
      <app-footer [whatsappLink]="whatsappLink()" />
    </section>
  `,
})
export class NotFoundPageComponent {
  private readonly whatsappSvc = inject(WhatsappLinkService);
  readonly whatsappLink = this.whatsappSvc.url;
}
