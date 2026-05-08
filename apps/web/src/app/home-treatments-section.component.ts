import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-treatments-section',
  imports: [RouterLink],
  template: `
    <!-- Stats Section -->
    <section class="stats-section">
      <div class="stat-card">
        <span class="stat-number">5,000+</span>
        <span class="stat-label">Consultations completed</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">12+</span>
        <span class="stat-label">Experienced doctors</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">4.8★</span>
        <span class="stat-label">Patient rating</span>
      </div>
      <div class="stat-card">
        <span class="stat-number">92%</span>
        <span class="stat-label">Follow-up compliance</span>
      </div>
    </section>

    <!-- Treatment Cards -->
    <section class="content-grid two">
      <article class="panel treatment-card featured-card">
        <div class="card-badge">Primary focus</div>
        <div class="card-icon">🩺</div>
        <h2>Chronic & recurring homoeopathic care</h2>
        <p>
          Long-running conditions need whole-person intake, individualized prescribing where appropriate, and follow-up —
          consistent with structured homeopathic case management rather than episodic dispensing.
        </p>
        <ul class="feature-list">
          <li>Structured symptom & lifestyle intake</li>
          <li>Doctor-led remedy planning & review</li>
          <li>Follow-ups for response and dosing</li>
        </ul>
        <a routerLink="/chronic-care" class="card-link">Explore chronic care →</a>
      </article>
      <article class="panel treatment-card">
        <div class="card-badge secondary-badge">Also available</div>
        <div class="card-icon">💊</div>
        <h2>Condition-specific pathways</h2>
        <p>
          Guided care for hair, skin, respiratory tendency, piles, renal colic tendencies, and more — documented with
          the same escalation and referral discipline as our chronic-care model.
        </p>
        <ul class="feature-list">
          <li>Dermatological & recurrent skin tendency</li>
          <li>Hair fall & related patterns</li>
          <li>Other guideline-led treatment pages</li>
        </ul>
        <a routerLink="/treatments" class="card-link">View all treatments →</a>
      </article>
    </section>
  `
})
export class HomeTreatmentsSectionComponent { }
