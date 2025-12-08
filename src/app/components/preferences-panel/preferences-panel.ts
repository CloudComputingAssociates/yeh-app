// src/app/components/preferences-panel/preferences-panel.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabService } from '../../services/tab.service';
import { FoodsComponent, SelectedFoodEvent, AddFoodEvent } from '../foods/foods';
import { SelectedFoodsComponent, RemoveFoodEvent } from '../selected-foods/selected-foods';
import { Food } from '../../models/food.model';

@Component({
  selector: 'app-preferences-panel',
  imports: [CommonModule, FoodsComponent, SelectedFoodsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-container">
      <div class="panel-header">
        <h2 class="panel-title">Preferences</h2>
        <button class="close-btn" (click)="close()">Close</button>
      </div>

      <div class="panel-content">
        <div class="foods-section">
          <div class="foods-panel">
            <div class="picker-column">
              <h3 class="column-title">FOOD PICKER</h3>
              <app-foods
                [mode]="'search'"
                [showAiButton]="false"
                [showPreferenceIcons]="true"
                [showFilterRadios]="true"
                (selectedFood)="onFoodSelected($event)"
                (addFood)="onAddFood($event)" />
            </div>

            <div class="selected-column">
              <h3 class="column-title">MY FOODS</h3>
              <app-selected-foods
                [foods]="selectedFoods()"
                (removeFood)="onRemoveFood($event)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./preferences-panel.scss']
})
export class PreferencesPanelComponent {
  private tabService = inject(TabService);

  // State for foods selection
  selectedFoods = signal<Food[]>([]);

  close(): void {
    this.tabService.closeTab('preferences');
  }

  onFoodSelected(event: SelectedFoodEvent): void {
    console.log('Food selected in Preferences:', event.description);
  }

  onAddFood(event: AddFoodEvent): void {
    this.addToSelectedFoods(event.food);
  }

  onRemoveFood(event: RemoveFoodEvent): void {
    this.removeFromSelectedFoods(event.food);
  }

  private addToSelectedFoods(food: Food): void {
    const currentFoods = this.selectedFoods();
    const alreadyExists = currentFoods.some(f => f.id === food.id);

    if (!alreadyExists) {
      this.selectedFoods.set([...currentFoods, food]);
      console.log('Added food to preferences list:', food.description);
    }
  }

  private removeFromSelectedFoods(food: Food): void {
    const currentFoods = this.selectedFoods();
    const updatedFoods = currentFoods.filter(f => f.id !== food.id);
    this.selectedFoods.set(updatedFoods);
    console.log('Removed food from preferences list:', food.description);
  }
}
