import { Component } from '@angular/core';
import { PatientIdCardComponent } from '../shared/patient-id-card/patient-id-card.component';

@Component({
  selector: 'app-patient-account-card-page',
  standalone: true,
  imports: [PatientIdCardComponent],
  templateUrl: './patient-account-card-page.component.html',
  styleUrl: './patient-account-card-page.component.scss'
})
export class PatientAccountCardPageComponent {}
