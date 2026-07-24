import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FeedbackSectionComponent,
  ServicesCarouselComponent,
  StatsSectionComponent,
} from '../../shared/components';
import { APP_CONSTANTS } from '../../core';
import { environment } from '../../../environments/environment';
import { BookingService, HopeHubProvider } from '../../core/services/booking.service';
import { HomeCommunityComponent } from './components/home-community/home-community.component';
import { HomeHeroComponent } from './components/home-hero/home-hero.component';
import { HomeToolsComponent } from './components/home-tools/home-tools.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { ServicesOverviewComponent } from './components/services-overview/services-overview.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    FeedbackSectionComponent,
    HomeCommunityComponent,
    HomeHeroComponent,
    HomeToolsComponent,
    HowItWorksComponent,
    RouterLink,
    ServicesCarouselComponent,
    ServicesOverviewComponent,
    StatsSectionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  readonly APP_CONSTANTS = APP_CONSTANTS;
  private readonly bookingService = inject(BookingService);

  readonly psychologists = signal<HopeHubProvider[]>([]);
  readonly psychologistsLoading = signal(false);

  ngOnInit(): void {
    this.loadPsychologists();
  }

  providerImageUrl(provider: HopeHubProvider): string | null {
    if (!provider.profileImageUrl) {
      return null;
    }
    if (provider.profileImageUrl.startsWith('http')) {
      return provider.profileImageUrl;
    }
    return `${environment.apiUrl}${provider.profileImageUrl}`;
  }

  private loadPsychologists(): void {
    this.psychologistsLoading.set(true);
    this.bookingService.providers({ page: 1, pageSize: 5 }).subscribe({
      next: (res) => {
        this.psychologists.set(res.providers);
        this.psychologistsLoading.set(false);
      },
      error: () => this.psychologistsLoading.set(false),
    });
  }
}
