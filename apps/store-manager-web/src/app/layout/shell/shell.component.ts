import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NAV_ITEMS, ROUTE_PATHS } from '../../core/constants/app-routes.constants';
import { StoreAuthService } from '../../services/store-auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  auth = inject(StoreAuthService);
  private router = inject(Router);

  readonly routePaths = ROUTE_PATHS;
  readonly navItems = NAV_ITEMS;
  showMore = signal(false);

  firstLetter(): string {
    return this.auth.staff()?.name?.charAt(0)?.toUpperCase() ?? 'M';
  }

  toggleMore(): void {
    this.showMore.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/', ROUTE_PATHS.LOGIN]);
  }
}
