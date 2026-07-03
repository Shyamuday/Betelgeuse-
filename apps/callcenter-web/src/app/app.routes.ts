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
        path: ROUTE_PATHS.PATIENTS,
        loadComponent: () => import('./pages/patient-search/patient-search.component').then(m => m.PatientSearchComponent)
      },
      {
        path: ROUTE_PATHS.CONSULTATIONS,
        loadComponent: () => import('./pages/consultations/consultations.component').then(m => m.ConsultationsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
