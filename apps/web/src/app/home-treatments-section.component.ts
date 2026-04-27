import { Component } from '@angular/core';

@Component({
  selector: 'app-home-treatments-section',
  template: `
    <section class="content-grid two">
      <article class="panel treatment-card">
        <p class="eyebrow">Primary focus</p>
        <h2>Chronic and recurring care</h2>
        <p>Dedicated support for long-running symptoms with deeper case history, continuity, and guided follow-up.</p>
        <a href="/chronic-care">Explore chronic care</a>
      </article>
      <article class="panel treatment-card">
        <p class="eyebrow">Also available</p>
        <h2>Other treatment categories</h2>
        <p>You can still explore our broader care programs for skin, lifestyle-linked, and condition-specific concerns.</p>
        <a href="/treatments">View all treatments</a>
      </article>
    </section>
  `
})
export class HomeTreatmentsSectionComponent { }
