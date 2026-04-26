from __future__ import annotations

import json
import os
import re
import uuid
import psycopg2
import psycopg2.extras
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from scraper import scrape_many, validate_url, Section
from processor import chunk_pages, build_source_map
from embeddings import EmbeddingStore, session_id_from_urls
from rag import answer_question, build_insights, reformat_thin_content

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
SESSION_DIR = DATA_DIR / "sessions"
INDEX_DIR = DATA_DIR / "faiss_index"
COLLAB_FILE = DATA_DIR / "collaborations.json"
SESSION_DIR.mkdir(parents=True, exist_ok=True)
INDEX_DIR.mkdir(parents=True, exist_ok=True)

_SESSION_ID_RE = re.compile(r'^[a-zA-Z0-9_\-]{8,128}$')
_BROWSER_TOKEN_RE = re.compile(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')

SUPABASE_DSN = os.getenv("SUPABASE_CONNECTION_STRING", "")


def _get_db():
    return psycopg2.connect(SUPABASE_DSN)


def _ensure_collab_table():
    with _get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS collaborations (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    linkedin TEXT,
                    description TEXT NOT NULL,
                    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """)
        conn.commit()


_ensure_collab_table()

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


def _get_browser_token(request: Request) -> str:
    token = request.headers.get("X-Browser-Token", "")
    if not token or not _BROWSER_TOKEN_RE.match(token):
        raise HTTPException(status_code=401, detail="Missing or invalid browser token.")
    return token


def _load_session_owned(session_id: str, browser_token: str) -> Dict[str, Any]:
    payload = _load_session(session_id)
    if payload.get("browser_token") != browser_token:
        raise HTTPException(status_code=403, detail="Access denied.")
    return payload


def _vector_ns(payload: Dict[str, Any]) -> str:
    return payload.get("vector_namespace", payload["session_id"])


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
    """Collect unique images (with source page URL) and the best theme from crawled pages."""
    seen_urls: set = set()
    images: List[Dict[str, str]] = []
    theme: Dict[str, Any] = {}

    for page in pages:
        if not theme and page.get("theme"):
            theme = page["theme"]

        page_url = page.get("final_url") or page.get("url", "")
        for img in page.get("images", []):
            # Support both legacy str format and new dict format
            if isinstance(img, dict):
                img_url = img.get("url", "")
                src_page = img.get("page_url", page_url)
            else:
                img_url = img
                src_page = page_url
            if img_url and img_url not in seen_urls:
                seen_urls.add(img_url)
                images.append({"url": img_url, "page_url": src_page})
        if len(images) >= 50:
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
def delete_session(session_id: str, request: Request):
    browser_token = _get_browser_token(request)
    payload = _load_session_owned(session_id, browser_token)
    path = _session_file(session_id)
    path.unlink()
    store.delete(_vector_ns(payload))
    return {"deleted": session_id}


@app.delete("/api/sessions")
def clear_all_sessions(request: Request):
    browser_token = _get_browser_token(request)
    deleted = []
    for file in SESSION_DIR.glob("*.json"):
        try:
            payload = json.loads(file.read_text(encoding="utf-8"))
        except Exception:
            continue
        if payload.get("browser_token") != browser_token:
            continue
        sid = file.stem
        file.unlink()
        store.delete(_vector_ns(payload))
        deleted.append(sid)
    return {"deleted": deleted, "count": len(deleted)}


@app.get("/api/sessions")
def list_sessions(request: Request):
    browser_token = _get_browser_token(request)
    sessions = []
    for file in sorted(SESSION_DIR.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            payload = json.loads(file.read_text(encoding="utf-8"))
        except Exception:
            continue
        if payload.get("browser_token") != browser_token:
            continue
        sessions.append({
            "session_id": payload["session_id"],
            "urls": payload["urls"],
            "created_at": payload["created_at"],
            "title": payload["title"],
            "theme": payload.get("theme", {}),
        })
    return {"sessions": sessions}


@app.post("/api/process")
def process_urls(req: ProcessRequest, request: Request):
    browser_token = _get_browser_token(request)
    # Deduplicate while preserving order
    _seen: set = set()
    urls = []
    for u in req.urls:
        u = u.strip()
        if u and u.lower() not in _seen:
            _seen.add(u.lower())
            urls.append(u)
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
        if payload.get("browser_token") == browser_token:
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
        # Different browser owns this session — fork it so this browser gets their own entry
        forked_id = str(uuid.uuid4()).replace("-", "")[:16]
        store.fork_chunks(session_id, forked_id)
        forked_payload = {
            **payload,
            "session_id": forked_id,
            "browser_token": browser_token,
            "vector_namespace": _vector_ns(payload),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _save_session(forked_id, forked_payload)
        return {
            "session_id": forked_id,
            "title": forked_payload["title"],
            "urls": forked_payload["urls"],
            "page_count": forked_payload.get("page_count", len(forked_payload.get("pages", []))),
            "status": "cached",
            "message": "Loaded cached knowledge base.",
            "created_at": forked_payload["created_at"],
            "theme": forked_payload.get("theme", {}),
        }

    try:
        pages = scrape_many(urls, use_cache=True, max_pages_per_url=50)
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
    # LLM reformat for pages with very thin content (likely scraping issues)
    for page in pages:
        section_chars = sum(len(s.text) for s in page.sections)
        if 0 < section_chars < 300 and page.raw_text:
            try:
                reformatted = reformat_thin_content(page.final_url, page.title, page.raw_text)
                if reformatted and reformatted != page.raw_text:
                    page.sections = [Section(title=page.title, text=reformatted, anchor="")]
                    page.raw_text = reformatted
            except Exception:
                pass  # keep original on LLM failure

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
        "browser_token": browser_token,
        "vector_namespace": session_id,
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
def get_session(session_id: str, request: Request):
    browser_token = _get_browser_token(request)
    return _load_session_owned(session_id, browser_token)


@app.get("/api/session/{session_id}/sources")
def get_sources(session_id: str, request: Request):
    browser_token = _get_browser_token(request)
    payload = _load_session_owned(session_id, browser_token)
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
def get_media(session_id: str, request: Request):
    browser_token = _get_browser_token(request)
    payload = _load_session_owned(session_id, browser_token)
    return {
        "session_id": session_id,
        "images": payload.get("images", []),
        "theme": payload.get("theme", {}),
    }


@app.post("/api/ask")
def ask(req: QuestionRequest, request: Request):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    browser_token = _get_browser_token(request)
    payload = _load_session_owned(req.session_id, browser_token)
    result = answer_question(store, req.session_id, req.question, top_k=req.top_k, vector_namespace=_vector_ns(payload))
    return result


@app.get("/api/insights/{session_id}")
def insights(session_id: str, request: Request):
    browser_token = _get_browser_token(request)
    payload = _load_session_owned(session_id, browser_token)
    result = build_insights(store, session_id, vector_namespace=_vector_ns(payload))

    security = _aggregate_security(payload.get("pages", []))
    result["structured"].append(_build_security_block(security))
    result["security"] = security

    return {"session_id": session_id, **result}


@app.get("/api/compare/{session_id}")
def compare(session_id: str, request: Request):
    browser_token = _get_browser_token(request)
    payload = _load_session_owned(session_id, browser_token)
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
    from rag import _call_llm
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

    try:
        with _get_db() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO collaborations (name, email, linkedin, description, submitted_at)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (req.name, req.email, req.linkedin, req.description, datetime.now(timezone.utc)),
                )
            conn.commit()
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database error: {str(exc)[:200]}")

    return {"ok": True, "message": "Thanks! We'll be in touch soon."}
