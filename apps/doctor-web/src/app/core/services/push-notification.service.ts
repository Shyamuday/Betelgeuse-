import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { AUTH_TOKEN_KEY } from '../constants/auth.constants';
import { environment } from '../../../environments/environment';
import { ConsultationNavigationService } from './consultation-navigation.service';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly router = inject(Router);
  private readonly consultationNav = inject(ConsultationNavigationService);

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt') {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== 'granted') return;

    await PushNotifications.register();

    await PushNotifications.addListener('registration', (token) => {
      this.sendTokenToServer(token.value);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      this.handleNotificationTap(action.notification.data as Record<string, string>);
    });
  }

  private sendTokenToServer(token: string): void {
    const authToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!authToken) return;

    fetch(`${environment.apiUrl}/doctor/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token, platform: Capacitor.getPlatform() }),
    }).catch(() => undefined);
  }

  private handleNotificationTap(data: Record<string, string>): void {
    const target = this.consultationNav.resolveNotificationRoute(data);
    if (!target) return;
    void this.router.navigate(target.commands, { queryParams: target.queryParams });
  }
}
