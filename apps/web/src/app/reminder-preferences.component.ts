import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type ReminderPrefs = {
  inApp: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

export type ReminderChannelsLive = {
  inApp: boolean;
  sms: boolean;
  whatsapp: boolean;
  push: boolean;
};

@Component({
  selector: 'app-reminder-preferences',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="panel">
      <h2>Reminder preferences</h2>
      <p class="muted footnote">
        Preferences are stored on your account. Only channels marked <strong>active</strong> may send notifications today —
        others are shown for when we roll them out.
      </p>
      <label>
        <input type="checkbox" [(ngModel)]="prefs.inApp" [disabled]="disabled || !channelsLive.inApp" /> In-app
        @if (!channelsLive.inApp) {
          <span class="muted">(not available)</span>
        }
      </label>
      <label>
        <input type="checkbox" [(ngModel)]="prefs.sms" [disabled]="disabled || !channelsLive.sms" /> SMS
        @if (!channelsLive.sms) {
          <span class="muted">(coming soon)</span>
        }
      </label>
      <label>
        <input type="checkbox" [(ngModel)]="prefs.whatsapp" [disabled]="disabled || !channelsLive.whatsapp" /> WhatsApp
        @if (!channelsLive.whatsapp) {
          <span class="muted">(coming soon)</span>
        }
      </label>
      <label>
        <input type="checkbox" [(ngModel)]="prefs.push" [disabled]="disabled || !channelsLive.push" /> Push (browser)
        @if (!channelsLive.push) {
          <span class="muted">(coming soon)</span>
        }
      </label>
      <label>
        Quiet hours start
        <input [(ngModel)]="prefs.quietHoursStart" placeholder="22:00" />
      </label>
      <label>
        Quiet hours end
        <input [(ngModel)]="prefs.quietHoursEnd" placeholder="07:00" />
      </label>
      <button type="button" class="primary" [disabled]="disabled" (click)="saved.emit(prefs)">Save preferences</button>
    </div>
  `,
  styles: [
    `
      .footnote {
        font-size: 0.88rem;
        margin-bottom: 0.75rem;
      }
    `
  ]
})
export class ReminderPreferencesComponent {
  @Input() prefs: ReminderPrefs = {
    inApp: true,
    sms: false,
    whatsapp: false,
    push: false,
    quietHoursStart: '',
    quietHoursEnd: ''
  };
  @Input() disabled = false;
  @Input() channelsLive: ReminderChannelsLive = {
    inApp: true,
    sms: false,
    whatsapp: false,
    push: false
  };

  @Output() saved = new EventEmitter<ReminderPrefs>();
}
