import { CommonModule } from '@angular/common';

import { Component, signal } from '@angular/core';

import { form, FormField } from '@angular/forms/signals';

import { AdminApi } from '../../../core/services/admin-api';

import { ANALYTICS_WINDOW_OPTIONS } from '../constants/analytics.constants';



type FunnelStep = {

  key: string;

  label: string;

  total: number;

  uniqueActors: number;

  conversionFromStart: number;

  conversionFromPrevious: number;

};



type AnalyticsReport = {

  windowDays: number;

  summary: {

    patientLogins: number;

    consultationsBooked: number;

    paymentsCompleted: number;

    prescriptionsPublished: number;

    dosesTaken: number;

    doctorWorklistViews: number;

  };

  funnel: FunnelStep[];

  dailyTrend: Array<{

    date: string;

    consultationBooked: number;

    paymentCompleted: number;

    prescriptionPublished: number;

    doseTaken: number;

  }>;

};



@Component({

  selector: 'app-analytics-page',

  imports: [CommonModule, FormField],

  templateUrl: './analytics-page.html',

  styleUrl: './analytics-page.scss'

})

export class AnalyticsPage {

  readonly windowOptions = ANALYTICS_WINDOW_OPTIONS;



  readonly filterModel = signal({ windowDays: '30' });

  readonly filterForm = form(this.filterModel);

  readonly report = signal<AnalyticsReport | null>(null);

  readonly loading = signal(false);

  readonly error = signal('');



  constructor(private readonly api: AdminApi) {

    void this.load();

  }



  async load() {

    this.loading.set(true);

    this.error.set('');

    try {

      this.report.set((await this.api.getAnalyticsFunnels({

        days: Number(this.filterModel().windowDays)

      })) as AnalyticsReport);

    } catch {

      this.error.set('Could not load product analytics.');

      this.report.set(null);

    } finally {

      this.loading.set(false);

    }

  }



  applyFilters() {

    void this.load();

  }

}


