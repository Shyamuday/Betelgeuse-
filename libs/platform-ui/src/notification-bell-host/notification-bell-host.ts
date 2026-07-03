import { Component, Input } from '@angular/core';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import type { NotificationBellConfig } from '../notification-bell/types';

@Component({
  selector: 'app-notification-bell-host',
  standalone: true,
  imports: [NotificationBellComponent],
  template: `<app-shared-notification-bell [config]="config" />`
})
export class NotificationBellHostComponent {
  @Input({ required: true }) config!: NotificationBellConfig;
}
