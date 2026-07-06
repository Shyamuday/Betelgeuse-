import { Component, signal } from '@angular/core';
import { PublicConfigService } from './core/services/public-config.service';

@Component({
  selector: 'app-home-treatments-section',
  templateUrl: './home-treatments-section.component.html',
})
export class HomeTreatmentsSectionComponent {
  readonly stats = signal([
    { value: '5,000+', label: 'Consultations completed' },
    { value: '12+', label: 'Experienced doctors' },
    { value: '4.8★', label: 'Patient rating' },
    { value: '92%', label: 'Follow-up compliance' }
  ]);

  constructor(private readonly configSvc: PublicConfigService) {
    void this.loadStats();
  }

  private async loadStats() {
    try {
      const cfg = await this.configSvc.get();
      this.stats.set([
        { value: cfg.statConsultations, label: 'Consultations completed' },
        { value: cfg.statDoctors, label: 'Experienced doctors' },
        { value: cfg.statRating, label: 'Patient rating' },
        { value: cfg.statFollowUp, label: 'Follow-up compliance' }
      ]);
    } catch { /* keep fallback */ }
  }
}
