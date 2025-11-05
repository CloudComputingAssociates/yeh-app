// src/app/components/plan/plan.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodsComponent, SelectedFoodEvent } from '../foods/foods';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, FoodsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plan-container">
      <!-- Top 1/4 - Reserved for filters and selected food display -->
      <div class="plan-header">
        <div class="header-placeholder">
          <p class="header-text">Filters & Selected Food Display</p>
          <p class="header-subtext">(Coming soon)</p>
        </div>
      </div>

      <!-- Bottom 3/4 - Foods search component -->
      <div class="plan-foods">
        <app-foods
          [mode]="'search'"
          (selectedFood)="onFoodSelected($event)" />
      </div>
    </div>
  `,
  styleUrls: ['./plan.scss']
})
export class PlanComponent {
  onFoodSelected(event: SelectedFoodEvent): void {
    console.log('Food selected in Plan:', event);
    console.log('Description:', event.description);
    console.log('Protein:', event.protein, 'g');
    console.log('Carbs:', event.carbs, 'g');
    console.log('Fat:', event.fat, 'g');
    console.log('Fiber:', event.fiber, 'g');

    // TODO: Display this information in the top 1/4 section
    // TODO: Add to plan/meal
  }
}
