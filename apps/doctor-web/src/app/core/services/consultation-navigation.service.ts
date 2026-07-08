import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ROUTE_PATHS } from '../constants/app-routes.constants';

export type PrescriptionTab = 'context' | 'setup' | 'remedies' | 'review';

export type ConsultationHandoffParams = {
  consultationId: string;
  caseAnalysisId?: string | null;
  remedy?: string | null;
  companionRemedy?: string | null;
  advice?: string | null;
  diagnosis?: string | null;
  methodOptionId?: string | null;
  tab?: PrescriptionTab | null;
  rubricId?: string | null;
  rubricQuery?: string | null;
};

export type WorklistSection = 'ASSIGNED' | 'IN_PROGRESS' | 'FOLLOW_UP_DUE';

@Injectable({ providedIn: 'root' })
export class ConsultationNavigationService {
  private readonly router = inject(Router);

  caseAnalysisCommands(consultationId: string, extras?: Partial<ConsultationHandoffParams>) {
    return ['/', ROUTE_PATHS.CASE_ANALYSIS, consultationId, 'case-analysis'] as const;
  }

  caseAnalysisQueryParams(extras?: Partial<ConsultationHandoffParams>) {
    const params: Record<string, string> = {};
    if (extras?.caseAnalysisId) params['caseAnalysisId'] = extras.caseAnalysisId;
    if (extras?.rubricId) params['rubricId'] = extras.rubricId;
    if (extras?.rubricQuery) params['rubricQuery'] = extras.rubricQuery;
    return Object.keys(params).length ? params : null;
  }

  prescriptionCommands(consultationId: string) {
    return ['/', ROUTE_PATHS.CASE_ANALYSIS, consultationId, 'prescription'] as const;
  }

  prescriptionQueryParams(extras?: Partial<ConsultationHandoffParams>) {
    const params: Record<string, string> = {};
    if (extras?.caseAnalysisId) params['caseAnalysisId'] = extras.caseAnalysisId;
    if (extras?.remedy) params['remedy'] = extras.remedy;
    if (extras?.companionRemedy) params['companionRemedy'] = extras.companionRemedy;
    if (extras?.advice) params['advice'] = extras.advice;
    if (extras?.diagnosis) params['diagnosis'] = extras.diagnosis;
    if (extras?.methodOptionId) params['methodOptionId'] = extras.methodOptionId;
    if (extras?.tab) params['tab'] = extras.tab;
    return Object.keys(params).length ? params : null;
  }

  async openCaseAnalysis(consultationId: string, extras?: Partial<ConsultationHandoffParams>) {
    await this.router.navigate(this.caseAnalysisCommands(consultationId), {
      queryParams: this.caseAnalysisQueryParams(extras) ?? undefined,
    });
  }

  async openPrescription(consultationId: string, extras?: Partial<ConsultationHandoffParams>) {
    await this.router.navigate(this.prescriptionCommands(consultationId), {
      queryParams: this.prescriptionQueryParams(extras) ?? undefined,
    });
  }

  async openPrescriptionContext(consultationId: string, caseAnalysisId?: string | null) {
    await this.openPrescription(consultationId, { caseAnalysisId, tab: 'context' });
  }

  async openRepertoryBrowser(consultationId?: string | null, caseAnalysisId?: string | null) {
    await this.router.navigate(['/', ROUTE_PATHS.REPERTORY_BROWSER], {
      queryParams: {
        ...(consultationId ? { consultationId } : {}),
        ...(caseAnalysisId ? { caseAnalysisId } : {}),
      },
    });
  }

  primaryActionForSection(section: WorklistSection): 'case' | 'prescribe' {
    if (section === 'ASSIGNED') return 'case';
    return 'prescribe';
  }

  isConsultationWorkspaceUrl(url: string) {
    const path = url.split('?')[0];
    return (
      (path.includes(`/${ROUTE_PATHS.CASE_ANALYSIS}/`) && path.endsWith('/case-analysis')) ||
      (path.includes(`/${ROUTE_PATHS.CASE_ANALYSIS}/`) && path.endsWith('/prescription')) ||
      (path.endsWith(`/${ROUTE_PATHS.APPOINTMENTS}`) && /[?&]consultationId=/.test(url))
    );
  }

  resolveNotificationRoute(
    data: Record<string, string>,
  ): { commands: readonly string[]; queryParams?: Record<string, string> } | null {
    const consultationId = data['consultationId'];
    if (!consultationId) {
      return data['route'] ? { commands: [data['route']] } : null;
    }

    const kind = (data['kind'] || data['type'] || data['consultationMode'] || '').toUpperCase();
    if (kind.includes('INSTANT') || kind.includes('ONLINE')) {
      return {
        commands: ['/', ROUTE_PATHS.ONLINE_DOCTOR] as const,
        queryParams: { consultationId },
      };
    }
    if (kind.includes('FOLLOW') || kind.includes('PRESCRIBE') || data['action'] === 'prescribe') {
      return {
        commands: this.prescriptionCommands(consultationId),
        queryParams:
          this.prescriptionQueryParams({
            caseAnalysisId: data['caseAnalysisId'],
          }) ?? undefined,
      };
    }

    return {
      commands: this.caseAnalysisCommands(consultationId),
      queryParams:
        this.caseAnalysisQueryParams({
          caseAnalysisId: data['caseAnalysisId'],
        }) ?? undefined,
    };
  }
}
