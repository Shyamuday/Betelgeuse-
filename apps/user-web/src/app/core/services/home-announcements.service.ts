import { Injectable, inject } from '@angular/core';
import { ClinicApiClient } from '../../clinic-api/clinic-api.client';
import { API_PATHS } from '../constants/api-paths.constants';

export type HomeAnnouncement = {
  id: string;
  text: string;
  linkLabel?: string | null;
  linkUrl?: string | null;
};

@Injectable({ providedIn: 'root' })
export class HomeAnnouncementsService {
  private readonly client = inject(ClinicApiClient);
  private announcements: HomeAnnouncement[] | null = null;

  async list() {
    if (this.announcements) return this.announcements;
    try {
      const res = await this.client.get<{ announcements: HomeAnnouncement[] }>(
        API_PATHS.HOME_ANNOUNCEMENTS,
      );
      this.announcements = res.announcements || [];
      return this.announcements;
    } catch {
      this.announcements = [];
      return this.announcements;
    }
  }
}
