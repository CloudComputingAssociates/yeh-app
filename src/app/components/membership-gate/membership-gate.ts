// src/app/components/membership-gate/membership-gate.ts
import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@auth0/auth0-angular';
import { SubscriptionService } from '../../services/subscription.service';
import { tap } from 'rxjs/operators';

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

          @if (monthlyProduct() && annualProduct()) {
            <div class="pricing-section">
              <div class="pricing-options">
                <div
                  class="price-option"
                  [class.selected]="selectedPlan() === 'monthly'"
                  (click)="selectPlan('monthly')">
                  <div class="price-label">Monthly</div>
                  <div class="price-amount">{{ formatPrice(monthlyProduct()!.amount) }}<span class="price-period">/mo</span></div>
                </div>

                <div
                  class="price-option featured"
                  [class.selected]="selectedPlan() === 'annual'"
                  (click)="selectPlan('annual')">
                  @if (discountPercent() > 0) {
                    <div class="save-badge">Save {{ discountPercent() }}%</div>
                  }
                  <div class="price-label">Annual</div>
                  <div class="price-amount">{{ formatPrice(annualProduct()!.amount) }}<span class="price-period">/yr</span></div>
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
          } @else {
            <div class="loading-prices">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading pricing...</p>
            </div>
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
export class MembershipGateComponent implements OnInit {
  private auth = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);

  // Signals for reactive state
  selectedPlan = signal<'monthly' | 'annual'>('annual'); // Default to annual (best value)
  isProcessing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Computed products from service
  products = this.subscriptionService.products;

  monthlyProduct = computed(() =>
    this.products().find(p => p.interval === 'month')
  );

  annualProduct = computed(() =>
    this.products().find(p => p.interval === 'year')
  );

  // Calculate discount percentage dynamically
  discountPercent = computed(() => {
    const monthly = this.monthlyProduct();
    const annual = this.annualProduct();

    if (!monthly || !annual) return 0;

    const monthlyYearlyCost = monthly.amount * 12;
    const savings = monthlyYearlyCost - annual.amount;
    const percent = Math.round((savings / monthlyYearlyCost) * 100);

    return percent > 0 ? percent : 0;
  });

  ngOnInit(): void {
    // Fetch products on component initialization
    console.log('MembershipGate: Fetching products...');
    this.subscriptionService.getProducts().subscribe({
      next: (response) => {
        console.log('MembershipGate: Products loaded successfully', response);
      },
      error: (err) => {
        console.error('MembershipGate: Error loading products:', err);
        this.errorMessage.set('Unable to load pricing. Please refresh the page.');
      }
    });
  }

  /**
   * Format price from cents to dollars
   */
  formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

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
    console.log('MembershipGate: Join Now button clicked!');
    this.errorMessage.set(null);
    this.isProcessing.set(true);

    // Check if user is authenticated (take first value only)
    this.auth.isAuthenticated$.pipe(
      tap(isAuthenticated => {
        console.log('User authenticated:', isAuthenticated);
        if (!isAuthenticated) {
          // User needs to sign up first - redirect to Auth0
          console.log('Redirecting to Auth0 login');
          this.auth.loginWithRedirect({
            appState: {
              target: '/checkout',
              selectedPlan: this.selectedPlan()
            }
          });
        } else {
          // User is authenticated - create Stripe checkout session
          console.log('Creating checkout session for plan:', this.selectedPlan());
          this.createCheckoutSession();
        }
      })
    ).subscribe({
      error: (err) => {
        console.error('Error checking auth status:', err);
        this.errorMessage.set('Authentication check failed. Please try again.');
        this.isProcessing.set(false);
      }
    });
  }

  /**
   * Create a Stripe checkout session via backend API
   */
  private createCheckoutSession(): void {
    // Get the selected product
    const product = this.selectedPlan() === 'monthly'
      ? this.monthlyProduct()
      : this.annualProduct();

    if (!product) {
      this.errorMessage.set('Selected plan not available. Please try again.');
      this.isProcessing.set(false);
      return;
    }

    this.subscriptionService.createCheckoutSession(product.priceId).subscribe({
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
