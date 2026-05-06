import os
from google import genai
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini for Embeddings
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_KEY:
    genai_client = genai.Client(api_key=GEMINI_KEY)
else:
    genai_client = None
    print("Warning: GEMINI_API_KEY not found. Embeddings will fail.")

# Initialize Qdrant in-memory
client = QdrantClient(":memory:")
COLLECTION = "nutrition_kb"
VECTOR_SIZE = 768  # Standard size for Gemini embeddings

# Create collection
client.recreate_collection(
    collection_name=COLLECTION,
    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
)

# List of models to try (some regions/versions prefer different names)
EMBEDDING_MODELS = ["text-embedding-004", "embedding-001"]
_WORKING_MODEL = None


def chunk_text(text: str, chunk_size: int = 150, overlap: int = 20) -> list[str]:
    """Split text into overlapping word chunks."""
    words = text.split()
    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk:
            chunks.append(chunk)
    return chunks


def embed(texts: list[str]) -> list[list[float]]:
    """Generate embeddings with automatic model fallback."""
    global _WORKING_MODEL
    if not genai_client:
        raise ValueError("GEMINI_API_KEY is not set.")

    # If we already found a working model, use it
    models_to_try = [_WORKING_MODEL] if _WORKING_MODEL else EMBEDDING_MODELS
    
    last_error = None
    for model_name in models_to_try:
        try:
            response = genai_client.models.embed_content(
                model=model_name,
                contents=texts
            )
            _WORKING_MODEL = model_name  # Save the working model
            return [item.values for item in response.embeddings]
        except Exception as e:
            last_error = e
            continue
            
    raise last_error


def ingest_documents(folder: str = None):
    """Load .txt files, chunk, embed, and store in Qdrant."""
    if folder is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        folder = os.path.join(base_dir, "knowledge_base")
    
    if not os.path.exists(folder):
        print(f"Knowledge base folder not found: {folder}")
        return

    docs, vectors = [], []

    for fname in os.listdir(folder):
        if not fname.endswith(".txt"):
            continue

        fpath = os.path.join(folder, fname)
        with open(fpath, "r", encoding="utf-8") as f:
            text = f.read()

        chunks = chunk_text(text)
        print(f"  {fname}: {len(chunks)} chunks")

        if not chunks:
            continue

        docs.extend([{"text": c, "source": fname} for c in chunks])
        try:
            vectors.extend(embed(chunks))
        except Exception as e:
            print(f"  Error embedding {fname}: {e}")
            continue

    if not docs:
        print("No documents found to ingest.")
        return

    print(f"\nStoring {len(docs)} chunks in Qdrant...")
    points = [
        PointStruct(id=i, vector=vectors[i], payload=docs[i])
        for i in range(len(docs))
    ]
    client.upsert(collection_name=COLLECTION, points=points)
    print(f"Successfully ingested {len(docs)} chunks.")


def retrieve(query: str, top_k: int = 4) -> list[dict]:
    """Embed query and retrieve top-k relevant chunks from Qdrant."""
    query_vec = embed([query])[0]
    results = client.query_points(
        collection_name=COLLECTION,
        query=query_vec,
        limit=top_k
    )
    return [
        {
            "text": r.payload["text"],
            "source": r.payload["source"],
            "relevance": round(r.score, 3)
        }
        for r in results.points
    ]


def get_collection_stats() -> dict:
    """Return basic stats about the vector store."""
    info = client.get_collection(COLLECTION)
    return {"total_chunks": info.points_count}
