import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RoleTaskGuideComponent } from '../../shared/role-task-guide/role-task-guide.component';
import { AdminAuth } from '../../core/services/admin-auth';
import { NAV_ITEMS, ROUTE_PATHS } from '../../core/constants/app-routes.constants';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, RoleTaskGuideComponent],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss'
})
export class AdminShell {
  readonly navItems = NAV_ITEMS;
  constructor(
    private readonly auth: AdminAuth,
    private readonly router: Router
  ) {}

  logout() {
    this.auth.logout();
    void this.router.navigateByUrl(`/${ROUTE_PATHS.LOGIN}`);
  }
}
