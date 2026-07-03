import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import {
  provideRouter,
  withExperimentalAutoCleanupInjectors,
  withExperimentalPlatformNavigation
} from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AdminAuth } from '../../../admin-web/src/app/core/services/admin-auth';
import { AdminAuthBridge } from './admin/admin-auth.bridge';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withExperimentalPlatformNavigation(),
      withExperimentalAutoCleanupInjectors()
    ),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideAnimations(),
    { provide: AdminAuth, useExisting: AdminAuthBridge }
  ]
};
