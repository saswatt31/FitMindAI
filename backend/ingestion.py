import os
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from dotenv import load_dotenv

load_dotenv()

# Initialize FastEmbed (Ultra-lightweight, fits in 512MB)
# This downloads a ~30MB model on first run and uses ONNX (no PyTorch)
print("Loading FastEmbed model...")
embed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
print("FastEmbed model loaded.")

# Initialize Qdrant in-memory
client = QdrantClient(":memory:")
COLLECTION = "nutrition_kb"
VECTOR_SIZE = 384  # bge-small-en-v1.5 size

# Create collection
client.recreate_collection(
    collection_name=COLLECTION,
    vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE)
)


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
    """Generate embeddings using FastEmbed (Local, Lightweight)."""
    # FastEmbed returns an iterator of numpy arrays
    embeddings_iter = embed_model.embed(texts)
    return [e.tolist() for e in embeddings_iter]


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
        # Generate embeddings locally
        vectors.extend(embed(chunks))

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
