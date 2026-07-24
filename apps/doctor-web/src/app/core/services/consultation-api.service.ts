import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_PATHS } from '../constants/api-paths.constants';
import type {
  ConsultationMessage,
  ConsultationSessionNote,
  DoctorConsultation,
} from '../types/consultation.types';

@Service()
export class ConsultationApiService {
  private readonly apiBase = environment.apiUrl;
  private readonly http = inject(HttpClient);

  loadConsultation(consultationId: string) {
    return firstValueFrom(
      this.http.get<{ consultation: DoctorConsultation }>(
        `${this.apiBase}${API_PATHS.CONSULTATIONS}/${consultationId}`,
      ),
    ).then((response) => response.consultation);
  }

  sendMessage(consultationId: string, body: string) {
    return firstValueFrom(
      this.http.post<{ message: ConsultationMessage }>(
        `${this.apiBase}${API_PATHS.CONSULTATIONS}/${consultationId}/messages`,
        {
          body,
        },
      ),
    ).then((response) => response.message);
  }

  loadSessionNotes(consultationId: string) {
    return firstValueFrom(
      this.http.get<{ notes: ConsultationSessionNote[] }>(
        `${this.apiBase}${API_PATHS.CONSULTATIONS}/${consultationId}/session-notes`,
      ),
    ).then((response) => response.notes);
  }

  addSessionNote(consultationId: string, note: string) {
    return firstValueFrom(
      this.http.post<{ note: ConsultationSessionNote }>(
        `${this.apiBase}${API_PATHS.CONSULTATIONS}/${consultationId}/session-notes`,
        { note },
      ),
    ).then((response) => response.note);
  }
}
