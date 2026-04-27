import { Component } from '@angular/core';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { HomeFinalCtaSectionComponent } from './home-final-cta-section.component';
import { HomeHeroSectionComponent } from './home-hero-section.component';
import { HomeHowItWorksSectionComponent } from './home-how-it-works-section.component';
import { HomeSafetyFaqSectionComponent } from './home-safety-faq-section.component';
import { HomeTreatmentsSectionComponent } from './home-treatments-section.component';

@Component({
  selector: 'app-home',
  imports: [
    AppHeaderComponent,
    AppFooterComponent,
    HomeHeroSectionComponent,
    HomeTreatmentsSectionComponent,
    HomeHowItWorksSectionComponent,
    HomeSafetyFaqSectionComponent,
    HomeFinalCtaSectionComponent
  ],
  template: `
    <section class="public-shell">
      <app-header subtitle="Digital clinic" [whatsappLink]="whatsappLink" />

      <main class="content-page">
        <app-home-hero-section [whatsappLink]="whatsappLink" />
        <app-home-treatments-section />
        <app-home-how-it-works-section />
        <app-home-safety-faq-section />
        <app-home-final-cta-section [whatsappLink]="whatsappLink" />
      </main>

      <app-footer [whatsappLink]="whatsappLink" />

      <a class="whatsapp-float" [href]="whatsappLink" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
        WhatsApp
      </a>
    </section>
  `
})
export class HomeComponent {
  readonly whatsappLink =
    'https://wa.me/919876543210?text=Hi%20Vitalis%20Clinic%2C%20I%20want%20to%20book%20a%20consultation';
}
