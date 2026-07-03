import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { API_PATHS } from '../../core/constants/api-paths.constants';
import { RosterData } from '../../models';

@Component({
  selector: 'app-roster',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './roster.component.html',
  styleUrl: './roster.component.scss'
})
export class RosterComponent {
  readonly date = signal(new Date().toISOString().slice(0, 10));

  readonly rosterResource = httpResource<RosterData>(() => ({
    url: `${environment.apiUrl}${API_PATHS.CLINIC_MANAGER.ROSTER}`,
    params: { date: this.date() }
  }));

  loading = () => this.rosterResource.isLoading();
  error = () => (this.rosterResource.status() === 'error' ? 'Could not load roster.' : '');
  roster = () => (this.rosterResource.hasValue() ? this.rosterResource.value() : null);

  reload(): void {
    this.rosterResource.reload();
  }

  attendanceLabel(code: string): string {
    switch (code) {
      case 'ON_LEAVE': return 'On leave';
      case 'WEEKLY_OFF': return 'Weekly off';
      default: return 'Expected';
    }
  }
}
