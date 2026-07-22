import { Component, inject } from '@angular/core';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { WhatsappLinkService } from './core/services/whatsapp-link.service';

@Component({
  selector: 'app-why-successful',
  imports: [AppHeaderComponent, AppFooterComponent],
  templateUrl: './why-successful.component.html',
})
export class WhySuccessfulComponent {
  private readonly whatsappSvc = inject(WhatsappLinkService);
  readonly whatsappLink = this.whatsappSvc.url;

  readonly careModel = [
    {
      title: 'Structured intake',
      body: 'Patients share symptoms, history, goals, photos, reports, and preferences before the consultation starts.',
    },
    {
      title: 'Right expert matching',
      body: 'The care team routes each case to a suitable online expert based on concern, risk, specialty, and availability.',
    },
    {
      title: 'Clear consultation flow',
      body: 'The expert reviews the case, asks focused follow-up questions, and explains the next step in simple language.',
    },
    {
      title: 'Care plan and follow-up',
      body: 'Advice, prescriptions where appropriate, lifestyle guidance, referrals, and review plans stay connected to the same record.',
    },
  ];

  readonly qualitySignals = [
    'Online-first care designed for repeat consultations and continuity.',
    'Expert profiles, focus areas, and service types help match patients with the right professional.',
    'Digital records reduce missed context between intake, consultation, prescription, and follow-up.',
    'Red-flag checks help identify when urgent or in-person care is safer.',
  ];

  readonly serviceCoverage = [
    'General medical consultation',
    'Mental wellness and counselling',
    'Nutrition and diet planning',
    'Physiotherapy and rehabilitation',
    'Wellness coaching and preventive care',
    'Diagnostics, reports, and care coordination',
  ];
}
