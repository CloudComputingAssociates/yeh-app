// src/app/services/preferences.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, of, map, switchMap } from 'rxjs';
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

// Pending change types
export type PendingChangeType = 'add-allowed' | 'add-restricted' | 'remove';

export interface PendingChange {
  foodId: number;
  type: PendingChangeType;
  originalPreferenceId?: number; // For removals, we need to know what to delete
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Server state - what's saved in the database (maps foodId to preferenceId)
  private serverAllowedFoods = signal<Map<number, number>>(new Map());
  private serverRestrictedFoods = signal<Map<number, number>>(new Map());

  // Local state - reflects UI including unsaved changes (just foodId sets)
  private localAllowedFoods = signal<Set<number>>(new Set());
  private localRestrictedFoods = signal<Set<number>>(new Set());

  // Pending changes to be saved
  private pendingChanges = signal<Map<number, PendingChange>>(new Map());

  // Computed: has unsaved changes
  hasUnsavedChanges = computed(() => this.pendingChanges().size > 0);

  // Expose local state for UI (what the icons should show)
  isAllowed(foodId: number): boolean {
    return this.localAllowedFoods().has(foodId);
  }

  isRestricted(foodId: number): boolean {
    return this.localRestrictedFoods().has(foodId);
  }

  // Getters for filtering (returns Sets of foodIds)
  allowedFoods(): Set<number> {
    return this.localAllowedFoods();
  }

  restrictedFoods(): Set<number> {
    return this.localRestrictedFoods();
  }

  /**
   * Get all user preferences (allowed and restricted) and initialize local state
   */
  getAllPreferences(): Observable<PreferencesResponse> {
    return this.http.get<PreferencesResponse>(`${this.baseUrl}/user/preferences`).pipe(
      tap(response => {
        // Update server state
        const allowedMap = new Map<number, number>();
        const restrictedMap = new Map<number, number>();

        response.allowed.foods.forEach(f => allowedMap.set(f.foodId, f.preferenceId));
        response.restricted.foods.forEach(f => restrictedMap.set(f.foodId, f.preferenceId));

        this.serverAllowedFoods.set(allowedMap);
        this.serverRestrictedFoods.set(restrictedMap);

        // Initialize local state to match server
        this.localAllowedFoods.set(new Set(allowedMap.keys()));
        this.localRestrictedFoods.set(new Set(restrictedMap.keys()));

        // Clear any pending changes
        this.pendingChanges.set(new Map());
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
        this.serverAllowedFoods.set(allowedMap);
        this.localAllowedFoods.set(new Set(allowedMap.keys()));
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
        this.serverRestrictedFoods.set(restrictedMap);
        this.localRestrictedFoods.set(new Set(restrictedMap.keys()));
      })
    );
  }

  /**
   * Toggle favorite status locally (no API call)
   * Updates local state and tracks pending change
   */
  toggleFavoriteLocal(foodId: number): void {
    const localAllowed = new Set(this.localAllowedFoods());
    const localRestricted = new Set(this.localRestrictedFoods());
    const changes = new Map(this.pendingChanges());

    const wasAllowed = localAllowed.has(foodId);
    const wasRestricted = localRestricted.has(foodId);
    const serverAllowedPrefId = this.serverAllowedFoods().get(foodId);
    const serverRestrictedPrefId = this.serverRestrictedFoods().get(foodId);

    if (wasAllowed) {
      // Currently allowed -> remove it
      localAllowed.delete(foodId);

      if (serverAllowedPrefId) {
        // Was saved on server, need to delete
        changes.set(foodId, { foodId, type: 'remove', originalPreferenceId: serverAllowedPrefId });
      } else {
        // Was only local (pending add), just remove the pending change
        changes.delete(foodId);
      }
    } else {
      // Not allowed -> make it allowed
      localAllowed.add(foodId);

      // If it was restricted, remove from restricted
      if (wasRestricted) {
        localRestricted.delete(foodId);
      }

      // Track the change
      if (serverAllowedPrefId) {
        // Already saved as allowed on server, no change needed
        changes.delete(foodId);
      } else if (serverRestrictedPrefId) {
        // Was restricted on server, need to delete that and add allowed
        // For simplicity, we'll handle this as add-allowed (server will handle conflict)
        changes.set(foodId, { foodId, type: 'add-allowed', originalPreferenceId: serverRestrictedPrefId });
      } else {
        // New preference
        changes.set(foodId, { foodId, type: 'add-allowed' });
      }
    }

    this.localAllowedFoods.set(localAllowed);
    this.localRestrictedFoods.set(localRestricted);
    this.pendingChanges.set(changes);
  }

  /**
   * Toggle restricted status locally (no API call)
   * Updates local state and tracks pending change
   */
  toggleRestrictedLocal(foodId: number): void {
    const localAllowed = new Set(this.localAllowedFoods());
    const localRestricted = new Set(this.localRestrictedFoods());
    const changes = new Map(this.pendingChanges());

    const wasAllowed = localAllowed.has(foodId);
    const wasRestricted = localRestricted.has(foodId);
    const serverAllowedPrefId = this.serverAllowedFoods().get(foodId);
    const serverRestrictedPrefId = this.serverRestrictedFoods().get(foodId);

    if (wasRestricted) {
      // Currently restricted -> remove it
      localRestricted.delete(foodId);

      if (serverRestrictedPrefId) {
        // Was saved on server, need to delete
        changes.set(foodId, { foodId, type: 'remove', originalPreferenceId: serverRestrictedPrefId });
      } else {
        // Was only local (pending add), just remove the pending change
        changes.delete(foodId);
      }
    } else {
      // Not restricted -> make it restricted
      localRestricted.add(foodId);

      // If it was allowed, remove from allowed
      if (wasAllowed) {
        localAllowed.delete(foodId);
      }

      // Track the change
      if (serverRestrictedPrefId) {
        // Already saved as restricted on server, no change needed
        changes.delete(foodId);
      } else if (serverAllowedPrefId) {
        // Was allowed on server, need to delete that and add restricted
        changes.set(foodId, { foodId, type: 'add-restricted', originalPreferenceId: serverAllowedPrefId });
      } else {
        // New preference
        changes.set(foodId, { foodId, type: 'add-restricted' });
      }
    }

    this.localAllowedFoods.set(localAllowed);
    this.localRestrictedFoods.set(localRestricted);
    this.pendingChanges.set(changes);
  }

  /**
   * Save all pending changes to the server
   * Returns observable that completes when all changes are saved
   */
  saveAllChanges(): Observable<void> {
    const changes = Array.from(this.pendingChanges().values());

    if (changes.length === 0) {
      return of(undefined);
    }

    // Separate into deletes and creates
    const toDelete: number[] = [];
    const toCreate: CreatePreferenceItem[] = [];

    for (const change of changes) {
      // If there's an original preference to remove, delete it first
      if (change.originalPreferenceId) {
        toDelete.push(change.originalPreferenceId);
      }

      // Add new preferences
      if (change.type === 'add-allowed') {
        toCreate.push({ foodId: change.foodId, allowed: true });
      } else if (change.type === 'add-restricted') {
        toCreate.push({ foodId: change.foodId, allowed: false });
      }
      // 'remove' type only deletes, doesn't create
    }

    // Chain operations: delete first, then create, then refresh
    let operation$: Observable<unknown> = of(null);

    // Bulk delete if needed
    if (toDelete.length > 0) {
      operation$ = this.http.request<{ deleted: number }>('DELETE', `${this.baseUrl}/user/preferences`, {
        body: { preferenceIds: toDelete }
      });
    }

    // Bulk create if needed (chain after delete)
    if (toCreate.length > 0) {
      operation$ = operation$.pipe(
        switchMap(() => this.http.post<CreatePreferenceResponse>(`${this.baseUrl}/user/preferences`, { items: toCreate }))
      );
    }

    // Clear pending changes and refresh from server
    return operation$.pipe(
      tap(() => {
        // Clear pending changes immediately
        this.pendingChanges.set(new Map());
      }),
      // Refresh from server to get accurate preferenceIds
      switchMap(() => this.getAllPreferences()),
      // Map to void
      map(() => undefined)
    );
  }

  /**
   * Discard all pending changes and reset local state to match server
   */
  discardChanges(): void {
    this.localAllowedFoods.set(new Set(this.serverAllowedFoods().keys()));
    this.localRestrictedFoods.set(new Set(this.serverRestrictedFoods().keys()));
    this.pendingChanges.set(new Map());
  }

  /**
   * Clear all state (e.g., on logout)
   */
  clearAll(): void {
    this.serverAllowedFoods.set(new Map());
    this.serverRestrictedFoods.set(new Map());
    this.localAllowedFoods.set(new Set());
    this.localRestrictedFoods.set(new Set());
    this.pendingChanges.set(new Map());
  }
}
