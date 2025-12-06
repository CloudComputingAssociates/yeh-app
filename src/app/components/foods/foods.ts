// src/app/components/foods/foods.ts
import { Component, ChangeDetectionStrategy, signal, output, input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FoodsService } from '../../services/foods.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { NotificationService } from '../../services/notification.service';
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
            (ngModelChange)="onSearchQueryChange($event)"
            (keydown.enter)="performSearch()"
            placeholder="Search food..."
            [disabled]="isLoading()" />

          <button
            class="search-btn"
            (click)="performSearch()"
            [disabled]="isLoading() || !canSearch()"
            aria-label="Search">
            <mat-icon>keyboard_return</mat-icon>
          </button>
        </div>

        <!-- YEH Approved checkbox -->
        <div class="yeh-approved-row">
          <label class="checkbox-control">
            <input
              type="checkbox"
              [checked]="isYehApproved()"
              (change)="onYehApprovedChange($event)" />
            <span>YEH Approved</span>
          </label>
        </div>
      }

      <!-- Foods List -->
      <div class="foods-list-container">
        <div
          class="foods-list"
          (keydown)="onKeyDown($event)"
          tabindex="0">
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
                <div class="food-thumbnail">
                  @if (food.foodImageThumbnail) {
                    <img [src]="food.foodImageThumbnail" alt="" class="thumbnail-img" />
                  } @else {
                    <div class="thumbnail-placeholder"></div>
                  }
                </div>
                <span class="food-description">{{ getDisplayDescription(food) }}</span>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./foods.scss']
})
export class FoodsComponent implements OnInit {
  private foodsService = inject(FoodsService);
  private userSettings = inject(UserSettingsService);
  private notificationService = inject(NotificationService);

  // Inputs
  mode = input<'search' | 'display'>('search');
  displayFoods = input<Food[]>([]);

  // Outputs
  selectedFood = output<SelectedFoodEvent>();
  addFood = output<AddFoodEvent>();

  // Internal state
  searchQuery = '';
  maxCount = 500;  // Increased to get all YEH approved foods
  foods = signal<Food[]>([]);
  selectedIndex = signal<number>(-1);
  isLoading = signal<boolean>(false);
  isYehApproved = signal<boolean>(true);  // Local checkbox state

  // Cache for YEH approved foods (avoids server round trips when filtering)
  private yehApprovedCache = signal<Food[]>([]);

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

  ngOnInit(): void {
    // Initialize checkbox from user profile setting
    this.isYehApproved.set(this.userSettings.yehApprovedFoodsOnly());

    // Auto-load YEH approved foods if checkbox is checked
    if (this.isYehApproved() && this.mode() === 'search') {
      this.loadYehApprovedFoods();
    }
  }

  /** Load all YEH approved foods and cache them */
  private loadYehApprovedFoods(): void {
    this.isLoading.set(true);

    this.foodsService.searchYehApprovedFoods(this.maxCount).subscribe({
      next: (response) => {
        if (response && response.foods && Array.isArray(response.foods)) {
          this.yehApprovedCache.set(response.foods);
          this.foods.set(response.foods);

          // Auto-select first item
          if (response.foods.length > 0) {
            this.selectFood(0);
          }
        }
        this.isLoading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load YEH approved foods:', error);
        this.isLoading.set(false);
        this.notificationService.show('Failed to load YEH approved foods', 'error');
      }
    });
  }

  /** Handle search query changes - filter client-side for YEH Approved */
  onSearchQueryChange(query: string): void {
    if (this.isYehApproved()) {
      // Filter cached YEH approved foods client-side (no server call)
      const cache = this.yehApprovedCache();
      if (cache.length > 0) {
        const trimmedQuery = query.trim().toLowerCase();
        if (trimmedQuery.length === 0) {
          // Show all cached foods
          this.foods.set(cache);
        } else {
          // Filter by query
          const filtered = cache.filter(food =>
            food.description.toLowerCase().includes(trimmedQuery) ||
            (food.shortDescription && food.shortDescription.toLowerCase().includes(trimmedQuery))
          );
          this.foods.set(filtered);
        }

        // Auto-select first item
        if (this.foods().length > 0) {
          this.selectFood(0);
        } else {
          this.selectedIndex.set(-1);
        }
      }
    }
    // For non-YEH mode, do nothing on change - require Enter/button click
  }

  /** Check if search can be performed */
  canSearch(): boolean {
    // YEH Approved mode can search without query, regular mode needs query
    if (this.isYehApproved()) {
      return true;
    }
    return this.searchQuery.trim().length >= 2;
  }

  /** Get display description - prefer shortDescription, fallback to description */
  getDisplayDescription(food: Food): string {
    return food.shortDescription || food.description;
  }

  /** Handle YEH Approved checkbox change */
  onYehApprovedChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.isYehApproved.set(checked);

    if (checked) {
      // Load YEH approved foods when checkbox is checked
      this.searchQuery = '';
      this.loadYehApprovedFoods();
    } else {
      // Clear foods and cache when unchecked - user must search USDA
      this.yehApprovedCache.set([]);
      this.foods.set([]);
      this.selectedIndex.set(-1);
    }
  }

  performSearch(): void {
    const query = this.searchQuery.trim();
    const isYehApprovedMode = this.isYehApproved();

    // YEH Approved mode: filtering is done client-side via onSearchQueryChange
    // Just trigger the filter if Enter is pressed
    if (isYehApprovedMode) {
      this.onSearchQueryChange(this.searchQuery);
      return;
    }

    // USDA search: require at least 2 characters
    if (query.length < 2) {
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

        // Show error notification with diagnostic info
        let errorMessage = `Search failed (${error.status})`;
        if (error.status === 0) {
          errorMessage = 'Network error (status 0) - CORS or connection issue';
        } else if (error.status === 401) {
          errorMessage = 'Auth error (401) - Token issue';
        } else if (error.status === 403) {
          errorMessage = 'Forbidden (403) - Access denied';
        } else if (error.status === 404) {
          errorMessage = 'Not found (404)';
        } else if (error.status >= 500) {
          errorMessage = `Server error (${error.status})`;
        }
        this.notificationService.show(errorMessage, 'error');
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
          this.selectFood(currentIndex + 1);
          this.scrollToIndex(currentIndex + 1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault(); // Prevent scrolling
        if (currentIndex > 0) {
          this.selectFood(currentIndex - 1);
          this.scrollToIndex(currentIndex - 1);
        } else if (currentIndex === -1 && foodList.length > 0) {
          // If nothing selected, select the first item
          this.selectFood(0);
          this.scrollToIndex(0);
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (currentIndex >= 0 && currentIndex < foodList.length) {
          // Enter key adds to selected foods (same as double-click)
          const food = foodList[currentIndex];
          console.log('Enter key pressed, adding food:', food.description);
          this.addFood.emit({ food });
        }
        break;
    }
  }

  private scrollToIndex(index: number): void {
    // Scroll the selected item into view
    setTimeout(() => {
      const foodItems = document.querySelectorAll('.food-item');
      if (foodItems[index]) {
        foodItems[index].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }, 0);
  }
}
