import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-feedback-section',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './feedback-section.component.html',
  styleUrl: './feedback-section.component.scss',
})
export class FeedbackSectionComponent {
  readonly feedbackTypes = [
    {
      title: 'Rate your session',
      description: 'Share how helpful the support felt, what worked, and what can be improved.',
      metric: '1-5',
      label: 'rating',
    },
    {
      title: 'Share anonymously',
      description:
        'Use a display name or ask us to keep your identity private before anything is shown.',
      metric: 'ID',
      label: 'privacy',
    },
    {
      title: 'Public only with consent',
      description:
        'Stories should appear on the site only after your permission and internal review.',
      metric: 'OK',
      label: 'consent',
    },
  ];
}
