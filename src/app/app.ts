// src/app/app.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';  // ADD THIS
import { MacroNutrientsComponent } from './components/macro-nutrients/macro-nutrients';
import { TopAppBarComponent } from './components/top-app-bar/top-app-bar';
import { NavDrawerComponent } from './components/nav-drawer/nav-drawer';
import { ChatDisplayComponent } from './components/chat/display';
import { ChatInputComponent } from './components/chat/chat-input';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,  // ADD THIS
    MacroNutrientsComponent, 
    TopAppBarComponent, 
    NavDrawerComponent,
    ChatDisplayComponent,
    ChatInputComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />  <!-- ADD THIS - it will render CallbackComponent when at /callback -->
    
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