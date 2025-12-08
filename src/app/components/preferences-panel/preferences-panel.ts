// src/app/components/preferences-panel/preferences-panel.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabService } from '../../services/tab.service';
import { NotificationService } from '../../services/notification.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { FoodsComponent, SelectedFoodEvent, AddFoodEvent } from '../foods/foods';
import { SelectedFoodsComponent, RemoveFoodEvent } from '../selected-foods/selected-foods';
import { Food } from '../../models/food.model';

@Component({
  selector: 'app-preferences-panel',
  imports: [CommonModule, FormsModule, FoodsComponent, SelectedFoodsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="panel-container">
      <div class="panel-header">
        <h2 class="panel-title">Preferences</h2>
        <button class="close-btn" (click)="close()">Close</button>
      </div>

      <div class="panel-content">
        <div class="settings-section">
          <h3 class="section-title">Food Search</h3>
          <label class="checkbox-setting">
            <input
              type="checkbox"
              [checked]="userSettings.yehApprovedFoodsOnly()"
              (change)="onYehApprovedChange($event)" />
            <span class="checkbox-label">YEH Approved Foods Only</span>
          </label>
          <p class="setting-description">When enabled, food searches will default to showing only YEH-approved foods.</p>
        </div>

        <!-- Favorites & Restricted Foods Section -->
        <div class="foods-section">
          <h3 class="section-title">Favorites & Restricted Foods</h3>
          <div class="foods-panel">
            <app-foods
              [mode]="'search'"
              [showAiButton]="false"
              (selectedFood)="onFoodSelected($event)"
              (addFood)="onAddFood($event)" />

            <app-selected-foods
              [foods]="selectedFoods()"
              (removeFood)="onRemoveFood($event)" />
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./preferences-panel.scss']
})
export class PreferencesPanelComponent {
  private tabService = inject(TabService);
  private notificationService = inject(NotificationService);
  protected userSettings = inject(UserSettingsService);

  // State for foods selection
  selectedFoods = signal<Food[]>([]);

  close(): void {
    this.tabService.closeTab('preferences');
  }

  onYehApprovedChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.userSettings.setYehApprovedFoodsOnly(checked);
    this.notificationService.show('Setting saved');
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
