import os
import uuid

import anthropic
import chromadb
from sentence_transformers import SentenceTransformer

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma_data")
COLLECTION_NAME = "documents"

_embedding_model = None
_chroma_client = None
_collection = None


def _get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


def _get_collection() -> chromadb.Collection:
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return [c.strip() for c in chunks if c.strip()]


def add_document(doc_id: str, filename: str, text: str) -> int:
    model = _get_embedding_model()
    collection = _get_collection()

    chunks = chunk_text(text)
    if not chunks:
        return 0

    embeddings = model.encode(chunks).tolist()
    ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "filename": filename, "chunk_index": i} for i in range(len(chunks))]

    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )
    return len(chunks)


def delete_document(doc_id: str) -> None:
    collection = _get_collection()
    results = collection.get(where={"doc_id": doc_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])


def retrieve(query: str, top_k: int = 5) -> list[dict]:
    model = _get_embedding_model()
    collection = _get_collection()

    if collection.count() == 0:
        return []

    query_embedding = model.encode([query]).tolist()
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(top_k, collection.count()),
    )

    chunks = []
    for i, doc in enumerate(results["documents"][0]):
        chunks.append({
            "text": doc,
            "metadata": results["metadatas"][0][i],
            "distance": results["distances"][0][i],
        })
    return chunks


def ask(question: str) -> dict:
    chunks = retrieve(question)

    if not chunks:
        return {
            "answer": "No documents have been uploaded yet. Please upload a document first.",
            "sources": [],
        }

    context = "\n\n---\n\n".join(
        f"[Source: {c['metadata']['filename']}]\n{c['text']}" for c in chunks
    )

    client = anthropic.Anthropic()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": f"""Answer the question based on the provided context. If the context doesn't contain enough information, say so.

Context:
{context}

Question: {question}""",
            }
        ],
    )

    sources = list({c["metadata"]["filename"] for c in chunks})
    return {
        "answer": message.content[0].text,
        "sources": sources,
    }
