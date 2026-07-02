import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdminAuth } from '../services/admin-auth';
import { environment } from '../../../environments/environment';
import { ROUTE_PATHS } from '../constants/app-routes.constants';
import { API_PATHS } from '../constants/api-paths.constants';

export const adminAuthGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuth);
  const router = inject(Router);
  const http = inject(HttpClient);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree([`/${ROUTE_PATHS.LOGIN}`]);
  }

  try {
    await firstValueFrom(http.get(`${environment.apiUrl}${API_PATHS.AUTH.ME}`));
    return true;
  } catch {
    auth.logout();
    return router.createUrlTree([`/${ROUTE_PATHS.LOGIN}`]);
  }
};
