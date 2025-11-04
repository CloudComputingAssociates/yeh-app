// src/app/app.ts
// Main App Component - Modern Angular with Material Design
import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { take } from 'rxjs/operators';
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

      @if (shouldShowGate()) {
        <app-membership-gate />
      } @else if (subscriptionService.isLoading()) {
        <app-loading-overlay />
      }
    </div>
  `,
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  subscriptionService = inject(SubscriptionService);
  title = 'yeh-web-app';

  ngOnInit(): void {
    // Initial subscription status check
    this.subscriptionService.checkSubscriptionStatus().subscribe();
  }

  /**
   * Determines if the membership gate should be shown
   * Shows gate ONLY if:
   * - User IS authenticated AND
   * - User does NOT have an active subscription
   *
   * Does NOT show gate for unauthenticated users (they see login button instead)
   */
  shouldShowGate(): boolean {
    // If we're still loading subscription status, don't show gate yet
    if (this.subscriptionService.isLoading()) {
      return false;
    }

    const status = this.subscriptionService.subscriptionStatus();

    // Only show gate for authenticated users without subscription
    // isAuthenticated$ is async, so we need to check it synchronously
    let isAuthenticated = false;
    this.auth.isAuthenticated$.pipe(take(1)).subscribe((auth: boolean) => isAuthenticated = auth);

    // Show gate only if authenticated AND no active subscription
    return isAuthenticated && status !== null && !status.hasActiveSubscription;
  }
}