// src/app/components/selected-foods/selected-foods.ts
import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Food } from '../../models/food.model';

export interface RemoveFoodEvent {
  food: Food;
}

@Component({
  selector: 'app-selected-foods',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="selected-foods-container">
      <div class="selected-foods-list">
        @if (foods().length === 0) {
          <div class="empty-message">
            <p>No foods selected</p>
          </div>
        } @else {
          @for (food of foods(); track food.id; let i = $index) {
            <div
              class="selected-food-item"
              (click)="selectFood(i)"
              (touchstart)="onTouchStart($event, i)"
              (touchmove)="onTouchMove($event, i)"
              (touchend)="onTouchEnd($event, i)"
              tabindex="0"
              role="button"
              [attr.aria-label]="food.description">
              <mat-icon
                class="favorite-icon"
                [class.favorited]="isFavorite(food.id)"
                (click)="toggleFavorite($event, food.id)"
                aria-label="Toggle favorite">
                {{ isFavorite(food.id) ? 'star' : 'star_border' }}
              </mat-icon>
              <span class="food-description">{{ food.description }}</span>
            </div>
          }
        }
      </div>
    </div>
  `,
  styleUrls: ['./selected-foods.scss']
})
export class SelectedFoodsComponent {
  // Inputs
  foods = input<Food[]>([]);

  // Outputs
  removeFood = output<RemoveFoodEvent>();

  // Internal state
  favorites = signal<Set<number>>(new Set());

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

  constructor() {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    const stored = localStorage.getItem('food-favorites');
    if (stored) {
      try {
        const arr = JSON.parse(stored) as number[];
        this.favorites.set(new Set(arr));
      } catch (e) {
        console.error('Failed to load favorites:', e);
      }
    }
  }

  private saveFavorites(): void {
    const arr = Array.from(this.favorites());
    localStorage.setItem('food-favorites', JSON.stringify(arr));
  }

  isFavorite(foodId: number): boolean {
    return this.favorites().has(foodId);
  }

  toggleFavorite(event: Event, foodId: number): void {
    event.stopPropagation(); // Prevent removing the food
    const favs = new Set(this.favorites());
    if (favs.has(foodId)) {
      favs.delete(foodId);
    } else {
      favs.add(foodId);
    }
    this.favorites.set(favs);
    this.saveFavorites();
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
      // Double-click/tap detected - remove from selected foods
      const food = foodList[index];
      console.log('Double-tap detected, removing food:', food.description);
      this.removeFood.emit({ food });

      // Reset double-tap detection
      this.lastTapTime = 0;
      this.lastTapIndex = -1;
    } else {
      // Single click/tap - just update timing for double-tap detection
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
    const foodItem = target.closest('.selected-food-item') as HTMLElement;
    const elementWidth = foodItem?.offsetWidth || 0;

    // Check if it's a valid swipe LEFT (negative deltaX)
    const isSwipeLeft =
      deltaX < -(elementWidth * this.swipeThreshold) &&
      deltaY < 50 &&  // Not too much vertical movement
      deltaTime < this.swipeTimeLimit;

    if (isSwipeLeft) {
      const foodList = this.foods();
      if (index >= 0 && index < foodList.length) {
        const food = foodList[index];
        console.log('Swipe left detected, removing food:', food.description);
        this.removeFood.emit({ food });
      }
    }

    // Reset swipe detection
    this.swipingIndex = -1;
  }
}
