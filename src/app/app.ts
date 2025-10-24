// src/app/app.ts
// Main App Component - Modern Angular with Material Design
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { MacroNutrientsComponent } from './components/macro-nutrients/macro-nutrients';
import { TopAppBarComponent } from './components/top-app-bar/top-app-bar';
import { NavDrawerComponent } from './components/nav-drawer/nav-drawer';
import { ChatDisplayComponent } from './components/chat/display';
import { ChatInputComponent } from './components/chat/chat-input';
import { MembershipGateComponent } from './components/membership-gate/membership-gate';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AsyncPipe,
    MacroNutrientsComponent, 
    TopAppBarComponent, 
    NavDrawerComponent,
    ChatDisplayComponent,
    ChatInputComponent,
    MembershipGateComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-wrapper" [class.disabled-state]="!(auth.isAuthenticated$ | async)">
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
      
      @if (!(auth.isAuthenticated$ | async)) {
        <app-membership-gate />
      }
    </div>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent {
  auth = inject(AuthService);
  title = 'yeh-web-app';
}