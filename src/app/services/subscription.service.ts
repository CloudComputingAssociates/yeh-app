// src/app/services/subscription.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '@auth0/auth0-angular';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

// Backend API response format
interface BackendSubscriptionResponse {
  hasActiveSubscription: boolean;
  subscriptionTier?: string;
  subscriptionStatus?: string;
  expiresAt?: string;
}

// Frontend subscription status interface
export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscriptionType?: 'monthly' | 'annual';
  status?: 'active' | 'cancelled' | 'expired' | 'trialing';
  expiresAt?: string;
}

// Stripe product/price interface
export interface StripeProduct {
  id: string;
  name: string;
  priceId: string;
  amount: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  discount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  // API base URL from environment configuration
  private readonly API_BASE_URL = environment.apiUrl;

  // Reactive state using signals
  private subscriptionStatusSignal = signal<SubscriptionStatus | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);
  private productsSignal = signal<StripeProduct[]>([]);

  // Public computed signals
  readonly subscriptionStatus = this.subscriptionStatusSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly products = this.productsSignal.asReadonly();

  // Computed: should show membership gate
  readonly shouldShowMembershipGate = computed(() => {
    const status = this.subscriptionStatusSignal();
    // Show gate if we have status data and user doesn't have active subscription
    return status !== null && !status.hasActiveSubscription;
  });

  /**
   * Check the current user's subscription status
   * Returns an observable that emits the subscription status
   */
  checkSubscriptionStatus(): Observable<SubscriptionStatus> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    // First ensure user is authenticated
    return this.auth.isAuthenticated$.pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          // User not authenticated - they need to sign up
          const status: SubscriptionStatus = { hasActiveSubscription: false };
          this.subscriptionStatusSignal.set(status);
          this.loadingSignal.set(false);
          return of(status);
        }

        // User is authenticated - check subscription status from backend
        return this.http.get<BackendSubscriptionResponse>(`${this.API_BASE_URL}/subscriptions/status`).pipe(
          tap(backendResponse => {
            // Map backend response to frontend format
            const status: SubscriptionStatus = {
              hasActiveSubscription: backendResponse.hasActiveSubscription,
              subscriptionType: backendResponse.subscriptionTier as 'monthly' | 'annual',
              status: backendResponse.subscriptionStatus as 'active' | 'cancelled' | 'expired' | 'trialing',
              expiresAt: backendResponse.expiresAt
            };
            this.subscriptionStatusSignal.set(status);
            this.loadingSignal.set(false);
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('Error checking subscription status:', error);

            // 401 = Authentication failed (invalid/expired token)
            // Clear auth state and force logout so user sees Login button
            if (error.status === 401) {
              console.warn('Auth token invalid/expired - logging out');
              this.subscriptionStatusSignal.set(null);
              this.loadingSignal.set(false);
              // Force logout to clear stale tokens and show Login button
              this.auth.logout({
                logoutParams: {
                  returnTo: window.location.origin
                },
                openUrl: false // Don't redirect to Auth0, just clear local state
              });
              return of(null as unknown as SubscriptionStatus);
            }

            // 404 = User exists but no subscription record
            if (error.status === 404) {
              const noSubStatus: SubscriptionStatus = { hasActiveSubscription: false };
              this.subscriptionStatusSignal.set(noSubStatus);
              this.loadingSignal.set(false);
              return of(noSubStatus);
            }

            // For other errors, set error state but don't show gate
            this.errorSignal.set(error.message || 'Failed to check subscription status');
            this.loadingSignal.set(false);
            this.subscriptionStatusSignal.set(null);
            return of(null as unknown as SubscriptionStatus);
          })
        );
      })
    );
  }

  /**
   * Get available subscription products from backend
   * @returns Observable with product list
   */
  getProducts(): Observable<{ products: StripeProduct[] }> {
    return this.http.get<{ products: StripeProduct[] }>(
      `${this.API_BASE_URL}/subscriptions/products`
    ).pipe(
      tap(response => {
        this.productsSignal.set(response.products);
      }),
      catchError(error => {
        console.error('Error fetching products:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create a Stripe checkout session for subscription
   * @param priceId - Stripe price ID from backend
   * @returns Observable with checkout session URL
   */
  createCheckoutSession(priceId: string): Observable<{ url: string }> {
    return this.http.post<{ sessionId: string; url: string }>(
      `${this.API_BASE_URL}/subscriptions/checkout`,
      { priceId }
    ).pipe(
      catchError(error => {
        console.error('Error creating checkout session:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Stripe billing portal URL
   * @returns Observable with portal URL
   */
  getBillingPortalUrl(): Observable<{ portal_url: string }> {
    return this.http.get<{ portal_url: string }>(
      `${this.API_BASE_URL}/subscriptions/portal`
    ).pipe(
      catchError(error => {
        console.error('Error getting billing portal URL:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cancel the current user's subscription
   * @returns Observable with cancellation confirmation
   */
  cancelSubscription(): Observable<{ status: string; message: string }> {
    return this.http.put<{ status: string; message: string }>(
      `${this.API_BASE_URL}/subscriptions/cancel`,
      {}
    ).pipe(
      tap(() => {
        // Update local state to reflect cancellation
        this.subscriptionStatusSignal.update(status =>
          status ? { ...status, status: 'cancelled' } : null
        );
      }),
      catchError(error => {
        console.error('Error cancelling subscription:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh subscription status from backend
   */
  refreshStatus(): void {
    this.checkSubscriptionStatus().subscribe();
  }

  /**
   * Clear subscription status (e.g., on logout)
   */
  clearStatus(): void {
    this.subscriptionStatusSignal.set(null);
    this.errorSignal.set(null);
    this.loadingSignal.set(false);
  }
}
