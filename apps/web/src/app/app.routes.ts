import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { LoginComponent } from './login.component';
import { roleGuard } from './role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'patient/dashboard',
    component: DashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['PATIENT'] }
  },
  {
    path: 'doctor/dashboard',
    component: DashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['DOCTOR'] }
  },
  {
    path: 'admin/dashboard',
    component: DashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] }
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
