import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-safety-faq-section',
  imports: [RouterLink],
  template: `
    <section class="content-grid two">
      <article class="panel warning-panel">
        <h2>Safety first</h2>
        <p>
          This platform is not for emergencies. Severe pain, breathing trouble, heavy bleeding, or sudden worsening
          symptoms require immediate offline medical care.
        </p>
        <a routerLink="/safety">Read full safety guidance</a>
      </article>
      <article class="panel">
        <h2>Common questions</h2>
        <p>Learn how assignments work, what to expect after payment, how homoeopathic follow-up is paced, and when we escalate offline.</p>
        <p class="muted home-faq-deeper-link">
          For methodology and escalation logic,
          <a routerLink="/why-successful" class="card-link">
            structured homoeopathy overview →</a>
        </p>
        <a routerLink="/faq">View FAQ</a>
      </article>
    </section>
  `
})
export class HomeSafetyFaqSectionComponent { }
