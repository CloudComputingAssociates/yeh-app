// src/app/services/preferences.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FoodPreference {
  preferenceId: number;
  foodId: number;
  description: string;
}

export interface PreferencesResponse {
  allowed: {
    foods: FoodPreference[];
    ingredients: FoodPreference[];
  };
  restricted: {
    foods: FoodPreference[];
    ingredients: FoodPreference[];
  };
}

export interface AllowedRestrictedResponse {
  foods: FoodPreference[];
  ingredients: FoodPreference[];
}

export interface CreatePreferenceItem {
  foodId?: number;
  ingredientId?: number;
  allowed: boolean;
}

export interface CreatePreferenceRequest {
  items: CreatePreferenceItem[];
}

export interface CreatePreferenceResponse {
  created: number;
  ids: number[];
}

export interface DeletePreferencesRequest {
  preferenceIds: number[];
}

export interface DeletePreferencesResponse {
  deleted: number;
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Cache for preferences - maps foodId to preferenceId
  private allowedFoodsCache = signal<Map<number, number>>(new Map());
  private restrictedFoodsCache = signal<Map<number, number>>(new Map());

  // Expose as readonly for components
  allowedFoods = this.allowedFoodsCache.asReadonly();
  restrictedFoods = this.restrictedFoodsCache.asReadonly();

  /**
   * Get all user preferences (allowed and restricted)
   */
  getAllPreferences(): Observable<PreferencesResponse> {
    return this.http.get<PreferencesResponse>(`${this.baseUrl}/user/preferences`).pipe(
      tap(response => {
        // Update caches
        const allowedMap = new Map<number, number>();
        const restrictedMap = new Map<number, number>();

        response.allowed.foods.forEach(f => allowedMap.set(f.foodId, f.preferenceId));
        response.restricted.foods.forEach(f => restrictedMap.set(f.foodId, f.preferenceId));

        this.allowedFoodsCache.set(allowedMap);
        this.restrictedFoodsCache.set(restrictedMap);
      })
    );
  }

  /**
   * Get only allowed (favorite) preferences
   */
  getAllowedPreferences(): Observable<AllowedRestrictedResponse> {
    return this.http.get<AllowedRestrictedResponse>(`${this.baseUrl}/user/preferences/allowed`).pipe(
      tap(response => {
        const allowedMap = new Map<number, number>();
        response.foods.forEach(f => allowedMap.set(f.foodId, f.preferenceId));
        this.allowedFoodsCache.set(allowedMap);
      })
    );
  }

  /**
   * Get only restricted preferences
   */
  getRestrictedPreferences(): Observable<AllowedRestrictedResponse> {
    return this.http.get<AllowedRestrictedResponse>(`${this.baseUrl}/user/preferences/restricted`).pipe(
      tap(response => {
        const restrictedMap = new Map<number, number>();
        response.foods.forEach(f => restrictedMap.set(f.foodId, f.preferenceId));
        this.restrictedFoodsCache.set(restrictedMap);
      })
    );
  }

  /**
   * Create a food preference (allowed or restricted)
   */
  createPreference(foodId: number, allowed: boolean): Observable<CreatePreferenceResponse> {
    const request: CreatePreferenceRequest = {
      items: [{ foodId, allowed }]
    };
    return this.http.post<CreatePreferenceResponse>(`${this.baseUrl}/user/preferences`, request).pipe(
      tap(response => {
        if (response.ids.length > 0) {
          const preferenceId = response.ids[0];
          if (allowed) {
            // Add to allowed cache, remove from restricted if present
            const allowedMap = new Map(this.allowedFoodsCache());
            const restrictedMap = new Map(this.restrictedFoodsCache());
            allowedMap.set(foodId, preferenceId);
            restrictedMap.delete(foodId);
            this.allowedFoodsCache.set(allowedMap);
            this.restrictedFoodsCache.set(restrictedMap);
          } else {
            // Add to restricted cache, remove from allowed if present
            const allowedMap = new Map(this.allowedFoodsCache());
            const restrictedMap = new Map(this.restrictedFoodsCache());
            restrictedMap.set(foodId, preferenceId);
            allowedMap.delete(foodId);
            this.allowedFoodsCache.set(allowedMap);
            this.restrictedFoodsCache.set(restrictedMap);
          }
        }
      })
    );
  }

  /**
   * Delete a single preference by ID
   */
  deletePreference(preferenceId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/user/preferences/${preferenceId}`).pipe(
      tap(() => {
        // Remove from caches
        const allowedMap = new Map(this.allowedFoodsCache());
        const restrictedMap = new Map(this.restrictedFoodsCache());

        // Find and remove from allowed
        for (const [foodId, prefId] of allowedMap.entries()) {
          if (prefId === preferenceId) {
            allowedMap.delete(foodId);
            break;
          }
        }

        // Find and remove from restricted
        for (const [foodId, prefId] of restrictedMap.entries()) {
          if (prefId === preferenceId) {
            restrictedMap.delete(foodId);
            break;
          }
        }

        this.allowedFoodsCache.set(allowedMap);
        this.restrictedFoodsCache.set(restrictedMap);
      })
    );
  }

  /**
   * Delete a preference by food ID (finds the preferenceId from cache)
   */
  deletePreferenceByFoodId(foodId: number): Observable<void> | null {
    const allowedPrefId = this.allowedFoodsCache().get(foodId);
    const restrictedPrefId = this.restrictedFoodsCache().get(foodId);
    const preferenceId = allowedPrefId ?? restrictedPrefId;

    if (preferenceId) {
      return this.deletePreference(preferenceId);
    }
    return null;
  }

  /**
   * Check if a food is in the allowed (favorite) list
   */
  isAllowed(foodId: number): boolean {
    return this.allowedFoodsCache().has(foodId);
  }

  /**
   * Check if a food is in the restricted list
   */
  isRestricted(foodId: number): boolean {
    return this.restrictedFoodsCache().has(foodId);
  }

  /**
   * Toggle favorite status for a food
   * If currently favorite -> remove preference
   * If not favorite -> create allowed preference (removes restricted if present)
   */
  toggleFavorite(foodId: number): Observable<unknown> {
    const isCurrentlyAllowed = this.isAllowed(foodId);

    if (isCurrentlyAllowed) {
      // Remove the preference
      const preferenceId = this.allowedFoodsCache().get(foodId);
      if (preferenceId) {
        return this.deletePreference(preferenceId);
      }
    } else {
      // First, check if it's restricted and delete that preference
      const restrictedPrefId = this.restrictedFoodsCache().get(foodId);
      if (restrictedPrefId) {
        // Delete restricted first, then create allowed
        return this.deletePreference(restrictedPrefId).pipe(
          tap(() => {
            // After delete completes, create the allowed preference
            this.createPreference(foodId, true).subscribe();
          })
        );
      }
      // Create allowed preference
      return this.createPreference(foodId, true);
    }
    return new Observable(subscriber => subscriber.complete());
  }

  /**
   * Toggle restricted status for a food
   * If currently restricted -> remove preference
   * If not restricted -> create restricted preference (removes allowed if present)
   */
  toggleRestricted(foodId: number): Observable<unknown> {
    const isCurrentlyRestricted = this.isRestricted(foodId);

    if (isCurrentlyRestricted) {
      // Remove the preference
      const preferenceId = this.restrictedFoodsCache().get(foodId);
      if (preferenceId) {
        return this.deletePreference(preferenceId);
      }
    } else {
      // First, check if it's allowed and delete that preference
      const allowedPrefId = this.allowedFoodsCache().get(foodId);
      if (allowedPrefId) {
        // Delete allowed first, then create restricted
        return this.deletePreference(allowedPrefId).pipe(
          tap(() => {
            // After delete completes, create the restricted preference
            this.createPreference(foodId, false).subscribe();
          })
        );
      }
      // Create restricted preference
      return this.createPreference(foodId, false);
    }
    return new Observable(subscriber => subscriber.complete());
  }

  /**
   * Clear all caches (e.g., on logout)
   */
  clearCache(): void {
    this.allowedFoodsCache.set(new Map());
    this.restrictedFoodsCache.set(new Map());
  }
}
