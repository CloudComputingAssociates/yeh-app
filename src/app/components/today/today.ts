// src/app/components/today/today.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MacrosComponent } from '../macros/macros';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, MacrosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="today-container">
      <app-macros />
    </div>
  `,
  styleUrls: ['./today.scss']
})
export class TodayComponent {}
