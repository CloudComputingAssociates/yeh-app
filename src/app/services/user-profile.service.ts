// src/app/services/user-profile.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { 
  NutritionResponse, 
  TimePeriod 
} from '../models/nutrition.model';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  
  // Current time period selection
  private currentPeriodSubject = new BehaviorSubject<TimePeriod>('day');
  public readonly currentPeriod$ = this.currentPeriodSubject.asObservable();

  // Static nutrition data for development
  private staticNutritionData: NutritionResponse = {
    nutrients: {
      protein: {
        'target-percent': 30,
        'target-grams': 150,
        'actual-day': 113,      // 75% of target (113/150 = 75.3%)
        'actual-week': 945      // Average across week
      },
      fat: {
        'target-percent': 35,
        'target-grams': 78,
        'actual-day': 35,       // 45% of target (35/78 = 44.9%)
        'actual-week': 468      // Average across week
      },
      carb: {
        'target-percent': 35,
        'target-grams': 175,
        'actual-day': 39,       // 22% of target (39/175 = 22.3%)
        'actual-week': 980      // Average across week
      }
    }
  };

  // Reactive nutrition data subject
  private nutritionDataSubject = new BehaviorSubject<NutritionResponse>(this.staticNutritionData);
  public readonly nutritionData$ = this.nutritionDataSubject.asObservable();

  /**
   * Get current nutrition data with calculated progress percentages
   * Returns data formatted for easy component binding
   * 
   * REST API Endpoint: GET /api/user/nutrition
   */
  getNutrition(): Observable<NutritionResponse> {
    // Simulate API call delay
    return of(this.staticNutritionData).pipe(
      delay(300) // Simulate network delay
    );

    // Future API implementation (commented out):
    /*
    return this.http.get<NutritionResponse>('/api/user/nutrition')
      .pipe(
        tap(data => this.nutritionDataSubject.next(data)),
        catchError(error => {
          console.error('Error fetching nutrition data:', error);
          return of(this.staticNutritionData); // Fallback to static data
        })
      );
    */
  }

  /**
   * Set the current time period for display
   * @param period - 'day' or 'week'
   */
  setTimePeriod(period: TimePeriod): void {
    this.currentPeriodSubject.next(period);
  }

  /**
   * Get the current time period
   */
  getCurrentTimePeriod(): TimePeriod {
    return this.currentPeriodSubject.value;
  }

  /**
   * Get current nutrition data value (synchronous)
   */
  getCurrentNutritionData(): NutritionResponse {
    return this.nutritionDataSubject.value;
  }
}