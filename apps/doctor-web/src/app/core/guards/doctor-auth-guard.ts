import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ROUTE_PATHS } from '../constants/app-routes.constants';
import { AUTH_PATHS } from '../constants/auth.constants';
import { Auth } from '../services/auth';
import { environment } from '../../../environments/environment';

export const doctorAuthGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const http = inject(HttpClient);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/', ROUTE_PATHS.LOGIN]);
  }

  try {
    await firstValueFrom(http.get(`${environment.apiUrl}${AUTH_PATHS.ME}`));
    return true;
  } catch {
    auth.logout();
    return router.createUrlTree(['/', ROUTE_PATHS.LOGIN]);
  }
};
