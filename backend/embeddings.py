from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Sequence, Tuple
import json
import pickle
import hashlib

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from .processor import DocumentChunk

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

@dataclass
class IndexedKnowledgeBase:
    session_id: str
    chunks: List[DocumentChunk]
    index_path: Path
    meta_path: Path
    dim: int

model = SentenceTransformer("all-MiniLM-L6-v2")

def embed_text(text: str):
    return model.encode(text)

class EmbeddingStore:
    def __init__(self, storage_dir: str | Path):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.model = SentenceTransformer(MODEL_NAME)

    def _paths(self, session_id: str):
        d = self.storage_dir / session_id
        d.mkdir(parents=True, exist_ok=True)
        return {
            "index": d / "index.faiss",
            "chunks": d / "chunks.json",
            "meta": d / "meta.json",
        }

    def _normalize(self, vectors: np.ndarray) -> np.ndarray:
        faiss.normalize_L2(vectors)
        return vectors

    def build(self, session_id: str, chunks: Sequence[DocumentChunk]) -> IndexedKnowledgeBase:
        paths = self._paths(session_id)
        texts = [c.text for c in chunks if c.text and c.text.strip()]
        if not texts:
            raise ValueError("Cannot build embeddings: no non-empty text chunks were provided.")
        embeddings = self.model.encode(texts, show_progress_bar=False, convert_to_numpy=True, batch_size=16)
        embeddings = embeddings.astype("float32")
        self._normalize(embeddings)

        index = faiss.IndexFlatIP(embeddings.shape[1])
        index.add(embeddings)

        faiss.write_index(index, str(paths["index"]))
        paths["chunks"].write_text(
            json.dumps([c.to_dict() for c in chunks], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        paths["meta"].write_text(
            json.dumps(
                {
                    "session_id": session_id,
                    "num_chunks": len(chunks),
                    "model": MODEL_NAME,
                    "dim": embeddings.shape[1],
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        return IndexedKnowledgeBase(
            session_id=session_id,
            chunks=list(chunks),
            index_path=paths["index"],
            meta_path=paths["meta"],
            dim=embeddings.shape[1],
        )

    def load(self, session_id: str) -> tuple[faiss.Index, List[DocumentChunk]] | None:
        paths = self._paths(session_id)
        if not paths["index"].exists() or not paths["chunks"].exists():
            return None
        index = faiss.read_index(str(paths["index"]))
        raw_chunks = json.loads(paths["chunks"].read_text(encoding="utf-8"))
        chunks = [DocumentChunk(**{**c, "anchor_url": c.get("anchor_url", "")}) for c in raw_chunks]
        return index, chunks

    def query(self, session_id: str, question: str, top_k: int = 5):
        loaded = self.load(session_id)
        if loaded is None:
            raise ValueError("Knowledge base not found")
        index, chunks = loaded
        q = self.model.encode([question], convert_to_numpy=True).astype("float32")
        faiss.normalize_L2(q)
        scores, ids = index.search(q, top_k)
        results = []
        for score, idx in zip(scores[0].tolist(), ids[0].tolist()):
            if idx == -1:
                continue
            chunk = chunks[idx]
            results.append({"score": float(score), "chunk": chunk.to_dict()})
        return results

def session_id_from_urls(urls: Sequence[str]) -> str:
    canonical = "|".join(sorted(urls))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]
