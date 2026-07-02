import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppOverlayService } from '../overlay.service';
import { AuthFormOverlayComponent } from './auth-form-overlay.component';

@Component({
  selector: 'app-auth-reset-callback',
  imports: [],
  template: `<div class="reset-callback"><p>Processing reset link…</p></div>`,
  styles: [`
    .reset-callback {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: inherit;
      color: #6b7280;
    }
  `]
})
export class AuthResetCallbackComponent implements OnInit {
  private readonly overlayService = inject(AppOverlayService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (token) {
      this.overlayService.open(AuthFormOverlayComponent, {
        data: { mode: 'patient', initialForgotStep: 'reset', resetToken: token },
        width: '480px',
        panelClass: 'app-overlay-panel'
      });
    }

    void this.router.navigateByUrl('/');
  }
}
