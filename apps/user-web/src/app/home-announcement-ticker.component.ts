import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  HomeAnnouncement,
  HomeAnnouncementsService,
} from './core/services/home-announcements.service';

@Component({
  selector: 'app-home-announcement-ticker',
  imports: [CommonModule],
  templateUrl: './home-announcement-ticker.component.html',
  styleUrl: './home-announcement-ticker.component.scss',
})
export class HomeAnnouncementTickerComponent {
  private readonly service = inject(HomeAnnouncementsService);
  private readonly router = inject(Router);
  readonly announcements = signal<HomeAnnouncement[]>([]);

  constructor() {
    void this.load();
  }

  async load() {
    this.announcements.set(await this.service.list());
  }

  open(item: HomeAnnouncement) {
    const url = item.linkUrl?.trim();
    if (!url) return;
    if (url.startsWith('http')) {
      window.open(url, '_blank', 'noopener');
      return;
    }
    void this.router.navigateByUrl(url.startsWith('/') ? url : `/${url}`);
  }
}
