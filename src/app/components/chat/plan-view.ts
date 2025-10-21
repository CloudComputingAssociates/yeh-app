// src/app/chat/plan-view.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-plan-view',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plan-view-container">
      <div class="placeholder-content">
        <p class="placeholder-text">Plan view placeholder</p>
      </div>
    </div>
  `,
  styleUrls: ['./plan-view.scss']
})
export class PlanViewComponent {}