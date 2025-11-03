# Membership Gate Implementation

This document explains how the membership gate feature is wired up in the Angular application.

## Overview

The membership gate is displayed to users who either:
1. **Haven't signed up yet** (no Auth0 account)
2. **Have signed up but haven't subscribed** (authenticated but no active subscription)

## Architecture

### Components

1. **MembershipGateComponent** ([membership-gate.ts](src/app/components/membership-gate/membership-gate.ts))
   - Displays pricing information and "Join Now" button
   - Triggers Auth0 login when user clicks "Join Now"

2. **AppComponent** ([app.ts](src/app/app.ts))
   - Main application wrapper
   - Controls when to show the membership gate
   - Shows loading overlay during subscription status checks

3. **LoadingOverlayComponent** ([loading-overlay.ts](src/app/components/loading-overlay/loading-overlay.ts))
   - Simple spinner overlay shown while checking subscription status

### Services

**SubscriptionService** ([subscription.service.ts](src/app/services/subscription.service.ts))
- Manages subscription status using Angular signals
- Checks subscription status from backend API
- Provides methods for:
  - `checkSubscriptionStatus()` - Fetches current user's subscription status
  - `createCheckoutSession()` - Creates Stripe checkout session
  - `getBillingPortalUrl()` - Gets Stripe billing portal URL
  - `cancelSubscription()` - Cancels user's subscription

### Flow

```
User visits app
     ↓
App checks Auth0 authentication state
     ↓
If authenticated → Check subscription status from backend API
     ↓
If no active subscription → Show membership gate
     ↓
User clicks "Join Now" → Redirect to Auth0 login (if not authenticated)
     ↓
After authentication → Check subscription status again
     ↓
If still no subscription → Show gate with payment options
```

## Backend API Integration

The app expects the following backend API endpoints:

### 1. **GET /api/subscriptions/status**
Checks if the authenticated user has an active subscription.

**Expected Response:**
```json
{
  "hasActiveSubscription": true,
  "subscriptionType": "monthly" | "annual",
  "status": "active" | "cancelled" | "expired" | "trialing"
}
```

**Error Handling:**
- `404` or `401` responses are treated as "no active subscription"
- Other errors default to showing the membership gate (fail-safe)

### 2. **POST /api/subscriptions/checkout**
Creates a Stripe checkout session for subscription purchase.

**Request Body:**
```json
{
  "priceId": "price_xxx" // Stripe price ID
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/session/xxx"
}
```

### 3. **GET /api/subscriptions/portal**
Gets the Stripe billing portal URL for subscription management.

**Response:**
```json
{
  "portal_url": "https://billing.stripe.com/session/xxx"
}
```

### 4. **PUT /api/subscriptions/cancel**
Cancels the user's subscription.

**Response:**
```json
{
  "status": "cancelled",
  "message": "Subscription cancelled successfully"
}
```

### 5. **POST /api/subscriptions/stripe/webhook**
Handles Stripe webhook events (no authentication required - Stripe signs the payload).

## Configuration

### Environment Files

**Development:** [environment.ts](src/environments/environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080' // Your backend API URL
};
```

**Production:** [environment.prod.ts](src/environments/environment.prod.ts)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.youreatinghealthy.com' // Your production API URL
};
```

### Auth0 Configuration

Auth0 settings are in [app.config.ts](src/app/app.config.ts):
```typescript
provideAuth0({
  domain: 'dev-sj1bmj8255bwte7r.us.auth0.com',
  clientId: '9KHWGCfSSg9wUr1oREiUYIgP15EDIppJ',
  authorizationParams: {
    redirect_uri: window.location.origin
  }
})
```

## Setup Instructions

### 1. Update Backend API URL

Edit the environment files to point to your backend API:

**For local development:**
```bash
# src/environments/environment.ts
apiUrl: 'http://localhost:8080'  # Your Go backend port
```

**For production:**
```bash
# src/environments/environment.prod.ts
apiUrl: 'https://api.youreatinghealthy.com'  # Your production API domain
```

### 2. Implement Backend API Endpoint

In your Go backend (`c:\git\yeh-api`), add the subscription status endpoint:

```go
// File: api/subscriptions.go
func RegisterSubscriptionRoutes(observability *primitive.ObservabilityService) {
    // Add this endpoint for status checks
    registerEndpointWithMiddleware("GET", "/api/subscriptions/status", "Get user subscription status", func(w http.ResponseWriter, r *http.Request) {
        if r.Method != http.MethodGet {
            http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
            return
        }

        // Extract user ID from JWT token (Auth0)
        userID := extractUserIDFromToken(r)

        // Look up subscription in database
        subscription, err := getSubscriptionByUserID(userID)
        if err != nil {
            // No subscription found
            w.Header().Set("Content-Type", "application/json")
            json.NewEncoder(w).Encode(map[string]interface{}{
                "hasActiveSubscription": false,
            })
            return
        }

        // Return subscription status
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(map[string]interface{}{
            "hasActiveSubscription": subscription.Status == "active" || subscription.Status == "trialing",
            "subscriptionType":      subscription.Type,
            "status":                subscription.Status,
        })
    })
}
```

### 3. Test the Flow

1. **Start the backend API:**
   ```bash
   cd c:\git\yeh-api
   go run main.go
   ```

2. **Start the Angular dev server:**
   ```bash
   cd c:\git\yeh-app
   npm start
   ```

3. **Test scenarios:**
   - Visit `http://localhost:4200` without authentication → Should show membership gate
   - Sign up via Auth0 → App checks subscription status
   - If no subscription → Membership gate remains visible
   - Subscribe → Gate should disappear, app content visible

## Troubleshooting

### Gate always showing
- Check browser console for API errors
- Verify backend API is running and accessible
- Check CORS settings on backend (Angular dev server runs on port 4200)

### Gate never showing
- Check subscription status signal in service
- Verify `shouldShowGate()` logic in AppComponent

### Loading spinner stuck
- Check for API timeout or network errors
- Service has error handling that defaults to "no subscription" state

## Next Steps

1. **Implement Stripe Integration:**
   - Add checkout session creation
   - Handle payment webhooks
   - Update subscription status in database

2. **Add Payment UI:**
   - Update MembershipGateComponent to handle Stripe checkout
   - Add payment success/failure callbacks

3. **Add Subscription Management:**
   - Profile page with subscription details
   - Cancel/upgrade subscription options
   - Billing history

## Files Modified/Created

### Created
- `src/app/services/subscription.service.ts` - Subscription state management
- `src/app/components/loading-overlay/loading-overlay.ts` - Loading spinner
- `src/environments/environment.ts` - Development config
- `src/environments/environment.prod.ts` - Production config

### Modified
- `src/app/app.ts` - Added subscription checking logic
- `src/app/app.config.ts` - Added HttpClient provider
- `src/app/components/membership-gate/membership-gate.ts` - (Already existed, no changes)

## Notes

- The app uses Angular signals for reactive state management
- Subscription status is checked on app initialization and when auth state changes
- Loading states prevent gate from flickering during status checks
- Error handling defaults to showing the gate (fail-safe approach)
