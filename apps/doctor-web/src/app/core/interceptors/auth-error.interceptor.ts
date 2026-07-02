import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ROUTE_PATHS } from '../constants/app-routes.constants';
import { Auth } from '../services/auth';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        auth.logout();
        void router.navigateByUrl(`/${ROUTE_PATHS.LOGIN}`);
      }
      return throwError(() => error);
    })
  );
};
