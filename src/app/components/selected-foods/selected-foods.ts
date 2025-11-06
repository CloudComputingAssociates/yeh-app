// src/app/components/selected-foods/selected-foods.ts
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Food } from '../../models/food.model';

@Component({
  selector: 'app-selected-foods',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="selected-foods-container">
      <div class="selected-foods-list">
        @if (foods().length === 0) {
          <div class="empty-message">
            <p>No foods selected</p>
          </div>
        } @else {
          @for (food of foods(); track food.id) {
            <div class="selected-food-item">
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
  foods = input<Food[]>([]);
}
