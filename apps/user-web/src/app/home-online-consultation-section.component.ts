import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-online-consultation-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-online-consultation-section.component.html',
  styleUrl: './home-online-consultation-section.component.scss',
})
export class HomeOnlineConsultationSectionComponent {
  readonly steps = [
    {
      label: '1',
      title: 'Choose your health concern',
      body: 'Pick a condition or start with a general consultation. The intake adapts to your symptoms.',
    },
    {
      label: '2',
      title: 'Share symptoms online',
      body: 'Add history, photos, reports, current medicines, and priorities before the expert reviews your case.',
    },
    {
      label: '3',
      title: 'Consult an expert',
      body: 'Continue by secure chat, voice, or video, then receive guidance, prescription where appropriate, and follow-up.',
    },
  ] as const;
}
