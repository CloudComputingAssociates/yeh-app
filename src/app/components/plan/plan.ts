// src/app/components/plan/plan.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plan-container">
      <div class="plan-content">
        <div class="placeholder-content">
          <p class="placeholder-text">Plan view - Ready for implementation</p>
          <p class="placeholder-subtext">This is where meal/day planning will happen</p>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./plan.scss']
})
export class PlanComponent {}
