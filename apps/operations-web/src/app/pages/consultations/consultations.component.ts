import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { API_PATHS } from '../../core/constants/api-paths.constants';
import { RecentConsultationsData } from '../../models';

@Component({
  selector: 'app-consultations',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './consultations.component.html',
  styleUrl: './consultations.component.scss'
})
export class ConsultationsComponent {
  readonly consultationsResource = httpResource<RecentConsultationsData>(
    () => `${environment.apiUrl}${API_PATHS.CALL_CENTER.RECENT_CONSULTATIONS}`
  );

  loading = () => this.consultationsResource.isLoading();
  error = () =>
    this.consultationsResource.status() === 'error' ? 'Could not load consultations.' : '';
  consultations = () => this.consultationsResource.value()?.consultations ?? [];

  reload(): void {
    this.consultationsResource.reload();
  }
}
