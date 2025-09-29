// src/app/app.ts
// Main App Component - Modern Angular with Material Design
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MacroNutrientsComponent } from './macro-nutrients/macro-nutrients';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MacroNutrientsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1 class="app-title"></h1>
      </header>
      
      <main class="main-content">
        <app-macro-nutrients />
      </main>
    </div>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'yeh-web-app';
}