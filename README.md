# 🧬 FitMind AI — Nutrition & Workout Planner v2.0

A fully free, locally-run AI nutrition and fitness planner using RAG (Retrieval-Augmented Generation) with streaming responses, animated macro charts, and a comprehensive chat interface.

## Tech Stack (100% Free)

| Component | Tool | Cost |
|-----------|------|------|
| LLM | Groq (Llama 3.3 70B) | Free tier |
| Embeddings | sentence-transformers (local) | Free forever |
| Vector DB | Qdrant (in-memory) | Free forever |
| Backend | FastAPI + SSE Streaming | Free forever |
| Frontend | HTML/JS + Chart.js + marked.js | Free forever |

## Key Features
- 🔴 **Real-time streaming** responses (Server-Sent Events)
- 📊 **Animated macro donut chart** (Chart.js)
- 🗂️ **Tabbed plan output** (Overview / Nutrition / Meals / Workout / Tips)
- ✨ **Natural language profile entry** — describe yourself in plain English
- 📋 **Copy & PDF export** for every generated plan
- 🏥 **Live BMI indicator** with goal alignment tip
- 💾 **Multi-profile LocalStorage** — save and switch between up to 5 profiles
- 📈 **Weight progress tracker** with sparkline chart
- 📚 **RAG sources panel** — see which knowledge base documents were retrieved
- 🔧 **Admin debug panel** (Ctrl+Shift+D)

---

## Project Structure

```
ai-nutrition-planner/
├── backend/
│   ├── __init__.py
│   ├── main.py          # FastAPI app + all routes
│   ├── calculator.py    # BMR, TDEE, macro calculator
│   ├── ingestion.py     # Document ingestion + ChromaDB + embeddings
│   └── planner.py       # RAG pipeline + Groq LLM
├── knowledge_base/
│   ├── fat_loss_diet.txt
│   ├── muscle_gain_diet.txt
│   ├── vegetarian_proteins.txt
│   └── workout_routines.txt
├── vector_store/        # Auto-created by ChromaDB
├── frontend/
│   └── index.html       # Chat UI
├── .env.example
├── requirements.txt
└── README.md
```

---

## Setup (Step by Step)

### 1. Clone and enter the project
```bash
cd ai-nutrition-planner
```

### 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```
> Note: First install will download the sentence-transformers model (~80MB). This happens once.

### 4. Get your FREE Groq API key
1. Go to https://console.groq.com
2. Sign up (no credit card required)
3. Create an API key

### 5. Set up your environment
```bash
cp .env.example .env
# Edit .env and add your Groq API key
```

### 6. Start the server
```bash
uvicorn backend.main:app --reload
```

The server will:
- Load the sentence-transformers embedding model
- Ingest all documents from `knowledge_base/`
- Start serving at http://localhost:8000

### 7. Open the frontend
Open `frontend/index.html` in your browser.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Detailed status |
| POST | `/plan` | Generate personalized plan + return RAG sources |
| POST | `/plan/stream` | **NEW** — Streaming plan via Server-Sent Events |
| POST | `/calculate` | Calculate macros only |
| POST | `/extract-profile` | Extract profile from natural language |
| POST | `/ingest` | Re-ingest knowledge base |
| GET | `/search?query=...` | Test vector search |
| GET | `/stats` | Vector store stats |
| GET | `/docs` | Interactive API docs (Swagger) |

---

## Example API Call

```bash
curl -X POST http://localhost:8000/plan \
  -H "Content-Type: application/json" \
  -d '{
    "age": 22,
    "height_cm": 175,
    "weight_kg": 70,
    "fitness_goal": "muscle_gain",
    "diet_preference": "vegetarian",
    "workout_days": 4,
    "gender": "male",
    "question": "Give me a weekly meal plan and workout routine"
  }'
```

---

## Adding More Knowledge

Just add more `.txt` files to the `knowledge_base/` folder, then call:
```bash
curl -X POST http://localhost:8000/ingest
```
Or restart the server (ingestion runs automatically on startup).

---

## How RAG Works Here

```
User Question
     │
     ▼
Embed query (sentence-transformers, local)
     │
     ▼
Search ChromaDB → top 4 relevant chunks
     │
     ▼
Build prompt: profile + macros + context + question
     │
     ▼
Send to Groq (Llama 3.3 70B, free)
     │
     ▼
Personalized nutrition + workout plan
```
