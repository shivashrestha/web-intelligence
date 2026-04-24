from __future__ import annotations

from dataclasses import dataclass, asdict, field
from typing import Dict, List, Sequence
import hashlib
import re

from .scraper import PageContent


@dataclass
class DocumentChunk:
    chunk_id: str
    url: str
    title: str
    section_title: str
    text: str
    token_estimate: int
    source_hash: str
    anchor_url: str = field(default="")

    def to_dict(self):
        return asdict(self)


def estimate_tokens(text: str) -> int:
    return max(1, len(text.split()) // 0.75)


def split_text(text: str, max_words: int = 360, overlap_words: int = 60) -> List[str]:
    words = re.split(r"\s+", text.strip())
    words = [w for w in words if w]
    if not words:
        return []
    chunks = []
    start = 0
    while start < len(words):
        end = min(len(words), start + max_words)
        chunk = " ".join(words[start:end]).strip()
        if chunk:
            chunks.append(chunk)
        if end == len(words):
            break
        start = max(0, end - overlap_words)
    return chunks


def chunk_pages(
    pages: Sequence[PageContent], max_words: int = 360, overlap_words: int = 60
) -> List[DocumentChunk]:
    chunks: List[DocumentChunk] = []
    for page in pages:
        base_url = page.final_url or page.url
        for sec_idx, sec in enumerate(page.sections):
            # Build a direct anchor URL for this section when an anchor is known
            anchor_url = f"{base_url}#{sec.anchor}" if sec.anchor else base_url
            for part_idx, part in enumerate(
                split_text(sec.text, max_words=max_words, overlap_words=overlap_words)
            ):
                payload = f"{page.url}|{page.title}|{sec.title}|{sec_idx}|{part_idx}|{part}"
                chunk_id = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]
                source_hash = hashlib.sha256(part.encode("utf-8")).hexdigest()
                chunks.append(
                    DocumentChunk(
                        chunk_id=chunk_id,
                        url=base_url,
                        title=page.title,
                        section_title=sec.title,
                        text=part,
                        token_estimate=estimate_tokens(part),
                        source_hash=source_hash,
                        anchor_url=anchor_url,
                    )
                )
    return chunks


def build_source_map(chunks: Sequence[DocumentChunk]) -> Dict[str, List[DocumentChunk]]:
    source_map: Dict[str, List[DocumentChunk]] = {}
    for c in chunks:
        source_map.setdefault(c.url, []).append(c)
    return source_map
