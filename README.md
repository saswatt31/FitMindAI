# 🧬 FitMind AI — Nutrition & Workout Planner v2.0

A fully free, production-ready AI nutrition and fitness planner using RAG (Retrieval-Augmented Generation) with streaming responses, vision-enabled meal analysis, and a high-performance Next.js interface.

## Tech Stack (Optimized for Free Tier)

| Component | Tool | Why? |
|-----------|------|------|
| **Frontend** | Next.js 15+ (React 19) | Premium UI, App Router, Vercel ready |
| **LLM** | Groq (Llama 3.3 70B) | Instant responses, free tier |
| **Embeddings** | FastEmbed (Local) | Ultra-lightweight, no 404 errors, fits in 512MB |
| **Vector DB** | Qdrant (In-Memory) | Blazing fast retrieval, zero-config |
| **Backend** | FastAPI | High-performance Python API |
| **Vision AI** | Groq Llama 3.2 Vision | Instant food identification from photos |

## Key Features
- 🔴 **Real-time streaming** responses via Server-Sent Events (SSE)
- 📸 **Vision AI** — upload meal photos for instant macro estimations
- 📊 **Animated Charts** — interactive macro donut charts and weight trackers
- 🛒 **AI Shopping List** — automatically categorize ingredients from your plans
- 📋 **PDF Export** — download your personalized protocols instantly
- 🗂️ **Tabbed Results** — clean separation of Overview, Nutrition, Meals, and Workouts
- 💾 **Local Persistence** — your profiles and history stay on your device

---

## Project Structure

```
FitMindAI/
├── backend/            # FastAPI Application
│   ├── main.py         # API routes & lifespan
│   ├── ingestion.py    # FastEmbed RAG pipeline
│   ├── planner.py      # LLM logic & vision analysis
│   └── calculator.py   # Nutrition formulas
├── frontend/           # Next.js Application
├── knowledge_base/     # Your .txt data for RAG
├── Dockerfile          # Production deployment config
├── vercel.json         # Frontend deployment config
└── requirements.txt    # Python dependencies
```

---

## Quick Start (Local)

### 1. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows

# Install lightweight dependencies
pip install -r requirements.txt

# Start the API
uvicorn backend.main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file in the root (and add these to Render/Vercel):

```bash
# GROQ API Key (from https://console.groq.com)
GROQ_API_KEY=your_key_here

# For Production (Vercel Frontend)
NEXT_PUBLIC_API_URL=your_backend_url_on_render
```

---

## Deployment Strategy

### 🛰️ Backend (Render / Railway)
- **Deployment Type**: Docker
- **Root Directory**: `./`
- **Why?**: The custom `Dockerfile` handles the lightweight `FastEmbed` model perfectly within the 512MB free tier.

### 🌐 Frontend (Vercel)
- **Deployment Type**: Next.js
- **Root Directory**: `./`
- **Why?**: Uses `vercel.json` to correctly route the `frontend/` subdirectory while keeping the root clean.

---

## How the RAG Pipeline Works
1. **Ingest**: On startup, `FastEmbed` chunks and embeds `.txt` files from `knowledge_base/`.
2. **Search**: When you ask a question, the AI searches the local Qdrant store for the most relevant context.
3. **Generate**: Groq's Llama 3.3 70B combines your profile, macros, and the retrieved context to build a perfect plan.
