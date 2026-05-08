import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { loadGoogleIdentityScript } from '../google-sign-in';

@Component({
  selector: 'app-google-sign-in-button',
  standalone: true,
  template: `<div class="gsi-host" #host></div>`,
  styles: [
    `
      .gsi-host {
        display: flex;
        justify-content: flex-start;
        min-height: 44px;
      }
    `
  ]
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  @Input() clientId = '';
  @Output() credential = new EventEmitter<string>();

  @ViewChild('host', { read: ElementRef }) host!: ElementRef<HTMLDivElement>;

  private mounted = false;

  async ngAfterViewInit() {
    const id = this.clientId?.trim();
    await Promise.resolve();
    if (this.mounted || !id || !this.host?.nativeElement) return;

    try {
      await loadGoogleIdentityScript();
    } catch {
      return;
    }

    const el = this.host.nativeElement;
    el.replaceChildren();

    window.google!.accounts.id.initialize({
      client_id: id,
      callback: (resp) => {
        if (resp.credential) this.credential.emit(resp.credential);
      }
    });

    window.google!.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 320,
      shape: 'rectangular',
      locale: 'en'
    });

    this.mounted = true;
  }
}
