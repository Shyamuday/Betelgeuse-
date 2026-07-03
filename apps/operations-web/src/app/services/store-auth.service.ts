import { Injectable, computed, inject } from '@angular/core';
import { StoreStaff } from '../store-models';
import { STORE_STAFF_ROLES } from '../core/constants/store/auth.constants';
import { PlatformAuthService } from './platform-auth.service';

/** Bridges store pages to the unified platform session (store staff use the same token). */
@Injectable({ providedIn: 'root' })
export class StoreAuthService {
  private platform = inject(PlatformAuthService);

  readonly staff = computed(() => this.platform.storeStaff());
  readonly isLoggedIn = computed(() => this.platform.isLoggedIn());
  readonly isManager = computed(() => this.staff()?.role === STORE_STAFF_ROLES.MANAGER);

  getToken(): string | null {
    return this.platform.getToken();
  }

  setAuth(_token: string, _staff: StoreStaff): void {
    // No-op — session is owned by PlatformAuthService after unified login.
  }

  logout(): void {
    this.platform.logout();
  }
}
