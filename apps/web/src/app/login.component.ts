import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="auth-page">
      <div class="auth-card">
        <p class="eyebrow">Betelgeuse Clinic</p>
        <h1>One app for patients, doctors, and admin</h1>
        <p class="muted">Patients use mobile OTP. Doctors and admins use credentials created internally.</p>

        <div class="tabs">
          <button [disabled]="isProcessing()" [class.active]="mode() === 'patient'" (click)="mode.set('patient')">Patient</button>
          <button [disabled]="isProcessing()" [class.active]="mode() === 'staff'" (click)="mode.set('staff')">Doctor/Admin</button>
        </div>

        @if (mode() === 'patient') {
          <form (ngSubmit)="loginPatient()">
            <label>
              Name
              <input name="name" [(ngModel)]="patient.name" placeholder="Your name" />
            </label>
            <label>
              Mobile number
              <input name="mobile" [(ngModel)]="patient.mobile" placeholder="9876543210" />
            </label>
            <div class="otp-row">
              <label>
                OTP
                <input name="otp" [(ngModel)]="patient.otp" placeholder="123456" />
              </label>
              <button type="button" class="secondary" [disabled]="isProcessing()" (click)="requestOtp()">Get OTP</button>
            </div>
            <button class="primary" type="submit" [disabled]="isProcessing()">Login as patient</button>
          </form>

          <div class="divider-text">or</div>
          <form (ngSubmit)="loginWithGoogle()">
            <label>
              Google ID token
              <input name="googleToken" [(ngModel)]="googleIdToken" placeholder="Paste Google Identity token" />
            </label>
            <button class="secondary" type="submit" [disabled]="isProcessing()">Continue with Google</button>
            <p class="muted">Set GOOGLE_CLIENT_ID in the API environment before using Google sign-in.</p>
          </form>
        } @else {
          <form (ngSubmit)="loginStaff()">
            <label>
              Email
              <input name="email" [(ngModel)]="staff.email" placeholder="doctor@betelgeuseclinic.local" />
            </label>
            <label>
              Password
              <input name="password" type="password" [(ngModel)]="staff.password" placeholder="Password@123" />
            </label>
            <button class="primary" type="submit" [disabled]="isProcessing()">Login</button>
          </form>

          <div class="forgot-box">
            <h3>Forgot password</h3>
            <label>
              Staff email
              <input name="forgotEmail" [(ngModel)]="forgot.email" placeholder="doctor@betelgeuseclinic.local" />
            </label>
            <button class="secondary" type="button" [disabled]="isProcessing()" (click)="forgotPassword()">Generate reset token</button>

            <label>
              Reset token
              <input name="resetToken" [(ngModel)]="forgot.token" placeholder="Paste reset token" />
            </label>
            <label>
              New password
              <input name="newPassword" type="password" [(ngModel)]="forgot.password" placeholder="New password" />
            </label>
            <button class="secondary" type="button" [disabled]="isProcessing()" (click)="resetPassword()">Reset and login</button>
          </div>
        }

        @if (message()) {
          <p class="notice">{{ message() }}</p>
        }
      </div>

      @if (isProcessing()) {
        <div class="process-overlay" aria-live="polite" aria-busy="true">
          <div class="process-card">
            <span class="spinner"></span>
            <strong>{{ processLabel() }}</strong>
            <small>Please wait while we securely process your request.</small>
          </div>
        </div>
      }
    </section>
  `
})
export class LoginComponent {
  readonly mode = signal<'patient' | 'staff'>('patient');
  readonly message = signal('');
  readonly isProcessing = signal(false);
  readonly processLabel = signal('Processing...');

  patient = {
    name: 'Patient',
    mobile: '9876543210',
    otp: '123456'
  };

  staff = {
    email: 'admin@betelgeuseclinic.local',
    password: 'Password@123'
  };

  forgot = {
    email: 'admin@betelgeuseclinic.local',
    token: '',
    password: 'Password@123'
  };

  googleIdToken = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  requestOtp() {
    this.process('Sending OTP...', this.auth.requestOtp(this.patient.mobile)).subscribe({
      next: (response) => this.message.set(`Development OTP: ${response.devOtp}`),
      error: () => this.message.set('Could not request OTP.')
    });
  }

  loginPatient() {
    this.process('Logging in patient...', this.auth.patientLogin(this.patient)).subscribe({
      next: ({ user }) => this.router.navigateByUrl(this.auth.dashboardFor(user.role)),
      error: (error) => this.message.set(error.error?.message || 'Patient login failed.')
    });
  }

  loginStaff() {
    this.process('Logging in staff...', this.auth.staffLogin(this.staff)).subscribe({
      next: ({ user }) => this.router.navigateByUrl(this.auth.dashboardFor(user.role)),
      error: (error) => this.message.set(error.error?.message || 'Staff login failed.')
    });
  }

  forgotPassword() {
    this.process('Generating reset token...', this.auth.forgotPassword(this.forgot.email)).subscribe({
      next: (response) => {
        this.forgot.token = response.resetToken || '';
        this.message.set(response.resetToken ? `Development reset token: ${response.resetToken}` : response.message);
      },
      error: () => this.message.set('Could not generate reset token.')
    });
  }

  resetPassword() {
    this.process('Resetting password...', this.auth.resetPassword({ token: this.forgot.token, password: this.forgot.password })).subscribe({
      next: ({ user }) => this.router.navigateByUrl(this.auth.dashboardFor(user.role)),
      error: (error) => this.message.set(error.error?.message || 'Password reset failed.')
    });
  }

  loginWithGoogle() {
    this.process('Signing in with Google...', this.auth.googleLogin(this.googleIdToken)).subscribe({
      next: ({ user }) => this.router.navigateByUrl(this.auth.dashboardFor(user.role)),
      error: (error) => this.message.set(error.error?.message || 'Google login failed.')
    });
  }

  private process<T>(label: string, request$: Observable<T>) {
    this.message.set('');
    this.processLabel.set(label);
    this.isProcessing.set(true);

    return request$.pipe(finalize(() => this.isProcessing.set(false)));
  }
}
