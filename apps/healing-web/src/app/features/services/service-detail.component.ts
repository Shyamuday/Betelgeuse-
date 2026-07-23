import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Service } from '../../core/models';
import { ServiceInquiryComponent } from '../../shared/components';
import { SEOService } from '../../core/services';
import { getServiceById } from '../../core/data/services-data';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [ServiceInquiryComponent],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss',
})
export class ServiceDetailComponent implements OnInit {
  service = signal<Service | null>(null);
  loading = signal(true);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seoService = inject(SEOService);

  constructor() {
    this.route.params.pipe(takeUntilDestroyed()).subscribe((params: any) => {
      const serviceId = params['id'];
      this.loadService(serviceId);
    });
  }

  ngOnInit() {
    // Component initialization if needed
  }

  goBack() {
    this.router.navigate(['/services']);
  }

  bookService() {
    // Navigate to contact form with service pre-selected
    this.router.navigate(['/contact'], {
      queryParams: { service: this.service()?.name },
    });
  }

  contactForInfo() {
    // Navigate to contact form with inquiry type
    this.router.navigate(['/contact'], {
      queryParams: {
        service: this.service()?.name,
        type: 'inquiry',
      },
    });
  }

  formatPrice(amount: number | undefined, currency: string | undefined): string {
    if (!amount || !currency) return '';

    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  whoThisIsFor(service: Service): string[] {
    const name = service.name.toLowerCase();

    if (name.includes('breakup')) {
      return [
        'You keep replaying the relationship',
        'No-contact feels difficult',
        'You need closure and steadier daily structure',
      ];
    }
    if (name.includes('anxiety')) {
      return [
        'Your thoughts feel fast or hard to stop',
        'You avoid situations because of fear',
        'You want practical calming tools',
      ];
    }
    if (name.includes('career') || name.includes('study')) {
      return [
        'You feel stuck between choices',
        'Pressure is affecting sleep or focus',
        'You need a small, clear next step',
      ];
    }
    if (name.includes('relationship')) {
      return [
        'Arguments keep repeating',
        'Trust or boundaries feel unclear',
        'You want to communicate without escalating',
      ];
    }
    if (name.includes('sleep')) {
      return [
        'Your mind gets loud at night',
        'You overthink conversations or decisions',
        'You want a calmer evening routine',
      ];
    }
    if (name.includes('family')) {
      return [
        'Family pressure feels heavy',
        'Boundaries are hard to hold',
        'You need help preparing a calmer conversation',
      ];
    }

    return [
      'You need a private space to talk',
      'You want emotional clarity',
      'You want one practical step after the session',
    ];
  }

  sessionFlow(): string[] {
    return [
      'Share what is happening right now',
      'Identify the main pressure point',
      'Practice one calming or clarity tool',
      'Leave with a simple next-step plan',
    ];
  }

  sessionOutcome(): string[] {
    return [
      'A clearer understanding of your concern',
      'One practical coping tool',
      'A next-step plan for the coming days',
    ];
  }

  private loadService(serviceId: string) {
    this.loading.set(true);

    setTimeout(() => {
      const foundService = getServiceById(serviceId) || null;
      this.service.set(foundService);
      this.loading.set(false);

      // Update SEO for service page
      if (foundService) {
        this.seoService.updateSEO({
          title: `${foundService.name} - Hope Hub`,
          description: foundService.detailedDescription || foundService.description,
          keywords: [
            foundService.name,
            foundService.category,
            'mental health',
            'counseling',
            'therapy',
          ],
          type: 'website',
          image: foundService.imageUrl,
        });

        // Add service structured data
        this.seoService.addServiceStructuredData({
          name: foundService.name,
          description: foundService.detailedDescription || foundService.description,
          provider: 'Hope Hub',
          areaServed: 'Worldwide',
          serviceType: 'Mental Health Counseling',
        });
      }
    }, 500);
  }
}
