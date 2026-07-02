import { Injectable, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, from, tap } from 'rxjs';
import { Role, User } from '../models';
import { PatientAuthService } from './patient-auth.service';
import { environment } from '../../environments/environment';

type AuthResponse = {
  token: string;
  user: User;
};

const tokenKey = 'clinic_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly patientAuth = inject(PatientAuthService);
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiUrl;

  readonly user = this.patientAuth.user.asReadonly();
  readonly isLoggedIn = computed(() => Boolean(this.user()));

  constructor() {
    void this.bootstrapSession();
  }

  async bootstrapSession() {
    const token = this.token;
    if (!token) {
      this.patientAuth.setAuthenticatedUser(null);
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<{ user: User }>(`${this.apiBase}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      this.patientAuth.setAuthenticatedUser(response.user);
      return response.user;
    } catch {
      localStorage.removeItem(tokenKey);
      this.patientAuth.setAuthenticatedUser(null);
      return null;
    }
  }

  get token() {
    return localStorage.getItem(tokenKey);
  }

  requestOtp(mobile: string) {
    return this.http.post<{ devOtp?: string }>(`${this.apiBase}/auth/request-otp`, { mobile });
  }

  patientLogin(payload: { name: string; mobile: string; otp: string }) {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/patient-login`, payload).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  patientPasswordLogin(payload: { identifier: string; password: string }) {
    return from(this.patientAuth.signInWithPassword(payload.identifier, payload.password)).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  patientRegister(payload: { name: string; email?: string; mobile?: string; password: string }) {
    return from(this.patientAuth.register(payload)).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  staffLogin(payload: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/staff-login`, payload).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  googleLogin(idToken: string) {
    return this.http.post<AuthResponse>(`${this.apiBase}/auth/google`, { idToken }).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  forgotPassword(email: string) {
    return from(this.patientAuth.forgotPassword(email));
  }

  staffForgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.apiBase}/auth/forgot-password`, { email });
  }

  resetPassword(payload: { token: string; password: string }) {
    return from(this.patientAuth.resetPassword(payload.token, payload.password)).pipe(
      tap((response) => this.persistSession(response))
    );
  }

  logout() {
    localStorage.removeItem(tokenKey);
    this.patientAuth.setAuthenticatedUser(null);
  }

  dashboardFor(role: Role) {
    if (role === 'ADMIN') return '/admin/dashboard';
    if (role === 'DOCTOR') return '/doctor/dashboard';
    return '/patient/dashboard';
  }

  private persistSession(response: AuthResponse) {
    if (response.token) {
      localStorage.setItem(tokenKey, response.token);
    }

    this.patientAuth.setAuthenticatedUser(response.user);
  }
}
