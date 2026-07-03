import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ROUTE_PATHS } from '../core/constants/app-routes.constants';

/** Resolves `/store` vs `/store-manager` links for shared store pages. */
@Injectable({ providedIn: 'root' })
export class StoreRouteContext {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isManager = computed(() => this.url().includes(`/${ROUTE_PATHS.STORE_MANAGER}`));

  readonly basePath = computed(() =>
    this.isManager() ? `/${ROUTE_PATHS.STORE_MANAGER}` : `/${ROUTE_PATHS.STORE}`
  );

  link(...segments: Array<string | number>): string[] {
    return [this.basePath(), ...segments.map(String)];
  }
}
