// src/app/components/plan/plan.ts
import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FoodsComponent, SelectedFoodEvent, AddFoodEvent } from '../foods/foods';
import { SelectedFoodsComponent } from '../selected-foods/selected-foods';
import { Food } from '../../models/food.model';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [CommonModule, FoodsComponent, SelectedFoodsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plan-container">
      <!-- Top 1/4 - Reserved for filters and selected food display -->
      <div class="plan-header">
        <div class="header-placeholder">
          <p class="header-text">Filters & Selected Food Display</p>
          <p class="header-subtext">(Coming soon)</p>
        </div>

        <!-- Blue description label at bottom of header -->
        @if (selectedDescription()) {
          <div class="selected-description">
            {{ selectedDescription() }}
          </div>
        }
      </div>

      <!-- Bottom 3/4 - Foods search component (left) and selected foods (right) -->
      <div class="plan-foods">
        <app-foods
          [mode]="'search'"
          (selectedFood)="onFoodSelected($event)"
          (addFood)="onAddFood($event)" />

        <app-selected-foods [foods]="selectedFoods()" />
      </div>
    </div>
  `,
  styleUrls: ['./plan.scss']
})
export class PlanComponent {
  selectedDescription = signal<string>('');
  selectedFoods = signal<Food[]>([]);

  onFoodSelected(event: SelectedFoodEvent): void {
    console.log('Food selected in Plan:', event);
    console.log('Description:', event.description);
    console.log('Protein:', event.protein, 'g');
    console.log('Carbs:', event.carbs, 'g');
    console.log('Fat:', event.fat, 'g');
    console.log('Fiber:', event.fiber, 'g');

    // Update the selected description
    this.selectedDescription.set(event.description);
  }

  onAddFood(event: AddFoodEvent): void {
    this.addToSelectedFoods(event.food);
  }

  private addToSelectedFoods(food: Food): void {
    // Check if food is already in selected foods (prevent duplicates)
    const currentFoods = this.selectedFoods();
    const alreadyExists = currentFoods.some(f => f.id === food.id);

    if (!alreadyExists) {
      this.selectedFoods.set([...currentFoods, food]);
      console.log('Added food to selected foods:', food.description);
    } else {
      console.log('Food already in selected foods:', food.description);
    }
  }
}
