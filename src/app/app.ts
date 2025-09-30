// src/app/app.ts
// Main App Component - Modern Angular with Material Design
import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { MacroNutrientsComponent } from './macro-nutrients/macro-nutrients';
import { TopAppBarComponent } from './top-app-bar/top-app-bar';
import { NavDrawerComponent } from './nav-drawer/nav-drawer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MacroNutrientsComponent, TopAppBarComponent, NavDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-nav-drawer #navDrawer>
      <div class="app-container">
        <app-top-app-bar 
          [userProfileImage]="'images/profile_pic.png'"
          (menuClick)="navDrawer.toggleDrawer()">
        </app-top-app-bar>
        
        <main class="main-content">
          <app-macro-nutrients />
        </main>
      </div>
    </app-nav-drawer>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'yeh-web-app';
}