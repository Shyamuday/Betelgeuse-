import { Injectable, signal, computed } from '@angular/core';
import { StoreStaff } from '../models';
import { AUTH_STAFF_KEY, AUTH_TOKEN_KEY, STORE_STAFF_ROLES } from '../core/constants/auth.constants';

@Injectable({ providedIn: 'root' })
export class StoreAuthService {
  private _token = signal<string | null>(localStorage.getItem(AUTH_TOKEN_KEY));
  private _staff = signal<StoreStaff | null>(this.loadStaff());

  readonly token = this._token.asReadonly();
  readonly staff = this._staff.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isManager = computed(() => this._staff()?.role === STORE_STAFF_ROLES.MANAGER);

  private loadStaff(): StoreStaff | null {
    const raw = localStorage.getItem(AUTH_STAFF_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoreStaff;
    } catch {
      return null;
    }
  }

  setAuth(token: string, staff: StoreStaff): void {
    this._token.set(token);
    this._staff.set(staff);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_STAFF_KEY, JSON.stringify(staff));
  }

  logout(): void {
    this._token.set(null);
    this._staff.set(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_STAFF_KEY);
  }

  getToken(): string | null {
    return this._token();
  }
}
