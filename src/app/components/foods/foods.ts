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

export interface AddFoodEvent {
  food: Food;
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
        <div class="foods-list">
          @if (isLoading()) {
            <div class="loading-message">
              <p>Loading foods...</p>
            </div>
          } @else if (foods().length === 0) {
            <div class="food-item placeholder-item">
              <span class="food-description">{{ '{' }}food count: 0{{ '}' }}</span>
            </div>
          } @else {
            @for (food of foods(); track food.id; let i = $index) {
              <div
                class="food-item"
                [class.selected]="selectedIndex() === i"
                (click)="selectFood(i)"
                (touchstart)="onTouchStart($event, i)"
                (touchmove)="onTouchMove($event, i)"
                (touchend)="onTouchEnd($event, i)"
                tabindex="0"
                role="button"
                [attr.aria-label]="food.description">
                <span class="food-description">{{ food.description }}</span>
              </div>
            }
          }
        </div>
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
  addFood = output<AddFoodEvent>();

  // Internal state
  searchQuery = '';
  maxCount = 50;
  foods = signal<Food[]>([]);
  selectedIndex = signal<number>(-1);
  isLoading = signal<boolean>(false);

  // Double-click/tap detection
  private lastTapTime = 0;
  private lastTapIndex = -1;
  private readonly doubleTapDelay = 300;  // 300ms between taps

  // Swipe detection
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private swipingIndex = -1;
  private readonly swipeThreshold = 0.35;  // 35% of element width
  private readonly swipeTimeLimit = 500;  // Max 500ms for swipe

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

    // Check for double-click/tap
    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - this.lastTapTime;
    const isDoubleTap =
      index === this.lastTapIndex &&
      timeSinceLastTap < this.doubleTapDelay;

    if (isDoubleTap) {
      // Double-click/tap detected - add to selected foods
      const food = foodList[index];
      console.log('Double-tap detected, adding food:', food.description);
      this.addFood.emit({ food });

      // Reset double-tap detection
      this.lastTapTime = 0;
      this.lastTapIndex = -1;
    } else {
      // Single click/tap - select the food
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

      // Update double-tap detection
      this.lastTapTime = currentTime;
      this.lastTapIndex = index;
    }
  }

  onTouchStart(event: TouchEvent, index: number): void {
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.touchStartTime = Date.now();
    this.swipingIndex = index;
  }

  onTouchMove(event: TouchEvent, index: number): void {
    if (this.swipingIndex !== index) {
      return;
    }

    const touch = event.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = Math.abs(touch.clientY - this.touchStartY);

    // If moving more vertically than horizontally, cancel swipe (allow scroll)
    if (deltaY > Math.abs(deltaX)) {
      this.swipingIndex = -1;
      return;
    }

    // Prevent default to stop scrolling during horizontal swipe
    if (Math.abs(deltaX) > 10) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent, index: number): void {
    if (this.swipingIndex !== index) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    const deltaTime = Date.now() - this.touchStartTime;

    // Get the element width to calculate threshold
    const target = event.target as HTMLElement;
    const foodItem = target.closest('.food-item') as HTMLElement;
    const elementWidth = foodItem?.offsetWidth || 0;

    // Check if it's a valid swipe right
    const isSwipeRight =
      deltaX > elementWidth * this.swipeThreshold &&
      deltaY < 50 &&  // Not too much vertical movement
      deltaTime < this.swipeTimeLimit;

    if (isSwipeRight) {
      const foodList = this.foods();
      if (index >= 0 && index < foodList.length) {
        const food = foodList[index];
        console.log('Swipe right detected, adding food:', food.description);
        this.addFood.emit({ food });
      }
    }

    // Reset swipe detection
    this.swipingIndex = -1;
  }
}
