import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { DEFAULT_AUTHED_ROUTE, ROUTE_PATHS } from './core/constants/app-routes.constants';

export const routes: Routes = [
  {
    path: ROUTE_PATHS.LOGIN,
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: DEFAULT_AUTHED_ROUTE },
      {
        path: ROUTE_PATHS.REPORTS,
        loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
