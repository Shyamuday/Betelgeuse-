import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminAuth } from '../../../core/services/admin-auth';
import { environment } from '../../../../environments/environment';
import { GoogleSignInButtonComponent } from '../google-sign-in-button/google-sign-in-button';

@Component({
  selector: 'app-admin-login',
  imports: [FormsModule, RouterLink, GoogleSignInButtonComponent],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {
  readonly patientPortalUrl = environment.patientPortalUrl?.trim() || '';
  readonly googleClientId = environment.googleClientId?.trim() || '';

  email = '';
  password = '';
  error = '';
  submitting = false;

  constructor(
    private readonly auth: AdminAuth,
    private readonly router: Router
  ) {}

  async submit() {
    this.error = '';
    this.submitting = true;
    try {
      const result = await this.auth.login(this.email, this.password);
      if (!result.ok) {
        this.error = result.message;
        return;
      }
      void this.router.navigateByUrl('/');
    } finally {
      this.submitting = false;
    }
  }

  async googleSignIn(idToken: string) {
    this.error = '';
    this.submitting = true;
    try {
      const result = await this.auth.loginWithGoogle(idToken);
      if (!result.ok) {
        this.error = result.message;
        return;
      }
      void this.router.navigateByUrl('/');
    } finally {
      this.submitting = false;
    }
  }
}
