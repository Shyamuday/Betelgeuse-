import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { buildDetailRows, DetailRowsComponent } from '@vitalis/platform-ui';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { WHATSAPP_CONTACT_URL } from './core/constants/branding.constants';
import { homeopathyApproaches } from './treatment-approach/homeopathy-approaches.constants';
import { HOMEOPATHY_APPROACH_SUMMARY_FIELDS } from './treatment-approach/constants/approach-summary.fields';
import type { HomeopathyApproach } from './models';

@Component({
  selector: 'app-why-successful',
  imports: [CommonModule, AppHeaderComponent, AppFooterComponent, DetailRowsComponent],
  templateUrl: './why-successful.component.html',
})
export class WhySuccessfulComponent {
  readonly whatsappLink = WHATSAPP_CONTACT_URL;
  readonly approaches = homeopathyApproaches;

  approachSummaryRows(method: HomeopathyApproach) {
    return buildDetailRows(method, HOMEOPATHY_APPROACH_SUMMARY_FIELDS);
  }
}
