import { Injectable } from '@angular/core';
import { ClinicApiClient } from '../../clinic-api/clinic-api.client';
import { API_PATHS } from '../constants/api-paths.constants';
import { WHATSAPP_CONTACT_URL } from '../constants/branding.constants';

export type PublicConfig = {
  whatsappPhone: string;
  clinicName: string;
  statConsultations: string;
  statDoctors: string;
  statRating: string;
  statFollowUp: string;
  statPatientsTreated: string;
  statConditionsTreated: string;
  statImprovement: string;
  statSatisfaction: string;
};

const FALLBACK: PublicConfig = {
  whatsappPhone: '919876543210',
  clinicName: 'Vitalis Care and Research Centre',
  statConsultations: '5,000+',
  statDoctors: '12+',
  statRating: '4.8★',
  statFollowUp: '92%',
  statPatientsTreated: '4,800+',
  statConditionsTreated: '15+',
  statImprovement: '92%',
  statSatisfaction: '4.8 / 5'
};

@Injectable({ providedIn: 'root' })
export class PublicConfigService {
  private readonly client = new ClinicApiClient();
  private cached: PublicConfig | null = null;
  private loading: Promise<PublicConfig> | null = null;

  async get(): Promise<PublicConfig> {
    if (this.cached) return this.cached;
    if (!this.loading) {
      this.loading = this.client
        .get<{ config: PublicConfig }>(API_PATHS.PUBLIC_CONFIG)
        .then((r: { config: PublicConfig }) => {
          this.cached = { ...FALLBACK, ...r.config };
          return this.cached;
        })
        .catch(() => FALLBACK as PublicConfig);
    }
    return this.loading!;
  }

  whatsappUrl(config: PublicConfig): string {
    const phone = config.whatsappPhone || FALLBACK.whatsappPhone;
    return `https://wa.me/${phone}?text=Hi%20Vitalis%20Care%2C%20I%20would%20like%20to%20know%20more%20about%20your%20services.`;
  }
}
