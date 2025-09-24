import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MacroNutrient {
  name: string;
  percentage: number;
}

@Component({
  selector: 'app-macro-nutrients',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="macro-nutrients-container">
      <div class="macro-grid">
        @for (macro of macroNutrients(); track macro.name) {
          <div class="macro-card">
            <h3 class="macro-title">{{ macro.name }}</h3>
            
            <div class="progress-container">
              <div class="progress-track">
                <div 
                  class="progress-fill"
                  [style.width.%]="macro.percentage"
                  [style.background-color]="getRawColor(macro.percentage)">
                </div>
              </div>
              
              <div class="percentage-label">
                <span class="percentage-text">{{ macro.percentage }}%</span>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrls: ['./macro-nutrients.scss']
})
export class MacroNutrientsComponent {
  // Input signals
  protein = input<number>(75);
  fat = input<number>(45);
  carbs = input<number>(22);

  // Computed macro nutrients array
  macroNutrients = computed<MacroNutrient[]>(() => [
    { name: 'Protein', percentage: this.protein() },
    { name: 'Fat', percentage: this.fat() },
    { name: 'Carbs', percentage: this.carbs() }
  ]);

  /**
   * Get raw color value for styling to match Figma design
   * @param percentage - The percentage value (0-100)
   * @returns CSS color string
   */
  getRawColor(percentage: number): string {
    if (percentage <= 33) {
      return '#ef4444'; // Red like Figma
    } else if (percentage <= 66) {
      return '#f59e0b'; // Orange like Figma  
    } else {
      return '#10b981'; // Green like Figma
    }
  }
}


