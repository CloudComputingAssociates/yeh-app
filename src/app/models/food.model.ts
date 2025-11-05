// src/app/models/food.model.ts
// Food model matching the API structure
export interface Food {
  id: number;  // SQL FoodID - required for backend
  description: string;
  nutritionFacts?: NutritionFacts;
  servingSizeMultiplicand?: number;
  brandInfo?: BrandInfo;
  nutritionFactsImage?: string;
  foodImage?: string;
  nutritionFactsStatus?: string;
}

export interface NutritionFacts {
  foodName: string;
  calories: number;
  totalFatG: number;
  saturatedFatG: number;
  transFatG: number;
  cholesterolMG: number;
  sodiumMG: number;
  totalCarbohydrateG: number;
  dietaryFiberG: number;
  totalSugarsG: number;
  addedSugarsG: number;
  proteinG: number;
  vitaminDMcg: number;
  calciumMG: number;
  ironMG: number;
  potassiumMG: number;
  servingSizeHousehold: string;
  servingSizeG: number;
  servingsPerContainer: number;
}

export interface BrandInfo {
  nutritionSiteCandidates?: string[];
  productImageSiteCandidates?: string[];
}

// Search response from API
export interface FoodSearchResponse {
  count: number;
  foods: Food[];
}
