import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RoleTaskGuideComponent } from '../../shared/role-task-guide/role-task-guide.component';
import { NotificationBellHost } from '../../shared/notification-bell-host/notification-bell-host';
import { NAV_ITEMS, ROUTE_PATHS } from '../../core/constants/app-routes.constants';
import { StoreAuthService } from '../../services/store-auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RoleTaskGuideComponent, NotificationBellHost],
  templateUrl: './shell.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  auth = inject(StoreAuthService);
  private router = inject(Router);

  readonly routePaths = ROUTE_PATHS;
  private readonly managerOnlyPaths = new Set([
    `/${ROUTE_PATHS.MEDICINES}`,
    `/${ROUTE_PATHS.STAFF_ACTIVITY}`,
    `/${ROUTE_PATHS.STAFF_HR}`,
    `/${ROUTE_PATHS.STORE_EXPENSES}`
  ]);

  showMore = signal(false);

  sidebarNavItems(): typeof NAV_ITEMS[number][] {
    return NAV_ITEMS.filter(item =>
      !this.managerOnlyPaths.has(item.path) || this.auth.isManager()
    );
  }

  firstLetter(): string {
    return this.auth.staff()?.name?.charAt(0)?.toUpperCase() ?? 'S';
  }

  toggleMore(): void {
    this.showMore.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/', ROUTE_PATHS.LOGIN]);
  }
}
