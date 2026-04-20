import os
import json
from groq import Groq
from ingestion import retrieve
from calculator import UserProfile, calculate_nutrition

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are FitMind AI — an expert nutrition coach and personal trainer.
Provide personalized, actionable nutrition and workout plans based on the user's profile.

FORMATTING RULES — follow these strictly:
- Use markdown tables for meal plans, workout schedules, and macro breakdowns
- Use ## for main section headers
- Use ### for sub-section headers
- Use **bold** for food names, exercise names, and key numbers
- Use bullet points for tips and notes
- Always complete every section fully — never cut off mid-response

STRUCTURE your response like this:
## Overview
(2-3 sentence personalized summary)

## Daily Nutrition Targets
(markdown table with calories, protein, carbs, fat)

## Meal Plan
(markdown table: Meal | Foods | Calories | Protein)

## Workout Plan
(markdown table: Day | Muscle Group | Exercises | Sets x Reps)

## Key Tips
(bullet points)"""


def _build_messages(profile: UserProfile, user_question: str, chat_history: list = None):
    """Shared message builder for both streaming and non-streaming calls."""
    nutrition = calculate_nutrition(profile)

    retrieval_query = f"{profile.fitness_goal} {profile.diet_preference} nutrition workout {user_question}"
    relevant_chunks = retrieve(retrieval_query, top_k=3)
    context = "\n\n".join([f"[{c['source']}]\n{c['text']}" for c in relevant_chunks])

    user_message = f"""
USER PROFILE:
- Age: {profile.age} | Gender: {profile.gender}
- Height: {profile.height_cm}cm | Weight: {profile.weight_kg}kg
- Goal: {profile.fitness_goal} | Diet: {profile.diet_preference}
- Workout days/week: {profile.workout_days}

CALCULATED NUTRITION TARGETS:
- Daily Calories: {nutrition['target_calories']} kcal
- Protein: {nutrition['protein_g']}g | Carbs: {nutrition['carbs_g']}g | Fat: {nutrition['fat_g']}g
- BMR: {nutrition['bmr']} kcal | TDEE: {nutrition['tdee']} kcal

KNOWLEDGE BASE CONTEXT:
{context}

USER QUESTION: {user_question}

Generate a complete, detailed response. Use markdown tables wherever possible. Do not cut off — finish every section.
"""

    messages = []
    if chat_history:
        messages.extend(chat_history[-4:])
    messages.append({"role": "user", "content": user_message})

    return messages, relevant_chunks, nutrition


def generate_plan(profile: UserProfile, user_question: str, chat_history: list = None):
    """Generate a complete plan and return (plan_text, sources)."""
    messages, relevant_chunks, nutrition = _build_messages(profile, user_question, chat_history)

    print(f"Calling Groq API...")

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        max_tokens=4096,
        temperature=0.7,
        timeout=60,
    )

    print(f"Groq responded. Tokens used: {response.usage.total_tokens}")
    return response.choices[0].message.content, relevant_chunks


def generate_plan_stream(profile: UserProfile, user_question: str, chat_history: list = None):
    """Generate a streaming plan and return (stream, sources, nutrition)."""
    messages, relevant_chunks, nutrition = _build_messages(profile, user_question, chat_history)

    print(f"Calling Groq API (streaming)...")

    stream = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "system", "content": SYSTEM_PROMPT}] + messages,
        max_tokens=4096,
        temperature=0.7,
        timeout=60,
        stream=True,
    )

    return stream, relevant_chunks, nutrition


def extract_profile_from_text(user_text: str) -> dict:
    extraction_prompt = f"""Extract user fitness profile from this text. Return ONLY valid JSON.
If a field is not mentioned, use null.

Text: "{user_text}"

Return this exact JSON structure:
{{
  "age": number or null,
  "height_cm": number or null,
  "weight_kg": number or null,
  "fitness_goal": "fat_loss" or "muscle_gain" or "maintenance" or null,
  "diet_preference": "vegetarian" or "vegan" or "omnivore" or null,
  "workout_days": number (1-7) or null,
  "gender": "male" or "female" or null
}}"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": extraction_prompt}],
        max_tokens=200,
        temperature=0.1,
    )

    try:
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception:
        return {}


def analyze_meal_image(base64_image: str, media_type: str = "image/jpeg") -> dict:
    """
    Use Groq Vision (llama-3.2-11b-vision-preview) to analyze a meal photo.
    Returns estimated macro breakdown and food identification.
    """
    vision_prompt = """You are an expert nutritionist with computer vision capabilities.
Analyze this meal photo and provide a detailed nutritional breakdown.

Return your response in this EXACT JSON format (no markdown, pure JSON):
{
  "foods_detected": ["food1", "food2", ...],
  "estimated_portion": "description of portion sizes",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "confidence": "high" or "medium" or "low",
  "notes": "any important nutritional notes or caveats",
  "meal_type_suggestion": "breakfast" or "lunch" or "dinner" or "snack"
}

Be realistic with estimates. If the image is unclear, use "low" confidence.
Base estimates on standard serving sizes visible in the image."""

    response = client.chat.completions.create(
        model="llama-3.2-11b-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": vision_prompt
                    }
                ]
            }
        ],
        max_tokens=600,
        temperature=0.2,
    )

    try:
        text = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        text = text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        return {"success": True, "analysis": result}
    except Exception as e:
        # If JSON parse fails, return the raw text as a note
        return {
            "success": False,
            "raw": response.choices[0].message.content,
            "error": str(e)
        }


def generate_shopping_list(meal_plan_text: str) -> dict:
    """
    Parse a meal plan and generate a categorized shopping list.
    Uses fast llama-3.1-8b-instant for speed.
    """
    prompt = f"""You are a shopping assistant. Extract all ingredients from this meal plan and organize them into a categorized shopping list.

MEAL PLAN:
{meal_plan_text[:3000]}

Return ONLY valid JSON in this exact format:
{{
  "categories": [
    {{
      "category": "Proteins",
      "items": ["item1 (quantity)", "item2 (quantity)", ...]
    }},
    {{
      "category": "Vegetables & Fruits",
      "items": ["item1 (quantity)", ...]
    }},
    {{
      "category": "Grains & Carbs",
      "items": ["item1 (quantity)", ...]
    }},
    {{
      "category": "Dairy & Eggs",
      "items": ["item1 (quantity)", ...]
    }},
    {{
      "category": "Pantry & Condiments",
      "items": ["item1 (quantity)", ...]
    }}
  ]
}}

Rules:
- Group similar items together
- Include realistic quantities for a week
- Remove duplicates
- Keep items short and clear"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.1,
    )

    try:
        text = response.choices[0].message.content.strip()
        text = text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        return {"success": True, "categories": result.get("categories", [])}
    except Exception:
        return {"success": False, "raw": response.choices[0].message.content}