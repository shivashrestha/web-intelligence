from __future__ import annotations

import hashlib
import json
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Sequence

from pinecone import Pinecone, ServerlessSpec

from processor import DocumentChunk

PINECONE_API_KEY = os.getenv("PINECONE_API", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX", "web-intelligence")
PINECONE_EMBED_MODEL = "multilingual-e5-large"
EMBEDDING_DIM = 1024
_EMBED_BATCH = 96
_UPSERT_BATCH = 100
_MIN_SCORE = 0.20


@dataclass
class IndexedKnowledgeBase:
    session_id: str
    chunks: List[DocumentChunk]
    dim: int


class EmbeddingStore:
    def __init__(self, storage_dir: str | Path):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self._pc = Pinecone(api_key=PINECONE_API_KEY)
        self._index = self._ensure_index()

    def _ensure_index(self):
        existing_names = [i.name for i in self._pc.list_indexes()]
        if PINECONE_INDEX_NAME not in existing_names:
            self._pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=EMBEDDING_DIM,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            while not self._pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
                time.sleep(0.5)
        return self._pc.Index(PINECONE_INDEX_NAME)

    def _chunk_path(self, session_id: str) -> Path:
        d = self.storage_dir / session_id
        d.mkdir(parents=True, exist_ok=True)
        return d / "chunks.json"

    def _embed(self, texts: List[str], input_type: str) -> List[List[float]]:
        all_vectors: List[List[float]] = []
        for i in range(0, len(texts), _EMBED_BATCH):
            batch = texts[i:i + _EMBED_BATCH]
            response = self._pc.inference.embed(
                model=PINECONE_EMBED_MODEL,
                inputs=batch,
                parameters={"input_type": input_type, "truncate": "END"},
            )
            all_vectors.extend([e.values for e in response.data])
        return all_vectors

    def build(self, session_id: str, chunks: Sequence[DocumentChunk]) -> IndexedKnowledgeBase:
        valid_chunks = [c for c in chunks if c.text and c.text.strip()]
        texts = [c.text for c in valid_chunks]
        if not texts:
            raise ValueError("Cannot build embeddings: no non-empty text chunks were provided.")

        vectors_values = self._embed(texts, "passage")

        vectors = [
            {
                "id": f"{session_id}#{i}",
                "values": v,
                "metadata": {"session_id": session_id, "idx": i, "url": valid_chunks[i].url},
            }
            for i, v in enumerate(vectors_values)
        ]

        for i in range(0, len(vectors), _UPSERT_BATCH):
            self._index.upsert(vectors=vectors[i:i + _UPSERT_BATCH], namespace=session_id)

        self._chunk_path(session_id).write_text(
            json.dumps([c.to_dict() for c in valid_chunks], ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        return IndexedKnowledgeBase(session_id=session_id, chunks=list(valid_chunks), dim=EMBEDDING_DIM)

    def load(self, session_id: str) -> Optional[tuple[bool, List[DocumentChunk]]]:
        path = self._chunk_path(session_id)
        if not path.exists():
            return None
        raw = json.loads(path.read_text(encoding="utf-8"))
        chunks = [DocumentChunk(**{**c, "anchor_url": c.get("anchor_url", "")}) for c in raw]
        return True, chunks

    def fork_chunks(self, source_session_id: str, dest_session_id: str) -> None:
        """Copy chunks metadata so a forked session can share the same Pinecone vectors."""
        src = self._chunk_path(source_session_id)
        if src.exists():
            import shutil
            shutil.copy2(src, self._chunk_path(dest_session_id))

    def query(self, session_id: str, question: str, top_k: int = 5, vector_namespace: Optional[str] = None) -> List[dict]:
        namespace = vector_namespace or session_id
        loaded = self.load(session_id)
        if loaded is None:
            raise ValueError("Knowledge base not found")
        _, chunks = loaded

        q_vec = self._embed([question], "query")[0]
        results = self._index.query(
            vector=q_vec,
            top_k=top_k,
            namespace=namespace,
            include_metadata=True,
        )

        output = []
        for match in results.matches:
            if float(match.score) < _MIN_SCORE:
                continue
            idx = int(match.metadata["idx"])
            if idx < len(chunks):
                output.append({"score": float(match.score), "chunk": chunks[idx].to_dict()})
        return output

    def delete(self, session_id: str) -> None:
        try:
            self._index.delete(delete_all=True, namespace=session_id)
        except Exception:
            pass
        chunk_dir = self.storage_dir / session_id
        if chunk_dir.exists():
            import shutil
            shutil.rmtree(chunk_dir, ignore_errors=True)


def session_id_from_urls(urls: Sequence[str]) -> str:
    canonical = "|".join(sorted(urls))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]
