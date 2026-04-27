import { Component } from '@angular/core';

@Component({
  selector: 'app-home-how-it-works-section',
  template: `
    <section class="content-grid three">
      <article class="panel">
        <p class="eyebrow">Step 1</p>
        <h2>Share chronic history</h2>
        <p>Tell us duration, recurrence, triggers, and previous treatment details through a structured intake.</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Step 2</p>
        <h2>Doctor reviews patterns</h2>
        <p>Our internal doctor panel reviews history and symptom patterns before planning the care path.</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Step 3</p>
        <h2>Continue planned follow-up</h2>
        <p>Track progress with secure chat, prescription updates, and continuity-focused follow-up.</p>
      </article>
    </section>
  `
})
export class HomeHowItWorksSectionComponent { }
