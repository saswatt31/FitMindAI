from dataclasses import dataclass
from typing import Literal

@dataclass
class UserProfile:
    age: int
    height_cm: float
    weight_kg: float
    fitness_goal: Literal["fat_loss", "muscle_gain", "maintenance"]
    diet_preference: Literal["vegetarian", "vegan", "omnivore"]
    workout_days: int  # 1-7 days per week
    gender: Literal["male", "female"] = "male"

ACTIVITY_MULTIPLIERS = {
    1: 1.2,
    2: 1.375,
    3: 1.375,
    4: 1.55,
    5: 1.55,
    6: 1.725,
    7: 1.9
}

def calculate_bmr(profile: UserProfile) -> float:
    """Mifflin-St Jeor equation"""
    base = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age
    return base + 5 if profile.gender == "male" else base - 161

def calculate_nutrition(profile: UserProfile) -> dict:
    bmr = calculate_bmr(profile)
    tdee = bmr * ACTIVITY_MULTIPLIERS.get(profile.workout_days, 1.375)

    if profile.fitness_goal == "fat_loss":
        calories = tdee - 500
        protein_g = profile.weight_kg * 2.2
        fat_g = profile.weight_kg * 0.8
    elif profile.fitness_goal == "muscle_gain":
        calories = tdee + 300
        protein_g = profile.weight_kg * 2.0
        fat_g = profile.weight_kg * 1.0
    else:  # maintenance
        calories = tdee
        protein_g = profile.weight_kg * 1.8
        fat_g = profile.weight_kg * 0.9

    fat_calories = fat_g * 9
    protein_calories = protein_g * 4
    carb_calories = calories - fat_calories - protein_calories
    carb_g = max(carb_calories / 4, 50)

    return {
        "bmr": round(bmr),
        "tdee": round(tdee),
        "target_calories": round(calories),
        "protein_g": round(protein_g),
        "carbs_g": round(carb_g),
        "fat_g": round(fat_g),
    }
