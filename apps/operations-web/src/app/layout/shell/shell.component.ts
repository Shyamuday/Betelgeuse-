import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { RoleTaskGuideComponent } from '../../shared/role-task-guide/role-task-guide.component';
import { NotificationBellHost } from '../../shared/notification-bell-host/notification-bell-host';
import { PlatformAuthService } from '../../services/platform-auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RoleTaskGuideComponent, NotificationBellHost],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit {
  auth = inject(PlatformAuthService);
  sidebarOpen = signal(false);

  ngOnInit(): void {
    if (this.auth.isLoggedIn() && !this.auth.capabilities().length) {
      this.auth.fetchMe().subscribe();
    }
  }

  navItems() {
    return this.auth.navItems();
  }

  userInitial() {
    const name = this.auth.currentUser()?.name ?? 'U';
    return name.charAt(0).toUpperCase();
  }

  pageTitle() {
    return 'Operations';
  }

  roleLabel() {
    return (this.auth.currentUser()?.role ?? 'Staff').replace(/_/g, ' ');
  }

  guideVariant(): string | null {
    const caps = this.auth.capabilities();
    if (caps.includes('store_manager.portal')) return 'store-manager';
    if (caps.includes('store_counter.portal')) return 'store-counter';
    if (
      caps.some((c) =>
        ['supplier.portal', 'delivery.ops', 'diagnostic.portal', 'corporate_wellness.portal', 'insurance.portal'].includes(c)
      )
    ) {
      return 'partner';
    }
    return null;
  }
}
