import { Component } from '@angular/core';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { WHATSAPP_CONTACT_URL } from './core/constants/branding.constants';

@Component({
  selector: 'app-faq',
  imports: [AppHeaderComponent, AppFooterComponent],
  templateUrl: './faq.component.html'
})
export class FaqComponent {
  readonly whatsappLink = WHATSAPP_CONTACT_URL;
}
