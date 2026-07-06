import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  signal
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NAV_GROUPS, type AdminNavItem } from '../../core/constants/app-routes.constants';

@Component({
  selector: 'app-admin-nav-tabs',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-nav-tabs.component.html',
  styleUrl: './admin-nav-tabs.component.scss'
})
export class AdminNavTabsComponent {
  readonly items = input.required<readonly AdminNavItem[]>();

  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly openGroupId = signal<string | null>(null);
  readonly activeGroupId = signal('');
  readonly currentPath = signal('');

  readonly visibleGroups = computed(() => {
    const items = this.items();
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: items.filter((item) =>
        (group.segments as readonly string[]).includes(this.pathSegment(item.path))
      )
    })).filter((group) => group.items.length > 0);
  });

  readonly currentPageLabel = computed(() => {
    const path = this.currentPath();
    const item = this.items().find(
      (entry) => path === entry.path || path.startsWith(`${entry.path}/`)
    );
    return item?.label ?? '';
  });

  constructor() {
    this.syncFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.syncFromUrl(event.urlAfterRedirects);
        this.closeSubmenu();
      });

    effect(() => {
      this.items();
      this.visibleGroups();
      this.syncFromUrl(this.router.url);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.openGroupId()) return;
    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) return;
    this.closeSubmenu();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.openGroupId()) return;
    this.closeSubmenu();
    event.stopPropagation();
  }

  toggleGroup(id: string): void {
    this.openGroupId.update((current) => (current === id ? null : id));
  }

  closeSubmenu(): void {
    this.openGroupId.set(null);
  }

  isGroupActive(groupId: string): boolean {
    return this.activeGroupId() === groupId;
  }

  isItemActive(path: string): boolean {
    const url = this.currentPath();
    return url === path || url.startsWith(`${path}/`);
  }

  private syncFromUrl(url: string): void {
    const path = url.split('?')[0];
    this.currentPath.set(path);

    const groups = this.visibleGroups();
    const match = groups.find((group) =>
      group.items.some((item) => path === item.path || path.startsWith(`${item.path}/`))
    );

    if (match) {
      this.activeGroupId.set(match.id);
      return;
    }

    if (!this.activeGroupId() && groups[0]) {
      this.activeGroupId.set(groups[0].id);
    }
  }

  private pathSegment(path: string): string {
    return path.split('/').filter(Boolean).pop() ?? '';
  }
}
