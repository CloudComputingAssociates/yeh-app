// src/app/components/today/today.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="today-container">
      <div class="content-placeholder">
        <p class="placeholder-text">Today's Activity</p>
        <p class="placeholder-subtext">(Coming soon)</p>
      </div>
    </div>
  `,
  styleUrls: ['./today.scss']
})
export class TodayComponent {}
