from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .scraper import scrape_many, validate_url
from .processor import chunk_pages, build_source_map
from .embeddings import EmbeddingStore, session_id_from_urls
from .rag import answer_question, build_insights

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
SESSION_DIR = DATA_DIR / "sessions"
INDEX_DIR = DATA_DIR / "faiss_index"
COLLAB_FILE = DATA_DIR / "collaborations.json"
SESSION_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)

_SESSION_ID_RE = re.compile(r'^[a-zA-Z0-9_\-]{8,128}$')

app = FastAPI(
    title="Web Intelligence QA",
    version="2.0.0",
    description="AI website analyst",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = EmbeddingStore(INDEX_DIR)


class ProcessRequest(BaseModel):
    urls: List[str] = Field(..., min_length=1, max_length=10)
    session_id: Optional[str] = None


class QuestionRequest(BaseModel):
    session_id: str
    question: str = Field(..., min_length=3)
    top_k: int = 5


class ChatMessage(BaseModel):
    role: str
    content: str = Field(..., max_length=2000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: List[ChatMessage] = Field(default_factory=list)


class CollaborateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=200)
    linkedin: str = Field(default="", max_length=300)
    description: str = Field(..., min_length=10, max_length=2000)


def _session_file(session_id: str) -> Path:
    if not _SESSION_ID_RE.match(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID.")
    return SESSION_DIR / f"{session_id}.json"


def _save_session(session_id: str, payload: Dict[str, Any]):
    _session_file(session_id).write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def _load_session(session_id: str) -> Dict[str, Any]:
    path = _session_file(session_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    return json.loads(path.read_text(encoding="utf-8"))


def _aggregate_security(pages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Return security data from the seed page (most authoritative)."""
    for page in pages:
        sec = page.get("security")
        if sec:
            return sec
    return {}


def _build_security_block(security: Dict[str, Any]) -> Dict[str, Any]:
    """Build a structured insight block from factual scraped security data."""
    if not security:
        return {"title": "Website Security", "items": ["No source found."]}

    items: List[str] = []

    if security.get("https_enabled"):
        items.append("HTTPS Enabled ✅ — Encrypted connection in use")
    else:
        items.append("HTTP Only ⚠️ — No HTTPS, traffic is unencrypted")

    if security.get("ssl_valid"):
        items.append("SSL Certificate ✅ — Valid and trusted certificate")
    elif security.get("https_enabled"):
        items.append("SSL Certificate ⚠️ — Certificate could not be verified")

    if security.get("has_csp"):
        items.append("Content-Security-Policy ✅ — XSS protection header present")
    else:
        items.append("Content-Security-Policy ⚠️ — Header missing, XSS risk elevated")

    if security.get("has_x_frame_options"):
        val = security.get("x_frame_options", "")
        items.append(f"X-Frame-Options ✅ — Clickjacking protection active ({val})")
    else:
        items.append("X-Frame-Options ⚠️ — Header missing, clickjacking risk")

    if security.get("has_x_xss_protection"):
        val = security.get("x_xss_protection", "")
        items.append(f"X-XSS-Protection ✅ — Header present ({val})")
    else:
        items.append("X-XSS-Protection ⚠️ — Header missing")

    if security.get("has_cookies"):
        flags = []
        flags.append("Secure ✅" if security.get("cookies_secure") else "Secure ⚠️ missing")
        flags.append("HttpOnly ✅" if security.get("cookies_httponly") else "HttpOnly ⚠️ missing")
        items.append(f"Cookie Flags — {', '.join(flags)}")
    else:
        items.append("Cookies — None set on this page")

    return {"title": "Website Security", "items": items}


def _aggregate_media(pages: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Collect unique images and the best theme from crawled pages."""
    seen_images: set = set()
    images: List[str] = []
    theme: Dict[str, Any] = {}

    for page in pages:
        # Prefer the first page's theme (seed URL = most authoritative brand signal)
        if not theme and page.get("theme"):
            theme = page["theme"]

        for img in page.get("images", []):
            if img and img not in seen_images:
                seen_images.add(img)
                images.append(img)
        if len(images) >= 60:
            break

    return {"images": images, "theme": theme}


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/example-queries")
def example_queries():
    return {
        "queries": [
            "Summarize the website and explain its business model.",
            "What are the key features and who is the target audience?",
            "What technology stack does this product uses?",
        ]
    }


@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    path = _session_file(session_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Session not found")
    path.unlink()
    index_dir = INDEX_DIR / session_id
    if index_dir.exists():
        import shutil
        shutil.rmtree(index_dir, ignore_errors=True)
    return {"deleted": session_id}


@app.delete("/api/sessions")
def clear_all_sessions():
    deleted = []
    for file in SESSION_DIR.glob("*.json"):
        sid = file.stem
        file.unlink()
        index_dir = INDEX_DIR / sid
        if index_dir.exists():
            import shutil
            shutil.rmtree(index_dir, ignore_errors=True)
        deleted.append(sid)
    return {"deleted": deleted, "count": len(deleted)}


@app.get("/api/sessions")
def list_sessions():
    sessions = []
    for file in sorted(SESSION_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        payload = json.loads(file.read_text(encoding="utf-8"))
        sessions.append({
            "session_id": payload["session_id"],
            "urls": payload["urls"],
            "created_at": payload["created_at"],
            "title": payload["title"],
            "theme": payload.get("theme", {}),
        })
    return {"sessions": sessions}


@app.post("/api/process")
def process_urls(req: ProcessRequest):
    urls = [u.strip() for u in req.urls if u and u.strip()]
    if not urls:
        raise HTTPException(status_code=400, detail="Provide at least one URL.")
    if len(urls) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 URLs allowed.")

    invalid = [u for u in urls if not validate_url(u)]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid URL(s): {', '.join(invalid)}")

    session_id = req.session_id or session_id_from_urls(urls)

    existing = store.load(session_id)
    if existing is not None:
        payload = _load_session(session_id)
        return {
            "session_id": session_id,
            "title": payload["title"],
            "urls": payload["urls"],
            "page_count": payload.get("page_count", len(payload.get("pages", []))),
            "status": "cached",
            "message": "Loaded cached knowledge base.",
            "created_at": payload["created_at"],
            "theme": payload.get("theme", {}),
        }

    try:
        pages = scrape_many(urls, use_cache=True, max_pages_per_url=25)
    except Exception as exc:
        msg = str(exc).lower()
        if any(k in msg for k in ("name resolution", "nodename", "getaddressinfo", "no address", "dns")):
            raise HTTPException(status_code=503, detail=f"Domain not found — check the URL is correct. ({str(exc)[:200]})")
        if "connection refused" in msg or "connectionrefused" in msg:
            raise HTTPException(status_code=503, detail=f"Connection refused — the site is not accepting connections. ({str(exc)[:200]})")
        if "timed out" in msg or "timeout" in msg:
            raise HTTPException(status_code=504, detail=f"Request timed out — the site took too long to respond.")
        if "403" in msg or "forbidden" in msg:
            raise HTTPException(status_code=422, detail=f"Access blocked — the site returned HTTP 403 (bot protection or login required).")
        if "401" in msg or "unauthorized" in msg:
            raise HTTPException(status_code=422, detail=f"Authentication required — the site returned HTTP 401.")
        raise HTTPException(status_code=500, detail=f"Crawl failed: {str(exc)[:300]}")

    if not pages:
        raise HTTPException(
            status_code=503,
            detail=(
                "Could not access the site — it may be unreachable, blocked by bot detection, "
                "or the domain does not exist. Verify the URL is correct and publicly accessible."
            ),
        )
    chunks = chunk_pages(pages)
    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="No readable content extracted — the site may require JavaScript rendering or authentication.",
        )
    store.build(session_id, chunks)

    seed_count = len(urls)
    page_count = len(pages)
    title = pages[0].title if seed_count == 1 else f"{seed_count} websites knowledge base"

    pages_dicts = [p.to_dict() for p in pages]
    media = _aggregate_media(pages_dicts)

    payload = {
        "session_id": session_id,
        "title": title,
        "urls": urls,
        "page_count": page_count,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "pages": pages_dicts,
        "chunks": [c.to_dict() for c in chunks],
        "theme": media["theme"],
        "images": media["images"],
    }
    _save_session(session_id, payload)

    return {
        "session_id": session_id,
        "title": title,
        "urls": urls,
        "page_count": page_count,
        "status": "processed",
        "message": f"Crawled {page_count} page(s) from {seed_count} site(s), indexed {len(chunks)} chunk(s).",
        "created_at": payload["created_at"],
        "theme": media["theme"],
    }


@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    return _load_session(session_id)


@app.get("/api/session/{session_id}/sources")
def get_sources(session_id: str):
    payload = _load_session(session_id)
    chunks = payload.get("chunks", [])
    source_map: Dict[str, List] = {}
    for c in chunks:
        source_map.setdefault(c["url"], []).append(c)
    return {
        "session_id": session_id,
        "pages": payload.get("pages", []),
        "source_map": source_map,
    }


@app.get("/api/session/{session_id}/media")
def get_media(session_id: str):
    payload = _load_session(session_id)
    return {
        "session_id": session_id,
        "images": payload.get("images", []),
        "theme": payload.get("theme", {}),
    }


@app.post("/api/ask")
def ask(req: QuestionRequest):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    _load_session(req.session_id)
    result = answer_question(store, req.session_id, req.question, top_k=req.top_k)
    return result


@app.get("/api/insights/{session_id}")
def insights(session_id: str):
    payload = _load_session(session_id)
    result = build_insights(store, session_id)

    security = _aggregate_security(payload.get("pages", []))
    result["structured"].append(_build_security_block(security))
    result["security"] = security

    return {"session_id": session_id, **result}


@app.get("/api/compare/{session_id}")
def compare(session_id: str):
    payload = _load_session(session_id)
    pages = payload.get("pages", [])
    rows = []
    for page in pages:
        text = page.get("raw_text", "")
        rows.append({
            "url": page["url"],
            "title": page.get("title", ""),
            "summary": text[:260] + ("..." if len(text) > 260 else ""),
            "features": page.get("sections", [])[:5],
        })
    return {
        "session_id": session_id,
        "items": rows,
        "note": "Use the chat tab for deeper cross-site comparisons.",
    }


@app.post("/api/chat")
def chat(req: ChatRequest):
    from .rag import _call_llm
    knowledge_file = ROOT / "admin-chat.md"
    knowledge = (
        knowledge_file.read_text(encoding="utf-8")
        if knowledge_file.exists()
        else "No knowledge base configured."
    )

    history_lines = ""
    for msg in req.history[-6:]:
        role = "User" if msg.role == "user" else "Assistant"
        history_lines += f"{role}: {msg.content}\n"

    prompt = (
        "You are a friendly, concise assistant for Web Intelligence — an AI-powered "
        "website analysis tool. Answer questions about the app, how it works, and the "
        "developer. Keep replies under 120 words unless detail is truly needed.\n\n"
        f"KNOWLEDGE BASE:\n{knowledge}\n\n"
        + (f"CONVERSATION SO FAR:\n{history_lines}\n" if history_lines else "")
        + f"User: {req.message}\nAssistant:"
    )

    try:
        reply = _call_llm(prompt)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"LLM unavailable: {str(exc)[:200]}")

    return {"reply": reply.strip()}


@app.post("/api/collaborate")
def collaborate(req: CollaborateRequest):
    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', req.email):
        raise HTTPException(status_code=422, detail="Invalid email address.")

    existing: List[Dict[str, Any]] = []
    if COLLAB_FILE.exists():
        try:
            existing = json.loads(COLLAB_FILE.read_text(encoding="utf-8"))
        except Exception:
            existing = []

    existing.append({
        "name": req.name,
        "email": req.email,
        "linkedin": req.linkedin,
        "description": req.description,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    })
    COLLAB_FILE.write_text(
        json.dumps(existing, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    return {"ok": True, "message": "Thanks! We'll be in touch soon."}
