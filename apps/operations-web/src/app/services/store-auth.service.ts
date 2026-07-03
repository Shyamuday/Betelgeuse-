import { computed, inject, Service } from '@angular/core';
import { StorePortalStaff } from '../models/store';
import { STORE_STAFF_ROLES } from '../core/constants/store/auth.constants';
import { PlatformAuthService } from './platform-auth.service';

/** Bridges store pages to the unified platform session (store staff use the same token). */
@Service()
export class StoreAuthService {
  private platform = inject(PlatformAuthService);

  readonly staff = computed(() => this.platform.storeStaff());
  readonly isLoggedIn = computed(() => this.platform.isLoggedIn());
  readonly isManager = computed(() => this.staff()?.role === STORE_STAFF_ROLES.MANAGER);

  getToken(): string | null {
    return this.platform.getToken();
  }

  setAuth(_token: string, _staff: StorePortalStaff): void {
    // No-op — session is owned by PlatformAuthService after unified login.
  }

  logout(): void {
    this.platform.logout();
  }
}
