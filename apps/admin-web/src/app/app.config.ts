import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import {
  provideRouter,
  withExperimentalAutoCleanupInjectors,
  withExperimentalPlatformNavigation
} from '@angular/router';

import { routes } from './app.routes';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { authErrorInterceptor } from './core/interceptors/auth-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(withXhr(), withInterceptors([authTokenInterceptor, authErrorInterceptor])),
    provideRouter(
      routes,
      withExperimentalPlatformNavigation(),
      withExperimentalAutoCleanupInjectors()
    )
  ]
};
