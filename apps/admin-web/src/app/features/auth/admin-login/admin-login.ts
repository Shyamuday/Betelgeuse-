import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import { AdminAuth } from '../../../core/services/admin-auth';
import { DEFAULT_AUTHED_ROUTE } from '../../../core/constants/app-routes.constants';
import { DevLoginPanelComponent } from '../../../shared/dev-login-panel/dev-login-panel';
import { DEV_DEMO_ACCOUNTS } from '../../../core/constants/dev-demo.constants';
import type { DevFillCredentials } from '../../../core/types/dev-demo.types';

@Component({
  selector: 'app-admin-login',
  imports: [FormField, DevLoginPanelComponent],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {
  private readonly auth = inject(AdminAuth);
  private readonly router = inject(Router);

  readonly loginModel = signal({
    email: DEV_DEMO_ACCOUNTS.admin.email,
    password: DEV_DEMO_ACCOUNTS.password
  });
  readonly loginForm = form(this.loginModel, (schema) => {
    required(schema.email, { message: 'Email is required' });
    required(schema.password, { message: 'Password is required' });
  });

  error = signal('');
  submitting = signal(false);

  async submit() {
    if (this.loginForm().invalid()) return;
    const { email, password } = this.loginModel();
    this.error.set('');
    this.submitting.set(true);
    try {
      const result = await this.auth.login(email, password);
      if (!result.ok) {
        this.error.set(result.message);
        return;
      }
      void this.router.navigateByUrl(`/${DEFAULT_AUTHED_ROUTE}`);
    } finally {
      this.submitting.set(false);
    }
  }

  onDevLoggedIn() {
    void this.router.navigateByUrl(`/${DEFAULT_AUTHED_ROUTE}`);
  }

  applyDevFill(credentials: DevFillCredentials) {
    this.loginModel.update((model) => ({
      ...model,
      ...(credentials.email ? { email: credentials.email } : {}),
      ...(credentials.password ? { password: credentials.password } : {})
    }));
  }
}
