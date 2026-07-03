import { Component } from '@angular/core';
import { AppFooterComponent } from './app-footer.component';
import { AppHeaderComponent } from './app-header.component';
import { WHATSAPP_CONTACT_URL } from './core/constants/branding.constants';

@Component({
  selector: 'app-contact',
  imports: [AppHeaderComponent, AppFooterComponent]
,
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  readonly whatsappLink = WHATSAPP_CONTACT_URL;
}
