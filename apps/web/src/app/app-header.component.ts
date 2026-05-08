import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  effect,
  EventEmitter,
  HostListener,
  inject,
  Input,
  type OnDestroy,
  Output,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  type AuthenticatedHeaderNavItem,
  DEFAULT_GUEST_HEADER_NAV,
  DEFAULT_HEADER_BRAND,
  DEFAULT_USER_HEADER_NAV,
  type GuestHeaderNavItem
} from './app-header.nav-data';
import { AuthFormOverlayComponent } from './auth/auth-form-overlay.component';
import { type User } from './interfaces';
import { LanguageSwitcherComponent } from './i18n/language-switcher.component';
import { AppOverlayService } from './overlay.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, TranslatePipe, LanguageSwitcherComponent],
  template: `
    <header
      class="app-header"
      [class.app-header--guest]="!user"
      [class.menu-open]="menuOpen()">
      <a class="brand" [routerLink]="homePath" (click)="closeMenu()">
        <span class="brand-mark">{{ brandMark }}</span>
        <span>
          <strong>{{ brandTitle }}</strong>
          <small>{{ subtitle }}</small>
        </span>
      </a>

      @if (user) {
        <div class="user-chip">
          <app-language-switcher />
          @for (link of userNavEffective; track link.id) {
            <a
              [routerLink]="link.routerLink"
              [class]="link.linkClass || 'user-chip-nav'"
              >{{ link.labelKey | translate }}</a
            >
          }
          <span>{{ user.name }}</span>
          <strong>{{ user.role }}</strong>
          <button class="secondary" type="button" (click)="logout.emit()">{{ 'common.logout' | translate }}</button>
        </div>
      } @else {
        <button
          type="button"
          class="header-menu-toggle"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="header-primary-nav"
          aria-label="Open or close menu">
          @if (menuOpen()) {
            <svg class="header-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                d="M6 6l12 12M18 6L6 18" />
            </svg>
          } @else {
            <svg class="header-menu-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          }
        </button>

        <div
          class="header-nav-backdrop"
          role="presentation"
          tabindex="-1"
          (click)="closeMenu()"
          [attr.aria-hidden]="true"></div>

        <nav id="header-primary-nav" class="header-actions header-nav-sheet" aria-label="Primary navigation">
          <app-language-switcher />
          @for (item of guestNavEffective; track item.id) {
            @switch (item.type) {
              @case ('route') {
                <a [routerLink]="item.routerLink" (click)="closeMenu()" [class]="item.linkClass || ''">{{
                  item.labelKey | translate
                }}</a>
              }
              @case ('auth') {
                <a
                  href="/login"
                  [class]="item.linkClass || ''"
                  (click)="openAuthOverlay($event, item.authMode)"
                  >{{ item.labelKey | translate }}</a
                >
              }
            }
          }
        </nav>
      }
    </header>
  `
})
export class AppHeaderComponent implements OnDestroy {
  @Input() subtitle = 'Digital clinic';

  /** Overrides {@link DEFAULT_HEADER_BRAND.title} when set. */
  @Input() brandTitle = DEFAULT_HEADER_BRAND.title;

  /** Letter or short mark in the brand tile. */
  @Input() brandMark = DEFAULT_HEADER_BRAND.mark;

  /** Router path for the brand link (default home). */
  @Input() homePath = DEFAULT_HEADER_BRAND.homePath;

  @Input() user: User | null | undefined;

  /**
   * When `undefined`, {@link DEFAULT_GUEST_HEADER_NAV} is used.
   * Pass a new array to customize visitor navigation (e.g. from CMS later).
   */
  @Input() guestNavItems: GuestHeaderNavItem[] | undefined;

  /**
   * When `undefined`, {@link DEFAULT_USER_HEADER_NAV} is used (role-filtered).
   * Pass a new array to add or replace signed-in chip links.
   */
  @Input() userNavItems: AuthenticatedHeaderNavItem[] | undefined;

  @Output() logout = new EventEmitter<void>();

  readonly menuOpen = signal(false);

  private readonly document = inject(DOCUMENT);

  constructor(private readonly overlayService: AppOverlayService) {
    effect(() => {
      const open = this.menuOpen();
      this.document.body.classList.toggle('header-menu-no-scroll', open);
      this.document.documentElement.classList.toggle('header-menu-no-scroll', open);
    });
  }

  get guestNavEffective(): GuestHeaderNavItem[] {
    return this.guestNavItems === undefined ? DEFAULT_GUEST_HEADER_NAV : this.guestNavItems;
  }

  get userNavEffective(): AuthenticatedHeaderNavItem[] {
    const items = this.userNavItems === undefined ? DEFAULT_USER_HEADER_NAV : this.userNavItems;
    const u = this.user;
    if (!u) {
      return [];
    }
    return items.filter((link) => !link.roles?.length || link.roles.includes(u.role));
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('header-menu-no-scroll');
    this.document.documentElement.classList.remove('header-menu-no-scroll');
  }

  @HostListener('document:keydown.escape')
  onDocumentEscape(): void {
    if (this.menuOpen()) {
      this.closeMenu();
    }
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openAuthOverlay(event: Event, mode: 'patient' | 'staff' = 'patient') {
    event.preventDefault();
    this.closeMenu();
    this.overlayService.open(AuthFormOverlayComponent, {
      data: { mode },
      width: '480px',
      panelClass: 'app-overlay-panel'
    });
  }
}
