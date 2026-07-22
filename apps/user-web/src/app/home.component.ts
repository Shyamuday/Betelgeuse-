import { Component, computed, inject } from '@angular/core';
import { WhatsappLinkService } from './core/services/whatsapp-link.service';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { HomeFinalCtaSectionComponent } from './home-final-cta-section.component';
import { HomeHeroSectionComponent } from './home-hero-section.component';
import { HomeCarouselSectionComponent } from './home-carousel-section.component';
import { HomeAnnouncementTickerComponent } from './home-announcement-ticker.component';
import { HomeTalkToDoctorSectionComponent } from './home-talk-to-doctor-section.component';
import { HomeHowItWorksSectionComponent } from './home-how-it-works-section.component';
import { HomeSafetyFaqSectionComponent } from './home-safety-faq-section.component';
import { HomeTreatmentsSectionComponent } from './home-treatments-section.component';

@Component({
  selector: 'app-home',
  imports: [
    AppHeaderComponent,
    AppFooterComponent,
    HomeAnnouncementTickerComponent,
    HomeCarouselSectionComponent,
    HomeHeroSectionComponent,
    HomeTalkToDoctorSectionComponent,
    HomeTreatmentsSectionComponent,
    HomeHowItWorksSectionComponent,
    HomeSafetyFaqSectionComponent,
    HomeFinalCtaSectionComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly whatsappSvc = inject(WhatsappLinkService);
  readonly whatsappLink = this.whatsappSvc.url;
}
