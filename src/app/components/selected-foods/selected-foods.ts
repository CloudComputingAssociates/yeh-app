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
      <div
        class="selected-foods-list"
        (keydown)="onKeyDown($event)"
        tabindex="0">
        @if (foods().length === 0) {
          <div class="empty-message">
            <p>No foods selected</p>
          </div>
        } @else {
          @for (food of foods(); track food.id; let i = $index) {
            <div
              class="selected-food-item"
              [class.selected]="selectedIndex() === i"
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
              <mat-icon
                class="restricted-icon"
                [class.restricted]="isRestricted(food.id)"
                (click)="toggleRestricted($event, food.id)"
                aria-label="Toggle restricted">
                block
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
  restricted = signal<Set<number>>(new Set());
  selectedIndex = signal<number>(-1);

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
    this.loadRestricted();
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

  private loadRestricted(): void {
    const stored = localStorage.getItem('food-restricted');
    if (stored) {
      try {
        const arr = JSON.parse(stored) as number[];
        this.restricted.set(new Set(arr));
      } catch (e) {
        console.error('Failed to load restricted:', e);
      }
    }
  }

  private saveRestricted(): void {
    const arr = Array.from(this.restricted());
    localStorage.setItem('food-restricted', JSON.stringify(arr));
  }

  isFavorite(foodId: number): boolean {
    return this.favorites().has(foodId);
  }

  isRestricted(foodId: number): boolean {
    return this.restricted().has(foodId);
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

  toggleRestricted(event: Event, foodId: number): void {
    event.stopPropagation(); // Prevent removing the food
    const rest = new Set(this.restricted());
    if (rest.has(foodId)) {
      rest.delete(foodId);
    } else {
      rest.add(foodId);
    }
    this.restricted.set(rest);
    this.saveRestricted();
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
      // Single click/tap - select the item and update timing for double-tap detection
      this.selectedIndex.set(index);
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

  onKeyDown(event: KeyboardEvent): void {
    const foodList = this.foods();
    if (foodList.length === 0) {
      return;
    }

    const currentIndex = this.selectedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault(); // Prevent scrolling
        if (currentIndex < foodList.length - 1) {
          this.selectedIndex.set(currentIndex + 1);
          this.scrollToIndex(currentIndex + 1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault(); // Prevent scrolling
        if (currentIndex > 0) {
          this.selectedIndex.set(currentIndex - 1);
          this.scrollToIndex(currentIndex - 1);
        } else if (currentIndex === -1 && foodList.length > 0) {
          // If nothing selected, select the first item
          this.selectedIndex.set(0);
          this.scrollToIndex(0);
        }
        break;

      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < foodList.length) {
          // Delete/Backspace key removes from selected foods
          const food = foodList[currentIndex];
          console.log('Delete key pressed, removing food:', food.description);
          this.removeFood.emit({ food });

          // Adjust selection after removal
          if (currentIndex >= foodList.length - 1) {
            // If we removed the last item, select the new last item
            this.selectedIndex.set(Math.max(0, foodList.length - 2));
          }
          // Otherwise selection stays at same index (which will be the next item)
        }
        break;
    }
  }

  private scrollToIndex(index: number): void {
    // Scroll the selected item into view
    setTimeout(() => {
      const foodItems = document.querySelectorAll('.selected-food-item');
      if (foodItems[index]) {
        foodItems[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 0);
  }
}
