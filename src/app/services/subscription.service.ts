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

  // Public computed signals
  readonly subscriptionStatus = this.subscriptionStatusSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

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
        return this.http.get<BackendSubscriptionResponse>(`${this.API_BASE_URL}/api/users/subscription-status`).pipe(
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

            // If we get 404 or similar, assume no active subscription
            if (error.status === 404 || error.status === 401) {
              const noSubStatus: SubscriptionStatus = { hasActiveSubscription: false };
              this.subscriptionStatusSignal.set(noSubStatus);
              this.loadingSignal.set(false);
              return of(noSubStatus);
            }

            // For other errors, set error state
            this.errorSignal.set(error.message || 'Failed to check subscription status');
            this.loadingSignal.set(false);

            // Return a default "no subscription" state on error
            const defaultStatus: SubscriptionStatus = { hasActiveSubscription: false };
            this.subscriptionStatusSignal.set(defaultStatus);
            return of(defaultStatus);
          })
        );
      })
    );
  }

  /**
   * Create a Stripe checkout session for subscription
   * @param planType - Subscription plan type ('monthly' or 'annual')
   * @returns Observable with checkout session URL
   */
  createCheckoutSession(planType: 'monthly' | 'annual'): Observable<{ url: string }> {
    return this.http.post<{ sessionId: string; url: string }>(
      `${this.API_BASE_URL}/api/stripe/create-checkout-session`,
      { planType }
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
      `${this.API_BASE_URL}/api/subscriptions/portal`
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
      `${this.API_BASE_URL}/api/subscriptions/cancel`,
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
