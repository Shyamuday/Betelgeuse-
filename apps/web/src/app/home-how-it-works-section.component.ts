import { Component } from '@angular/core';

@Component({
  selector: 'app-home-how-it-works-section',
  template: `
    <section class="content-grid three">
      <article class="panel">
        <p class="eyebrow">Step 1</p>
        <h2>Share your concern</h2>
        <p>Start with a short symptom intake so our team understands your case quickly.</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Step 2</p>
        <h2>Get doctor guidance</h2>
        <p>Internal assignment ensures the right doctor picks up your consultation and follows through.</p>
      </article>
      <article class="panel">
        <p class="eyebrow">Step 3</p>
        <h2>Continue follow-up</h2>
        <p>Track progress through secure chat, prescription notes, and planned follow-up.</p>
      </article>
    </section>
  `
})
export class HomeHowItWorksSectionComponent { }
