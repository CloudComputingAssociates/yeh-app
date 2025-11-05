// src/app/components/foods/foods.ts
import { Component, ChangeDetectionStrategy, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FoodsService } from '../../services/foods.service';
import { Food } from '../../models/food.model';
import { HttpErrorResponse } from '@angular/common/http';

export interface SelectedFoodEvent {
  food: Food;
  description: string;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

@Component({
  selector: 'app-foods',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="foods-container">
      <!-- Search Mode UI -->
      @if (mode() === 'search') {
        <div class="search-controls">
          <input
            type="text"
            class="search-input"
            [(ngModel)]="searchQuery"
            (keydown.enter)="performSearch()"
            placeholder="Search food..."
            [disabled]="isLoading()" />

          <input
            type="number"
            class="max-count-input"
            [(ngModel)]="maxCount"
            placeholder="Max"
            min="1"
            max="100"
            [disabled]="isLoading()" />

          <button
            class="search-btn"
            (click)="performSearch()"
            [disabled]="isLoading() || !searchQuery.trim()"
            aria-label="Search">
            <mat-icon>keyboard_return</mat-icon>
          </button>
        </div>
      }

      <!-- Foods List -->
      <div class="foods-list-container">
        @if (isLoading()) {
          <div class="loading-message">
            <p>Loading foods...</p>
          </div>
        } @else if (foods().length === 0) {
          <div class="empty-message">
            <p class="empty-text">{{ mode() === 'search' ? 'Search for foods to get started' : 'No foods to display' }}</p>
          </div>
        } @else {
          <div class="foods-list">
            @for (food of foods(); track food.id; let i = $index) {
              <div
                class="food-item"
                [class.selected]="selectedIndex() === i"
                (click)="selectFood(i)"
                tabindex="0"
                role="button"
                [attr.aria-label]="food.description">
                <span class="food-description">{{ food.description }}</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./foods.scss']
})
export class FoodsComponent {
  // Inputs
  mode = input<'search' | 'display'>('search');
  displayFoods = input<Food[]>([]);

  // Outputs
  selectedFood = output<SelectedFoodEvent>();

  // Internal state
  searchQuery = '';
  maxCount = 50;
  foods = signal<Food[]>([]);
  selectedIndex = signal<number>(-1);
  isLoading = signal<boolean>(false);

  constructor(private foodsService: FoodsService) {}

  performSearch(): void {
    const query = this.searchQuery.trim();
    if (!query || query.length < 2) {
      return;
    }

    this.isLoading.set(true);

    this.foodsService.searchFoods(query, this.maxCount).subscribe({
      next: (response) => {
        console.log('Food search results:', response);

        if (response && response.foods && Array.isArray(response.foods)) {
          this.foods.set(response.foods);

          // Auto-select first item
          if (response.foods.length > 0) {
            this.selectFood(0);
          } else {
            this.selectedIndex.set(-1);
          }
        } else {
          this.foods.set([]);
          this.selectedIndex.set(-1);
        }

        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Food search error:', error);
        this.foods.set([]);
        this.selectedIndex.set(-1);
        this.isLoading.set(false);

        // TODO: Show error toast/snackbar
        let errorMessage = 'Failed to search foods';
        if (error.status === 0) {
          errorMessage = 'Unable to connect to server';
        } else if (error.status === 404) {
          errorMessage = 'No foods found';
        } else if (error.status >= 500) {
          errorMessage = 'Server error occurred';
        }
        console.error(errorMessage);
      }
    });
  }

  selectFood(index: number): void {
    const foodList = this.foods();
    if (index < 0 || index >= foodList.length) {
      return;
    }

    this.selectedIndex.set(index);
    const food = foodList[index];

    // Extract nutrition info
    const nf = food.nutritionFacts;
    const event: SelectedFoodEvent = {
      food,
      description: food.description,
      protein: nf?.proteinG ?? 0,
      carbs: nf?.totalCarbohydrateG ?? 0,
      fat: nf?.totalFatG ?? 0,
      fiber: nf?.dietaryFiberG ?? 0
    };

    console.log('Food selected:', event);
    this.selectedFood.emit(event);
  }
}
