// src/app/app.ts
// Main App Component - Modern Angular with Material Design
import { Component, ChangeDetectionStrategy, inject, OnInit, effect } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '@auth0/auth0-angular';
import { MacroNutrientsComponent } from './components/macro-nutrients/macro-nutrients';
import { TopAppBarComponent } from './components/top-app-bar/top-app-bar';
import { NavDrawerComponent } from './components/nav-drawer/nav-drawer';
import { ChatDisplayComponent } from './components/chat/display';
import { ChatInputComponent } from './components/chat/chat-input';
import { MembershipGateComponent } from './components/membership-gate/membership-gate';
import { LoadingOverlayComponent } from './components/loading-overlay/loading-overlay';
import { SubscriptionService } from './services/subscription.service';

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
    MembershipGateComponent,
    LoadingOverlayComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-wrapper" [class.disabled-state]="shouldShowGate()">
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

      @if (subscriptionService.isLoading()) {
        <app-loading-overlay />
      }

      @if (shouldShowGate()) {
        <app-membership-gate />
      }
    </div>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  subscriptionService = inject(SubscriptionService);
  title = 'yeh-web-app';

  constructor() {
    // Check subscription status whenever authentication state changes
    effect(() => {
      this.auth.isAuthenticated$.subscribe(isAuthenticated => {
        if (isAuthenticated) {
          // User is authenticated - check their subscription status
          this.subscriptionService.checkSubscriptionStatus().subscribe();
        } else {
          // User is not authenticated - clear subscription status
          this.subscriptionService.clearStatus();
        }
      });
    });
  }

  ngOnInit(): void {
    // Initial subscription status check
    this.subscriptionService.checkSubscriptionStatus().subscribe();
  }

  /**
   * Determines if the membership gate should be shown
   * Shows gate if:
   * - User is NOT authenticated (needs to sign up), OR
   * - User IS authenticated but does NOT have an active subscription
   */
  shouldShowGate(): boolean {
    // If we're still loading subscription status, don't show gate yet
    if (this.subscriptionService.isLoading()) {
      return false;
    }

    const status = this.subscriptionService.subscriptionStatus();

    // Show gate if status is null (no data yet) or user doesn't have active subscription
    return status !== null && !status.hasActiveSubscription;
  }
}