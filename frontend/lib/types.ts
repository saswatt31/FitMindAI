export type Gender = "male" | "female";
export type FitnessGoal = "fat_loss" | "muscle_gain" | "maintenance";
export type DietPreference = "vegetarian" | "vegan" | "omnivore";

export interface UserProfile {
  age: number;
  height_cm: number;
  weight_kg: number;
  fitness_goal: FitnessGoal;
  diet_preference: DietPreference;
  workout_days: number;
  gender: Gender;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FoodEntry {
  name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  time?: string;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface RAGSource {
  source: string;
  relevance: number;
  text: string;
}

export interface StreamMeta {
  type: "meta";
  nutrition: NutritionTargets;
  sources: RAGSource[];
}

export interface StreamChunk {
  type: "chunk";
  content: string;
}

export interface StreamDone {
  type: "done";
  approx_tokens?: number;
}

export type StreamEvent = StreamMeta | StreamChunk | StreamDone;
 
export interface GroceryItem {
  name: string;
  checked: boolean;
}

export interface GroceryCategory {
  category: string;
  items: GroceryItem[];
}
