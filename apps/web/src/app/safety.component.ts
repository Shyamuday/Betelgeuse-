import { Component } from '@angular/core';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { WHATSAPP_CONTACT_URL } from './core/constants/branding.constants';

@Component({
  selector: 'app-safety',
  imports: [AppHeaderComponent, AppFooterComponent],
  templateUrl: './safety.component.html'
})
export class SafetyComponent {
  readonly whatsappLink = WHATSAPP_CONTACT_URL;
}
