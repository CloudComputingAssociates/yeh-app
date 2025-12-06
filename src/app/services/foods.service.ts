// src/app/services/foods.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FoodSearchResponse } from '../models/food.model';

@Injectable({
  providedIn: 'root'
})
export class FoodsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  /**
   * Search for foods by query string
   * @param query - Search term (food name/description)
   * @param limit - Maximum number of results to return (default: 50)
   * @returns Observable of search results with count and foods array
   */
  searchFoods(query: string, limit: number = 50): Observable<FoodSearchResponse> {
    const url = `${this.baseUrl}/foods/search?query=${encodeURIComponent(query)}&limit=${limit}`;
    return this.http.get<FoodSearchResponse>(url);
  }

  /**
   * Get all YEH-approved foods
   * @param limit - Maximum number of results to return (default: 50)
   * @returns Observable of search results with count and foods array
   */
  searchYehApprovedFoods(limit: number = 50): Observable<FoodSearchResponse> {
    const url = `${this.baseUrl}/foods/search/all/yehapproved?limit=${limit}`;
    return this.http.get<FoodSearchResponse>(url);
  }

  /**
   * Get image URL for a food image ObjectId
   * @param objectId - MongoDB ObjectId of the image
   * @returns Full URL to the image
   */
  getImageUrl(objectId: string): string {
    return `${this.baseUrl}/images/${objectId}`;
  }
}
