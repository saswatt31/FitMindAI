import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserProfile, NutritionTargets, FitnessGoal, Gender } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function calculateBMI(heightCm: number, weightKg: number) {
  if (!heightCm || !weightKg) return 0;
  return weightKg / Math.pow(heightCm / 100, 2);
}

export function getBMICategory(bmi: number) {
  if (bmi < 18.5) return { category: "Underweight", color: "#60a5fa", tip: "💡 Consider a muscle gain or maintenance goal." };
  if (bmi < 25) return { category: "Normal", color: "#4ade80", tip: "✅ Healthy range — great for any fitness goal!" };
  if (bmi < 30) return { category: "Overweight", color: "#fbbf24", tip: "🔥 Fat loss goal is well-suited for your BMI." };
  return { category: "Obese", color: "#f87171", tip: "⚠️ Consult a healthcare professional first." };
}

export function calculateNutritionTargets(profile: UserProfile): NutritionTargets {
  const { age, height_cm, weight_kg, fitness_goal, workout_days, gender } = profile;
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  const bmr = Math.round(gender === "male" ? base + 5 : base - 161);
  const multipliers = [0, 1.2, 1.375, 1.375, 1.55, 1.55, 1.725, 1.9];
  const tdee = Math.round(bmr * (multipliers[workout_days] || 1.375));

  let calories, protein, fat;
  if (fitness_goal === "fat_loss") {
    calories = tdee - 500;
    protein = weight_kg * 2.2;
    fat = weight_kg * 0.8;
  } else if (fitness_goal === "muscle_gain") {
    calories = tdee + 300;
    protein = weight_kg * 2.0;
    fat = weight_kg * 1.0;
  } else {
    calories = tdee;
    protein = weight_kg * 1.8;
    fat = weight_kg * 0.9;
  }

  const carbs = Math.round(Math.max((calories - fat * 9 - protein * 4) / 4, 50));
  return {
    bmr,
    tdee,
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs,
  };
}

export const API_BASE = "http://localhost:8000";

export async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(id);
  return response;
}
