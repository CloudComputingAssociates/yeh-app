// src/app/components/membership-gate/membership-gate.ts
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@auth0/auth0-angular';
import { SubscriptionService } from '../../services/subscription.service';

@Component({
  selector: 'app-membership-gate',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="membership-overlay">
      <mat-card class="membership-card">
        <mat-card-content>
          <div class="logo-section">
            <img src="images/yeh_logo_dark.png" alt="You Eating Healthy" class="brand-logo">
            <h2 class="app-title">you eating healthy</h2>
          </div>

          <h1 class="headline">Take charge of your nutrition</h1>

          <p class="subhead">
            AI-powered meal planning and tracking with a 24/7 nutrition coach.
            Get personalized guidance, understand your food choices, and track your progress.
          </p>

          <div class="pricing-section">
            <div class="pricing-options">
              <div
                class="price-option"
                [class.selected]="selectedPlan() === 'monthly'"
                (click)="selectPlan('monthly')">
                <div class="price-label">Monthly</div>
                <div class="price-amount">$9.99<span class="price-period">/mo</span></div>
              </div>

              <div
                class="price-option featured"
                [class.selected]="selectedPlan() === 'annual'"
                (click)="selectPlan('annual')">
                <div class="save-badge">Save 17%</div>
                <div class="price-label">Annual</div>
                <div class="price-amount">$99.99<span class="price-period">/yr</span></div>
              </div>
            </div>
          </div>

          @if (isProcessing()) {
            <button
              mat-raised-button
              color="primary"
              class="join-button"
              disabled>
              <mat-spinner diameter="24"></mat-spinner>
              Processing...
            </button>
          } @else {
            <button
              mat-raised-button
              color="primary"
              class="join-button"
              (click)="handleJoinNow()">
              Join Now
            </button>
          }

          @if (errorMessage()) {
            <p class="error-message">{{ errorMessage() }}</p>
          }

          <p class="terms">
            By joining, you agree to our Terms of Service and Privacy Policy
          </p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styleUrls: ['./membership-gate.scss']
})
export class MembershipGateComponent {
  private auth = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);

  // Signals for reactive state
  selectedPlan = signal<'monthly' | 'annual'>('annual'); // Default to annual (best value)
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  /**
   * Select a pricing plan
   */
  selectPlan(plan: 'monthly' | 'annual'): void {
    this.selectedPlan.set(plan);
    this.errorMessage.set(null);
  }

  /**
   * Handle the "Join Now" button click
   * If user is not authenticated, redirect to Auth0 login
   * If user is authenticated, create Stripe checkout session
   */
  handleJoinNow(): void {
    this.errorMessage.set(null);
    this.isProcessing.set(true);

    // Check if user is authenticated
    this.auth.isAuthenticated$.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        // User needs to sign up first - redirect to Auth0
        this.auth.loginWithRedirect({
          appState: {
            target: '/checkout',
            selectedPlan: this.selectedPlan()
          }
        });
      } else {
        // User is authenticated - create Stripe checkout session
        this.createCheckoutSession();
      }
    });
  }

  /**
   * Create a Stripe checkout session via backend API
   */
  private createCheckoutSession(): void {
    // Send plan type to backend - backend will look up the correct Stripe price ID
    const planType = this.selectedPlan(); // 'monthly' or 'annual'

    this.subscriptionService.createCheckoutSession(planType).subscribe({
      next: (response) => {
        // Redirect to Stripe checkout page
        if (response.url) {
          window.location.href = response.url;
        } else {
          this.errorMessage.set('Failed to create checkout session. Please try again.');
          this.isProcessing.set(false);
        }
      },
      error: (error) => {
        console.error('Error creating checkout session:', error);
        this.errorMessage.set('Unable to process your request. Please try again later.');
        this.isProcessing.set(false);
      }
    });
  }
}
