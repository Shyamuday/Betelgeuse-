import { Injectable, signal } from '@angular/core';
import { WHATSAPP_CONTACT_URL } from '../constants/branding.constants';
import { PublicConfigService } from './public-config.service';

@Injectable({ providedIn: 'root' })
export class WhatsappLinkService {
  readonly url = signal(WHATSAPP_CONTACT_URL);

  constructor(private readonly configSvc: PublicConfigService) {
    void this.configSvc.get().then((cfg) => this.url.set(this.configSvc.whatsappUrl(cfg)));
  }
}
