import { Component } from '@angular/core';

@Component({
  selector: 'app-home-treatments-section',
  template: `
    <section class="content-grid three">
      <article class="panel treatment-card">
        <h2>Hair fall care</h2>
        <p>Structured online consultation for hair fall, dandruff, scalp issues, and follow-up guidance.</p>
        <a href="/treatments/hair-fall">Explore treatment</a>
      </article>
      <article class="panel treatment-card">
        <h2>Skin care</h2>
        <p>Care for recurring skin sensitivity, acne, pigmentation, and allergy-related concerns.</p>
        <a href="/treatments/skin-care">Explore treatment</a>
      </article>
      <article class="panel treatment-card">
        <h2>Chronic care</h2>
        <p>Long-running symptom support with deeper history review and continuity-focused guidance.</p>
        <a href="/chronic-care">Explore care path</a>
      </article>
    </section>
  `
})
export class HomeTreatmentsSectionComponent { }
