import { Component, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
  RouterOutlet
} from '@angular/router';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly router = inject(Router);
  readonly booting = signal(true);

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
        ),
        take(1)
      )
      .subscribe(() => this.booting.set(false));
  }
}
