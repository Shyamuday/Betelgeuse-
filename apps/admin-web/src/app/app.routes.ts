import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth-guard';
import { AdminLogin } from './features/auth/admin-login/admin-login';
import { AdminDashboard } from './features/dashboard/admin-dashboard/admin-dashboard';
import { ConsumersPage } from './features/consumers/consumers-page/consumers-page';
import { DoctorsPage } from './features/doctors/doctors-page/doctors-page';
import { DiseasesPage } from './features/diseases/diseases-page/diseases-page';
import { AdminShell } from './layout/admin-shell/admin-shell';
import { DoctorHrComponent } from './features/hr/doctor-hr/doctor-hr';
import { HrUsersComponent } from './features/hr/hr-users/hr-users';
import { EmployeesPage } from './features/employees/employees-page/employees-page';
import { LeavesPage } from './features/leaves/leaves-page/leaves-page';
import { StoresPage } from './features/stores/stores-page/stores-page';

export const routes: Routes = [
  { path: 'login', component: AdminLogin },
  {
    path: '',
    component: AdminShell,
    canActivate: [adminAuthGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: AdminDashboard },
      { path: 'doctors', component: DoctorsPage },
      { path: 'consumers', component: ConsumersPage },
      { path: 'diseases', component: DiseasesPage },
      { path: 'hr', component: DoctorHrComponent },
      { path: 'hr-users', component: HrUsersComponent },
      { path: 'employees', component: EmployeesPage },
      { path: 'leaves', component: LeavesPage },
      { path: 'stores', component: StoresPage }
    ]
  },
  { path: '**', redirectTo: '' }
];
