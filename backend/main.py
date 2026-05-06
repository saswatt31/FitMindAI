import os
import sys
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Add the current directory to sys.path to allow sibling imports (calculator, ingestion, planner)
# This is necessary when running via uvicorn from the project root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from calculator import UserProfile, calculate_nutrition
from ingestion import ingest_documents, get_collection_stats, retrieve
from planner import (
    generate_plan,
    generate_plan_stream,
    extract_profile_from_text,
    analyze_meal_image,
    generate_shopping_list
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-ingest documents on startup."""
    print("Starting AI Nutrition Planner...")
    print("Ingesting knowledge base documents...")
    ingest_documents()
    stats = get_collection_stats()
    print(f"Vector store ready: {stats['total_chunks']} chunks indexed.")
    yield
    print("Shutting down...")


app = FastAPI(
    title="AI Nutrition & Workout Planner",
    description="Free RAG-powered nutrition and fitness planning API",
    version="2.0.0",
    lifespan=lifespan
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ─────────────────────────────────────────────────

class PlanRequest(BaseModel):
    age: int = Field(..., ge=10, le=100)
    height_cm: float = Field(..., ge=100, le=250)
    weight_kg: float = Field(..., ge=30, le=300)
    fitness_goal: str = Field(..., pattern="^(fat_loss|muscle_gain|maintenance)$")
    diet_preference: str = Field(..., pattern="^(vegetarian|vegan|omnivore)$")
    workout_days: int = Field(..., ge=1, le=7)
    gender: str = Field(default="male", pattern="^(male|female)$")
    question: str = Field(..., min_length=5, max_length=500)
    chat_history: Optional[list] = Field(default=None)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=2, max_length=1000)


class NutritionResponse(BaseModel):
    bmr: int
    tdee: int
    target_calories: int
    protein_g: int
    carbs_g: int
    fat_g: int


# ─── API Endpoints ────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "AI Nutrition & Workout Planner API v2.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
def health():
    stats = get_collection_stats()
    return {
        "status": "healthy",
        "vector_store_chunks": stats["total_chunks"],
        "groq_api_key_set": bool(os.getenv("GROQ_API_KEY"))
    }


@app.post("/calculate", response_model=NutritionResponse)
def calculate(
    age: int, height_cm: float, weight_kg: float,
    fitness_goal: str, diet_preference: str,
    workout_days: int, gender: str = "male"
):
    """Calculate BMR, TDEE, and macro targets without generating a plan."""
    profile = UserProfile(
        age=age, height_cm=height_cm, weight_kg=weight_kg,
        fitness_goal=fitness_goal, diet_preference=diet_preference,
        workout_days=workout_days, gender=gender
    )
    return calculate_nutrition(profile)


@app.post("/plan")
def get_plan(req: PlanRequest):
    """Generate a full personalized nutrition and workout plan using RAG + LLM."""
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in environment.")

    profile = UserProfile(
        age=req.age,
        height_cm=req.height_cm,
        weight_kg=req.weight_kg,
        fitness_goal=req.fitness_goal,
        diet_preference=req.diet_preference,
        workout_days=req.workout_days,
        gender=req.gender
    )

    nutrition = calculate_nutrition(profile)
    plan, sources = generate_plan(profile, req.question, req.chat_history)

    return {
        "plan": plan,
        "nutrition_targets": nutrition,
        "profile": {
            "fitness_goal": req.fitness_goal,
            "diet_preference": req.diet_preference,
            "workout_days": req.workout_days
        },
        "sources": sources
    }


@app.post("/plan/stream")
def get_plan_stream(req: PlanRequest):
    """Stream a personalized plan via Server-Sent Events (SSE)."""
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set in environment.")

    profile = UserProfile(
        age=req.age,
        height_cm=req.height_cm,
        weight_kg=req.weight_kg,
        fitness_goal=req.fitness_goal,
        diet_preference=req.diet_preference,
        workout_days=req.workout_days,
        gender=req.gender
    )

    stream, sources, nutrition = generate_plan_stream(profile, req.question, req.chat_history)

    def event_generator():
        # First send metadata (nutrition targets + RAG sources)
        meta_payload = {
            "type": "meta",
            "nutrition": nutrition,
            "sources": sources
        }
        yield f"data: {json.dumps(meta_payload)}\n\n"

        # Stream text chunks from Groq
        token_count = 0
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                token_count += 1
                yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"

        # Signal completion
        yield f"data: {json.dumps({'type': 'done', 'approx_tokens': token_count * 4})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@app.post("/extract-profile")
def extract_profile(req: ChatRequest):
    """Extract structured profile data from natural language text."""
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")
    extracted = extract_profile_from_text(req.message)
    return {"extracted": extracted}


@app.post("/ingest")
def ingest(folder: str = "./knowledge_base"):
    """Manually trigger document ingestion (useful after adding new .txt files)."""
    ingest_documents(folder=folder)
    stats = get_collection_stats()
    return {"status": "success", "total_chunks": stats["total_chunks"]}


@app.get("/search")
def search(query: str, top_k: int = 3):
    """Debug endpoint: test vector search directly."""
    results = retrieve(query, top_k=top_k)
    return {"query": query, "results": results}


@app.get("/stats")
def stats():
    """Get vector store statistics."""
    return get_collection_stats()


# ─── New Feature Endpoints ────────────────────────────────────────────────────

class MealImageRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded image string")
    media_type: str = Field(default="image/jpeg", description="MIME type, e.g. image/jpeg or image/png")


class ShoppingListRequest(BaseModel):
    meal_plan: str = Field(..., min_length=50, description="Full meal plan text from the AI")


@app.post("/analyze-meal")
def analyze_meal(req: MealImageRequest):
    """
    Vision AI endpoint: analyze a meal photo using Groq llama-3.2-11b-vision-preview.
    Returns identified foods, estimated macros, and confidence level.
    """
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")
    if not req.image_base64:
        raise HTTPException(status_code=400, detail="image_base64 is required.")

    result = analyze_meal_image(req.image_base64, req.media_type)
    return result


@app.post("/shopping-list")
def shopping_list(req: ShoppingListRequest):
    """
    Parse a meal plan and return a categorized shopping list using an LLM.
    Groups ingredients into Proteins, Vegetables, Grains, Dairy, Pantry, Beverages.
    """
    if not os.getenv("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set.")

    result = generate_shopping_list(req.meal_plan)
    return result
