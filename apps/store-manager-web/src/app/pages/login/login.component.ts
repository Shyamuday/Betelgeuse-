import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StoreApiService } from '../../services/store-api.service';
import { StoreAuthService } from '../../services/store-auth.service';
import { STORE_STAFF_ROLES } from '../../core/constants/auth.constants';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private api = inject(StoreApiService);
  private auth = inject(StoreAuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');

  constructor() {
    if (this.route.snapshot.queryParamMap.get('error') === 'manager-only') {
      this.error.set('This app is for store managers only.');
    }
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    void this.router.navigateByUrl(returnUrl && returnUrl.startsWith('/') ? returnUrl : '/');
  }

  login(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.loginManager(this.email, this.password).subscribe({
      next: (res) => {
        if (res.staff.role !== STORE_STAFF_ROLES.MANAGER) {
          this.loading.set(false);
          this.error.set('Manager credentials required for this app.');
          return;
        }
        this.auth.setAuth(res.token, res.staff);
        this.loading.set(false);
        this.navigateAfterLogin();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid email or password');
      }
    });
  }
}
