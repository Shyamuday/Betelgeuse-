import { Component } from '@angular/core';

@Component({
  selector: 'app-home-how-it-works-section',
  template: `
    <section class="how-it-works-section">
      <div class="section-header">
        <p class="eyebrow">How it works</p>
        <h2 class="section-title">Simple, structured care in 3 steps</h2>
        <p class="section-subtitle">
          Homoeopathic care depends on coherent history-taking and follow-up responses — digital tools here support those
          steps under doctor supervision.
        </p>
      </div>

      <div class="steps-grid">
        <article class="step-card">
          <div class="step-number">1</div>
          <div class="step-icon">📋</div>
          <h3>Structured history</h3>
          <p>Cover duration, modalities, thirst, temperament, aggravations, past treatments — the kind of fields homoeopathic case-taking relies on.</p>
        </article>
        
        <div class="step-connector"></div>
        
        <article class="step-card">
          <div class="step-number">2</div>
          <div class="step-icon">👨‍⚕️</div>
          <h3>Doctor review & prescribing</h3>
          <p>Assigned doctors reconcile your narrative with indications, escalation rules, and an individualized prescribing plan appropriate to chronic care.</p>
        </article>
        
        <div class="step-connector"></div>
        
        <article class="step-card">
          <div class="step-number">3</div>
          <div class="step-icon">📈</div>
          <h3>Follow-up & remedy response</h3>
          <p>Secure messaging, prescription updates, and check-ins geared to judging remedy response safely over time.</p>
        </article>
      </div>
    </section>
  `
})
export class HomeHowItWorksSectionComponent { }
