import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  AnnouncementBannerComponent,
  ServiceCardComponent,
  ServicesCarouselComponent,
  StatsSectionComponent,
  FeedbackSectionComponent,
} from '../../shared/components';
// import { MultiAssessmentComponent } from '../../shared/components/multi-assessment/multi-assessment.component';
// import { ProgressDashboardComponent } from '../../shared/components/progress-dashboard/progress-dashboard.component';
import { Service, Meetup } from '../../core/models';
import { APP_CONSTANTS } from '../../core';
import { getAllServices } from '../../core/data/services-data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,
    AnnouncementBannerComponent,
    ServiceCardComponent,
    ServicesCarouselComponent,
    StatsSectionComponent,
    FeedbackSectionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  APP_CONSTANTS = APP_CONSTANTS;

  announcementMessage =
    'Join our daily 9 PM Telegram voice circle with Hope Hub experts - anonymous-friendly support, guidance, and calm conversation.';

  howItWorksSteps = [
    {
      title: 'Submit request',
      description: 'Tell us the concern, preferred contact method, and a time that works for you.',
    },
    {
      title: 'We review',
      description: 'The Hope Hub team checks your request and routes it to the right support path.',
    },
    {
      title: 'Provider matched',
      description: 'A suitable provider or care team member is assigned based on your concern.',
    },
    {
      title: 'Pay ₹300',
      description: 'Complete payment for a 30-minute introductory support session.',
    },
    {
      title: 'Get support',
      description: 'Join the confirmed session or receive next steps through your chosen channel.',
    },
  ];

  services: Service[] = getAllServices();

  nextMeetup: Meetup = {
    id: '1',
    title: 'Monthly Healing Circle',
    description: 'A supportive group session focused on sharing experiences and healing together.',
    date: this.getNextFirstSunday(),
    time: '2:00 PM - 4:00 PM',
    location: 'Virtual Meeting',
    isVirtual: true,
    maxAttendees: 20,
  };

  ngOnInit() {
    // Component initialization
  }

  onAnnouncementDismiss() {
    // Handle announcement dismissal
    console.log('Announcement dismissed');
  }

  formatMeetupDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private getNextFirstSunday(): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Start with the first day of current month
    let firstSunday = new Date(currentYear, currentMonth, 1);

    // Find the first Sunday of the month
    while (firstSunday.getDay() !== 0) {
      firstSunday.setDate(firstSunday.getDate() + 1);
    }

    // If the first Sunday has passed, get the first Sunday of next month
    if (firstSunday < now) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      firstSunday = new Date(nextYear, nextMonth, 1);

      while (firstSunday.getDay() !== 0) {
        firstSunday.setDate(firstSunday.getDate() + 1);
      }
    }

    return firstSunday;
  }
}
