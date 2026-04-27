import { Component } from '@angular/core';

@Component({
  selector: 'app-home-treatments-section',
  template: `
    <section class="content-grid two">
      <article class="panel treatment-card">
        <h2>Chronic care</h2>
        <p>Long-running symptom support with deeper history review and continuity-focused guidance.</p>
        <a href="/chronic-care">Explore care path</a>
      </article>
      <article class="panel treatment-card">
        <h2>All treatments</h2>
        <p>Browse all available consultation categories and pick the care path that fits your concern.</p>
        <a href="/treatments">Explore all treatments</a>
      </article>
    </section>
  `
})
export class HomeTreatmentsSectionComponent { }
