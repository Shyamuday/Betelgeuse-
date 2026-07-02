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
      { path: '', redirectTo: DEFAULT_AUTHED_ROUTE, pathMatch: 'full' },
      {
        path: ROUTE_PATHS.DASHBOARD,
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: ROUTE_PATHS.EMPLOYEES,
        loadComponent: () => import('./pages/employees/employees.component').then(m => m.EmployeesComponent)
      },
      {
        path: ROUTE_PATHS.DOCTORS,
        loadComponent: () => import('./pages/doctors/doctors.component').then(m => m.DoctorsComponent)
      },
      {
        path: ROUTE_PATHS.STORE_STAFF,
        loadComponent: () => import('./pages/store-staff/store-staff.component').then(m => m.StoreStaffComponent)
      },
      {
        path: ROUTE_PATHS.LEAVES,
        loadComponent: () => import('./pages/leaves/leaves.component').then(m => m.LeavesComponent)
      },
      {
        path: ROUTE_PATHS.STORES,
        loadComponent: () => import('./pages/stores/stores.component').then(m => m.StoresComponent)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./pages/payroll/payroll.component').then(m => m.PayrollComponent)
      }
    ]
  },
  { path: '**', redirectTo: DEFAULT_AUTHED_ROUTE }
];
