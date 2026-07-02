import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NAV_ITEMS } from '../../core/constants/app-routes.constants';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-doctor-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './doctor-shell.html',
  styleUrl: './doctor-shell.scss',
})
export class DoctorShell {
  readonly navItems = NAV_ITEMS;

  constructor(private readonly auth: Auth) {}

  logout() {
    this.auth.logout();
  }
}
