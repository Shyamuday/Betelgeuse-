import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Service } from '../../core/models';
import { getAllServices } from '../../core/data/services-data';
import { ServiceCardComponent } from '../../shared/components';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [ServiceCardComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent implements OnInit {
  services = signal<Service[]>([]);

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadServices();
  }

  navigateToService(serviceId: string) {
    this.router.navigate(['/services', serviceId]);
  }

  private loadServices() {
    this.services.set(getAllServices());
  }
}
