import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { APP_OVERLAY_DATA, APP_OVERLAY_REF } from '../overlay.tokens';
import { type AppOverlayRef, AppOverlayService } from '../overlay.service';
import { AuthStatusOverlayComponent } from './auth-status-overlay.component';
import { AuthService } from './auth.service';
import { GoogleSignInButtonComponent } from './google-sign-in-button.component';
import { environment } from '../../environments/environment';

type AuthFormOverlayData = {
  mode?: 'patient' | 'staff';
  initialForgotStep?: ForgotStep;
};

type ForgotStep = 'none' | 'email' | 'sent' | 'reset';

type PatientAuthStep = 'signin' | 'register' | 'forgot' | 'forgot-sent' | 'reset';

type PatientOtpUiStep = 'mobile' | 'otp';

@Component({
  selector: 'app-auth-form-overlay',
  imports: [CommonModule, FormsModule, GoogleSignInButtonComponent],
  template: `
    <div class="auth-card">
      <p class="eyebrow">Vitalis Care and Research Centre</p>

      @if (mode() === 'patient') {
        @switch (patientStep()) {
          @case ('signin') {
            <h2>Login to continue</h2>

            <form (ngSubmit)="loginPatientWithPassword()">
              <label>
                Email or mobile number
                <input
                  name="identifier"
                  [(ngModel)]="patientCredentials.identifier"
                  placeholder="Enter email or mobile number"
                  autocomplete="username"
                />
              </label>
              <label>
                Password
                <input
                  name="patientPassword"
                  type="password"
                  [(ngModel)]="patientCredentials.password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                />
              </label>
              <button class="primary" type="submit" [disabled]="isProcessing()">Login</button>
            </form>

            <div class="auth-sub-actions">
              <button type="button" class="auth-text-link" (click)="goPatientStep('register')">
                Mobile number &amp; OTP
              </button>
              <span class="auth-sub-sep" aria-hidden="true">·</span>
              <button type="button" class="auth-text-link" (click)="goPatientStep('forgot')">
                Forgot password?
              </button>
            </div>

            <form (ngSubmit)="loginWithGoogle()">
              <button class="secondary" type="submit" [disabled]="isProcessing()">Continue with Google</button>
            </form>
          }

          @case ('register') {
            @switch (patientOtpUiStep()) {
              @case ('mobile') {
                <button type="button" class="back-btn" (click)="goPatientStep('signin')">← Back</button>
                <h2>Mobile number</h2>
                <form (ngSubmit)="requestOtpAndProceed($event)">
                  <label>
                    Mobile number
                    <input
                      name="otpMobile"
                      [(ngModel)]="patientOtp.mobile"
                      placeholder="Enter 10-digit mobile number"
                      inputmode="tel"
                      autocomplete="tel"
                    />
                  </label>
                  <button class="primary" type="submit" [disabled]="isProcessing()">Get OTP</button>
                </form>
              }
              @case ('otp') {
                <button type="button" class="back-btn" (click)="backToPatientMobileStep()">← Back</button>
                <h2>OTP</h2>
                <form (ngSubmit)="loginPatientWithOtp()">
                  <label>
                    OTP
                    <input
                      name="otpCode"
                      [(ngModel)]="patientOtp.otp"
                      placeholder="Enter 6-digit OTP"
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="one-time-code"
                    />
                  </label>
                  <button class="primary" type="submit" [disabled]="isProcessing()">Login</button>
                </form>
              }
            }
          }

          @case ('forgot') {
            <button type="button" class="back-btn" (click)="goPatientStep('signin')">← Back to login</button>
            <h2>Forgot password</h2>

            <form (ngSubmit)="forgotPassword()">
              <label>
                Email
                <input
                  name="patientForgotEmail"
                  type="email"
                  [(ngModel)]="forgot.email"
                  placeholder="you@example.com"
                  autocomplete="email"
                />
              </label>
              <button class="primary" type="submit" [disabled]="isProcessing()">Send reset link</button>
            </form>
          }

          @case ('forgot-sent') {
            <button type="button" class="back-btn" (click)="goPatientStep('signin')">← Back to login</button>
            <div class="success-notice">
              <span class="notice-icon">✓</span>
              <h2>Reset link sent</h2>
            </div>

            <button class="primary" type="button" (click)="goPatientStep('reset')">
              I’ve clicked the link → Enter new password
            </button>

            <button type="button" class="link-btn" (click)="forgotPassword()">Didn’t receive? Resend link</button>
          }

          @case ('reset') {
            <button type="button" class="back-btn" (click)="goPatientStep('signin')">← Back to login</button>
            <h2>Set new password</h2>

            <form (ngSubmit)="resetPassword()">
              <label>
                New password
                <input
                  name="newPatientPassword"
                  type="password"
                  [(ngModel)]="forgot.password"
                  placeholder="Min 8 characters"
                  autocomplete="new-password"
                />
              </label>
              <label>
                Confirm password
                <input
                  name="confirmPatientPassword"
                  type="password"
                  [(ngModel)]="forgot.confirmPassword"
                  placeholder="Confirm new password"
                  autocomplete="new-password"
                />
              </label>
              @if (forgot.password && forgot.confirmPassword && forgot.password !== forgot.confirmPassword) {
                <p class="error-text">Passwords do not match</p>
              }
              <button class="primary" type="submit" [disabled]="isProcessing() || !canResetPassword()">
                Reset password &amp; login
              </button>
            </form>
          }
        }
      } @else {
        <!-- Staff Login / Forgot Password Flow -->
        @switch (forgotStep()) {
          @case ('none') {
            <!-- Normal Login -->
            <h2>Doctor login</h2>

            <form (ngSubmit)="loginStaff()">
              <label>
                Email
                <input name="email" [(ngModel)]="staff.email" placeholder="doctor@vitalisclinic.local" />
              </label>
              <label>
                Password
                <input name="password" type="password" [(ngModel)]="staff.password" placeholder="Password@123" />
              </label>
              <button class="primary" type="submit" [disabled]="isProcessing()">Login</button>
            </form>

            <button type="button" class="link-btn" (click)="goToForgotStep('email')">
              Forgot password?
            </button>

            @if (googleClientId) {
              <app-google-sign-in-button [clientId]="googleClientId" (credential)="loginStaffWithGoogle($event)" />
            }
          }

          @case ('email') {
            <!-- Step 1: Enter email -->
            <button type="button" class="back-btn" (click)="goToForgotStep('none')">← Back to login</button>
            <h2>Forgot password</h2>

            <form (ngSubmit)="forgotPassword()">
              <label>
                Staff email
                <input name="forgotEmail" [(ngModel)]="forgot.email" placeholder="doctor@vitalisclinic.local" />
              </label>
              <button class="primary" type="submit" [disabled]="isProcessing()">Send reset link</button>
            </form>
          }

          @case ('sent') {
            <!-- Step 2: Link sent, waiting for user to click -->
            <button type="button" class="back-btn" (click)="goToForgotStep('none')">← Back to login</button>
            <div class="success-notice">
              <span class="notice-icon">✓</span>
              <h2>Reset link sent</h2>
            </div>

            <button class="primary" type="button" (click)="goToForgotStep('reset')">
              I've clicked the link → Enter new password
            </button>

            <button type="button" class="link-btn" (click)="forgotPassword()">
              Didn't receive? Resend link
            </button>
          }

          @case ('reset') {
            <!-- Step 3: Enter new password -->
            <button type="button" class="back-btn" (click)="goToForgotStep('sent')">← Back</button>
            <h2>Set new password</h2>

            <form (ngSubmit)="resetPassword()">
              <label>
                New password
                <input name="newPassword" type="password" [(ngModel)]="forgot.password" placeholder="Min 8 characters" />
              </label>
              <label>
                Confirm password
                <input name="confirmPassword" type="password" [(ngModel)]="forgot.confirmPassword" placeholder="Confirm new password" />
              </label>
              @if (forgot.password && forgot.confirmPassword && forgot.password !== forgot.confirmPassword) {
                <p class="error-text">Passwords do not match</p>
              }
              <button class="primary" type="submit" [disabled]="isProcessing() || !canResetPassword()">Reset password & login</button>
            </form>
          }
        }
      }
    </div>
  `
})
export class AuthFormOverlayComponent {
  private readonly overlayData = (inject(APP_OVERLAY_DATA) as AuthFormOverlayData | null) || {};
  readonly mode = signal<'patient' | 'staff'>(this.overlayData.mode || 'patient');
  readonly isProcessing = signal(false);
  readonly forgotStep = signal<ForgotStep>(this.overlayData.initialForgotStep || 'none');
  readonly patientStep = signal<PatientAuthStep>(
    (this.overlayData.mode || 'patient') === 'patient' && this.overlayData.initialForgotStep === 'reset'
      ? 'reset'
      : 'signin'
  );
  readonly patientOtpUiStep = signal<PatientOtpUiStep>('mobile');
  private activeOverlayRef?: AppOverlayRef;

  patientCredentials = {
    identifier: '',
    password: ''
  };

  patientOtp = {
    mobile: '',
    otp: ''
  };

  staff = {
    email: '',
    password: ''
  };

  forgot = {
    email: '',
    password: '',
    confirmPassword: ''
  };

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly overlayService = inject(AppOverlayService);
  private readonly hostOverlayRef = inject(APP_OVERLAY_REF) as AppOverlayRef;

  readonly googleClientId = environment.googleClientId?.trim() || '';

  goToForgotStep(step: ForgotStep) {
    this.forgotStep.set(step);
  }

  goPatientStep(step: PatientAuthStep) {
    if (step === 'forgot') {
      this.forgot.email = '';
    }
    if (step === 'signin') {
      this.forgot.password = '';
      this.forgot.confirmPassword = '';
    }
    if (step === 'register') {
      this.patientOtpUiStep.set('mobile');
      this.patientOtp.otp = '';
    }
    this.patientStep.set(step);
  }

  backToPatientMobileStep() {
    this.patientOtp.otp = '';
    this.patientOtpUiStep.set('mobile');
  }

  canResetPassword(): boolean {
    return !!(this.forgot.password &&
      this.forgot.confirmPassword &&
      this.forgot.password === this.forgot.confirmPassword &&
      this.forgot.password.length >= 8);
  }

  requestOtpAndProceed(event: Event) {
    event.preventDefault();
    const mobile = this.patientOtp.mobile.trim().replace(/\s+/g, '');
    if (mobile.length < 8) {
      this.showError('Enter a valid mobile number.');
      return;
    }
    this.patientOtp.mobile = mobile;
    this.process('Sending OTP...', this.auth.requestOtp(mobile)).subscribe({
      next: (response) => {
        this.patientOtpUiStep.set('otp');
        this.showSuccess(`OTP sent. Development code: ${response.devOtp}`);
      },
      error: () => this.showError('Could not request OTP.')
    });
  }

  loginPatientWithOtp() {
    this.process('Logging in patient...', this.auth.patientLogin(this.patientOtp)).subscribe({
      next: ({ user }) => {
        this.closeAllOverlays();
        this.router.navigateByUrl(this.auth.dashboardFor(user.role));
      },
      error: (error) => this.showError(error.error?.message || 'Patient login failed.')
    });
  }

  loginPatientWithPassword() {
    this.process('Logging in patient...', this.auth.patientPasswordLogin(this.patientCredentials)).subscribe({
      next: ({ user }) => {
        this.closeAllOverlays();
        this.router.navigateByUrl(this.auth.dashboardFor(user.role));
      },
      error: (error) => this.showError(error.error?.message || 'Patient login failed.')
    });
  }

  loginStaff() {
    this.process('Logging in staff...', this.auth.staffLogin(this.staff)).subscribe({
      next: ({ user }) => {
        this.closeAllOverlays();
        this.router.navigateByUrl(this.auth.dashboardFor(user.role));
      },
      error: (error) => this.showError(error.error?.message || 'Staff login failed.')
    });
  }

  loginStaffWithGoogle(idToken: string) {
    this.process('Signing in with Google...', this.auth.staffGoogleLogin(idToken)).subscribe({
      next: ({ user }) => {
        this.closeAllOverlays();
        this.router.navigateByUrl(this.auth.dashboardFor(user.role));
      },
      error: (error) => this.showError(error.error?.message || 'Google sign-in failed.')
    });
  }

  forgotPassword() {
    this.process('Sending reset link...', this.auth.forgotPassword(this.forgot.email)).subscribe({
      next: () => {
        this.closeActiveOverlay();
        if (this.mode() === 'patient') {
          this.patientStep.set('forgot-sent');
        } else {
          this.goToForgotStep('sent');
        }
      },
      error: () => this.showError('Could not send reset link.')
    });
  }

  resetPassword() {
    this.process('Resetting password...', this.auth.resetPassword({ token: '', password: this.forgot.password })).subscribe({
      next: ({ user }) => {
        this.closeAllOverlays();
        this.router.navigateByUrl(this.auth.dashboardFor(user.role));
      },
      error: (error) => this.showError(error.error?.message || 'Password reset failed.')
    });
  }

  loginWithGoogle() {
    this.process('Signing in with Google...', this.auth.googleLogin()).subscribe({
      next: (response) => this.showSuccess(response.message || 'Google sign-in initiated.'),
      error: (error) => this.showError(error.error?.message || 'Google login failed.')
    });
  }

  private process<T>(label: string, request$: Observable<T>) {
    this.openAuthOverlay('loading', label, 'Please wait while we securely process your request.');
    this.isProcessing.set(true);

    return new Observable<T>((observer) => {
      const subscription = request$.subscribe({
        next: (value) => observer.next(value),
        error: (error) => {
          this.isProcessing.set(false);
          observer.error(error);
        },
        complete: () => {
          this.isProcessing.set(false);
          observer.complete();
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  private closeActiveOverlay() {
    this.activeOverlayRef?.close();
    this.activeOverlayRef = undefined;
  }

  private closeAllOverlays() {
    this.closeActiveOverlay();
    this.hostOverlayRef.close();
  }

  private showSuccess(message: string) {
    this.openAuthOverlay('success', 'Completed', message);
  }

  private showError(message: string) {
    this.openAuthOverlay('error', 'Request failed', message);
  }

  private openAuthOverlay(state: 'loading' | 'success' | 'error', label: string, message: string) {
    this.closeActiveOverlay();
    this.activeOverlayRef = this.overlayService.open(AuthStatusOverlayComponent, {
      data: { state, label, message },
      disableClose: state === 'loading',
      width: '360px'
    });
  }
}
