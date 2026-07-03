import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import {
  provideRouter,
  withExperimentalAutoCleanupInjectors,
  withExperimentalPlatformNavigation
} from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withExperimentalPlatformNavigation(),
      withExperimentalAutoCleanupInjectors()
    ),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor]))
  ]
};
