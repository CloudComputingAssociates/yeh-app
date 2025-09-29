// src/app/macro-nutrients/macro-nutrients.ts
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserProfileService } from '../services/user-profile.service';
import { TimePeriod, NutritionResponse } from '../models/nutrition.model';

export interface MacroNutrient {
  name: string;
  percentage: number;
  actual: number;
  target: number;
}

export interface MacroDisplayData {
  macros: MacroNutrient[];
  timePeriod: TimePeriod;
}

@Component({
  selector: 'app-macro-nutrients',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="macro-nutrients-container">

      <mat-card class="indicators-card">
        <mat-card-content>
          
          <!-- Single Toggle inside container -->
          <div class="single-toggle">
            <span 
              class="period-toggle-text"
              (click)="toggleTimePeriod()"
              [attr.aria-label]="'Toggle between day and week view. Currently showing: ' + (currentTimePeriod === 'day' ? 'Day' : 'Week')">
              {{ currentTimePeriod === 'day' ? 'Day' : 'Week' }}
            </span>
          </div>

          <!-- Macro Nutrients Grid -->
          <div class="macro-grid">
            
            <!-- Iterate through each macro nutrient -->
            @for (macro of displayData.macros; track macro.name) {
              <mat-card class="macro-card">
                <mat-card-header>
                  <mat-card-title class="macro-title">{{ macro.name }}</mat-card-title>
                </mat-card-header>
                
                <mat-card-content>
                  <!-- Custom Progress Bar (replacing Material's) -->
                  <div class="custom-progress-container">
                    <div class="custom-progress-track">
                      <div 
                        class="custom-progress-fill"
                        [style.width.%]="macro.percentage"
                        [style.background-color]="getMacroColor(macro.name, macro.percentage)">
                      </div>
                    </div>
                  </div>
                  
                  <!-- Percentage Label (clickable to toggle) -->
                  <div class="percentage-label">
                    <button 
                      type="button"
                      class="percentage-toggle-btn"
                      (click)="toggleDisplay()"
                      [attr.aria-label]="'Toggle between percentage and grams. Currently showing: ' + (showPercentages ? 'percentage' : 'grams')">
                      <span class="percentage-text">
                        @if (showPercentages) {
                          {{ macro.percentage }}%
                        } @else {
                          {{ macro.actual }}g
                        }
                      </span>
                    </button>
                  </div>
                </mat-card-content>
                
              </mat-card>
            }
            
          </div>
          
        </mat-card-content>
      </mat-card>

      <!-- Content Area Below (optional) -->
      <div class="content-section">
        <ng-content></ng-content>
      </div>

      <!-- Loading State -->
      @if (isLoading) {
        <div class="loading-overlay">
          <div class="loading-spinner"></div>
        </div>
      }

    </div>
  `,
  styleUrls: ['./macro-nutrients.scss']
})
export class MacroNutrientsComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  
  // Component state
  displayData: MacroDisplayData = {
    macros: [],
    timePeriod: 'day'
  };
  currentTimePeriod: TimePeriod = 'day';
  isLoading = false;
  showPercentages = true; // Toggle between percentage and grams display

  constructor(private userProfileService: UserProfileService) {}

  ngOnInit(): void {
    // Get initial static data immediately
    this.displayData = this.transformNutritionData(
      this.userProfileService.getCurrentNutritionData(), 
      'day'
    );
    this.currentTimePeriod = 'day';
    
    // Listen for time period changes
    this.userProfileService.currentPeriod$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(timePeriod => {
      this.currentTimePeriod = timePeriod;
      this.displayData = this.transformNutritionData(
        this.userProfileService.getCurrentNutritionData(),
        timePeriod
      );
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Transform nutrition response data for component display
   */
  private transformNutritionData(
    data: NutritionResponse, 
    timePeriod: TimePeriod
  ): MacroDisplayData {
    const macros: MacroNutrient[] = [
      {
        name: 'Protein',
        actual: timePeriod === 'day' ? data.nutrients.protein['actual-day'] : data.nutrients.protein['actual-week'],
        target: data.nutrients.protein['target-grams'],
        percentage: this.calculatePercentage(
          timePeriod === 'day' ? data.nutrients.protein['actual-day'] : data.nutrients.protein['actual-week'],
          data.nutrients.protein['target-grams']
        )
      },
      {
        name: 'Fat',
        actual: timePeriod === 'day' ? data.nutrients.fat['actual-day'] : data.nutrients.fat['actual-week'],
        target: data.nutrients.fat['target-grams'],
        percentage: this.calculatePercentage(
          timePeriod === 'day' ? data.nutrients.fat['actual-day'] : data.nutrients.fat['actual-week'],
          data.nutrients.fat['target-grams']
        )
      },
      {
        name: 'Carbs',
        actual: timePeriod === 'day' ? data.nutrients.carb['actual-day'] : data.nutrients.carb['actual-week'],
        target: data.nutrients.carb['target-grams'],
        percentage: this.calculatePercentage(
          timePeriod === 'day' ? data.nutrients.carb['actual-day'] : data.nutrients.carb['actual-week'],
          data.nutrients.carb['target-grams']
        )
      }
    ];

    return { macros, timePeriod };
  }

  /**
   * Calculate progress percentage, capped at 100%
   */
  private calculatePercentage(actual: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(Math.round((actual / target) * 100), 100);
  }

  /**
   * Toggle between time periods (Day/Week)
   */
  toggleTimePeriod(): void {
    const newPeriod: TimePeriod = this.currentTimePeriod === 'day' ? 'week' : 'day';
    this.userProfileService.setTimePeriod(newPeriod);
  }

  /**
   * Toggle between percentage and grams display
   */
  toggleDisplay(): void {
    this.showPercentages = !this.showPercentages;
  }

  /**
   * Get Material Design color theme for progress bar
   */
  getMatColor(macroName: string, percentage: number): 'primary' | 'accent' | 'warn' {
    // Carbs use reverse logic (lower is better)
    if (macroName.toLowerCase() === 'carbs') {
      if (percentage <= 33) return 'primary';  // Green for low carbs
      if (percentage <= 66) return 'accent';   // Orange for moderate
      return 'warn';                           // Red for high carbs
    }
    
    // Protein and Fat use normal logic (higher is better)
    if (percentage <= 33) return 'warn';       // Red - needs attention
    if (percentage <= 66) return 'accent';     // Orange - making progress
    return 'primary';                          // Green - on track
  }

  /**
   * Get color based on macro type and percentage
   */
  getMacroColor(macroName: string, percentage: number): string {
    // Carbs use reverse color logic (lower is better)
    if (macroName.toLowerCase() === 'carbs') {
      if (percentage <= 33) return '#10b981'; // Green - good (low carbs)
      if (percentage <= 66) return '#f59e0b'; // Orange - moderate
      return '#ef4444';                        // Red - high (too many carbs)
    }
    
    // Protein and Fat use normal color logic (higher is better)
    if (percentage <= 33) return '#ef4444';   // Red - needs attention
    if (percentage <= 66) return '#f59e0b';   // Orange - making progress
    return '#10b981';                          // Green - on track
  }

  /**
   * Get default nutrition data structure
   */
  private getDefaultNutritionData(): NutritionResponse {
    return {
      nutrients: {
        protein: { 'target-percent': 30, 'target-grams': 150, 'actual-day': 0, 'actual-week': 0 },
        fat: { 'target-percent': 35, 'target-grams': 78, 'actual-day': 0, 'actual-week': 0 },
        carb: { 'target-percent': 35, 'target-grams': 175, 'actual-day': 0, 'actual-week': 0 }
      }
    };
  }
}