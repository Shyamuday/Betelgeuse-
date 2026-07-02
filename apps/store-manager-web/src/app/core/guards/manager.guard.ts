import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROUTE_PATHS } from '../constants/app-routes.constants';
import { STORE_STAFF_ROLES } from '../constants/auth.constants';
import { StoreAuthService } from '../../services/store-auth.service';

export const managerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(StoreAuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/', ROUTE_PATHS.LOGIN], { queryParams: { returnUrl: state.url } });
  }

  if (auth.staff()?.role !== STORE_STAFF_ROLES.MANAGER) {
    auth.logout();
    return router.createUrlTree(['/', ROUTE_PATHS.LOGIN], {
      queryParams: { error: 'manager-only' }
    });
  }

  return true;
};
