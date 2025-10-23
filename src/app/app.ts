// src/app/app.ts
// Main App Component - Modern Angular with Material Design
import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { MacroNutrientsComponent } from './components/macro-nutrients/macro-nutrients';
import { TopAppBarComponent } from './components/top-app-bar/top-app-bar';
import { NavDrawerComponent } from './components/nav-drawer/nav-drawer';
import { ChatDisplayComponent } from './components/chat/display';
import { ChatInputComponent } from './components/chat/chat-input';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MacroNutrientsComponent, 
    TopAppBarComponent, 
    NavDrawerComponent,
    ChatDisplayComponent,
    ChatInputComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-nav-drawer #navDrawer>
      <div class="app-container">
        <app-top-app-bar 
          (menuClick)="navDrawer.toggleDrawer()">
        </app-top-app-bar>
        
        <main class="main-content">
          <app-macro-nutrients />
          <app-chat-display />
          <app-chat-input />
        </main>
      </div>
    </app-nav-drawer>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'yeh-web-app';
}