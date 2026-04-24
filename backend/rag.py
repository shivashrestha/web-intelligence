from __future__ import annotations

import json
import os
import requests
from typing import Any, Dict, List

from .embeddings import EmbeddingStore

# ---------------------------------------------------------------------------
# Provider selection
# ---------------------------------------------------------------------------
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()

# Ollama
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-v3.1:671b-cloud")
_OLLAMA_TIMEOUT = (10, 600)

_OOM_MODELS = ["phi3.5:mini", "gemma2:2b", "llama3.2:1b", "qwen2.5:1.5b", "tinyllama"]

# Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


# ---------------------------------------------------------------------------
# LLM call dispatch
# ---------------------------------------------------------------------------

def _call_llm(prompt: str) -> str:
    if LLM_PROVIDER == "gemini":
        return _call_gemini(prompt)
    return _call_ollama(prompt)


def _call_ollama(prompt: str) -> str:
    response = requests.post(
        OLLAMA_URL,
        json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        timeout=_OLLAMA_TIMEOUT,
    )
    if response.status_code != 200:
        body = response.text[:400]
        if "memory" in body.lower() or "oom" in body.lower():
            suggestions = ", ".join(_OOM_MODELS)
            raise RuntimeError(
                f"Model '{OLLAMA_MODEL}' exceeds available system memory. "
                f"Set OLLAMA_MODEL to a smaller model, e.g.: {suggestions}. "
                f"Or switch to Gemini by setting LLM_PROVIDER=gemini."
            )
        raise RuntimeError(f"Ollama error {response.status_code}: {body}")
    return response.json()["response"]


def _call_gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set. Export it or add to .env.")
    import google.generativeai as genai
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel(GEMINI_MODEL)
    response = model.generate_content(prompt)
    return response.text


# ---------------------------------------------------------------------------
# Context builder
# ---------------------------------------------------------------------------

def _build_context(chunks: List[Dict[str, Any]]) -> str:
    parts = []
    for i, chunk in enumerate(chunks, 1):
        section = chunk.get("section_title") or chunk.get("section", "")
        parts.append(
            f"[Source {i}]\n"
            f"URL: {chunk['url']}\n"
            f"Section: {section}\n"
            f"{chunk['text']}"
        )
    return "\n\n---\n\n".join(parts)


# ---------------------------------------------------------------------------
# RAG: question answering
# ---------------------------------------------------------------------------

def answer_question(
    store: EmbeddingStore,
    session_id: str,
    question: str,
    top_k: int = 12,
) -> Dict[str, Any]:
    results = store.query(session_id, question, top_k=top_k)
    chunks = [r["chunk"] for r in results]
    context = _build_context(chunks)

    prompt = f"""You are an expert AI web analyst. Answer the question using the website content provided below.

Rules:
- Prioritise the provided context. Extract and use every relevant detail present in it.
- If partial information exists, give what you have — do NOT refuse to answer just because the context is incomplete.
- Only respond "I couldn't find this information in the crawled content." if the context has absolutely nothing relevant to the question.
- NEVER start with "Based on the provided context", "According to the context", or any similar phrase.
- Start directly with the answer. Open with a short **bold heading** if helpful.
- Use **bold** for key terms. Use bullet points for lists.
- Be specific and factual. No generic filler.
- Under 400 words unless the question demands more.

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:"""

    answer = _call_llm(prompt)

    # Strip common preamble phrases the LLM may still emit despite instructions
    import re as _re
    answer = _re.sub(
        r'^(Based on (the |this )?(provided |given )?(context|information|content|sources?)[,.]?\s*)',
        '', answer.strip(), flags=_re.IGNORECASE
    )
    answer = _re.sub(
        r'^(According to (the |this )?(provided |given )?(context|information|content|sources?)[,.]?\s*)',
        '', answer.strip(), flags=_re.IGNORECASE
    )
    answer = answer.strip()

    sources = [
        {
            "chunk_id": c.get("chunk_id", ""),
            "url": c["url"],
            "anchor_url": c.get("anchor_url") or c["url"],
            "title": c.get("title", ""),
            "section_title": c.get("section_title", ""),
            "snippet": c["text"][:280],
            "score": results[i]["score"],
        }
        for i, c in enumerate(chunks)
    ]
    return {"answer": answer, "sources": sources}


# ---------------------------------------------------------------------------
# Insight generation — rich structured card blocks
# ---------------------------------------------------------------------------

_INSIGHT_QUERIES = [
    "what is this company product who made it mission value proposition",
    "business model revenue how they make money subscription SaaS pricing freemium",
    "features capabilities tools what the product does functionalities",
    "target audience customers who is this for industries roles company size use cases",
    "technology stack frameworks APIs integrations platforms certifications security",
    "pricing plans cost tiers free trial enterprise contact sales",
    "pros advantages strengths cons limitations drawbacks missing features complaints",
]


def build_insights(store: EmbeddingStore, session_id: str) -> Dict[str, Any]:
    seen_ids: set = set()
    chunks: list = []
    for query in _INSIGHT_QUERIES:
        results = store.query(session_id, query, top_k=8)
        for r in results:
            c = r["chunk"]
            uid = c.get("chunk_id") or c["url"] + c["text"][:40]
            if uid not in seen_ids:
                seen_ids.add(uid)
                chunks.append(c)

    context = _build_context(chunks)

    prompt = f"""You are a business intelligence analyst. Read the website content below and fill in all 7 sections.

RULES:
- Base every bullet on content present below. Reasonable inference allowed (e.g. monthly subscription plan → SaaS model).
- Do NOT fabricate prices, feature names, or company details not in the content.
- If a section has zero relevant content, write exactly one item: "No source found."
- If a section has ANY relevant content, omit "No source found" entirely — only real bullets.
- Extract as much as the content supports. Do not leave sections thin when content exists.

Output a JSON array of exactly 7 objects. Each object: "title" (string), "items" (array of strings).
Return ONLY valid JSON. No markdown fences, no preamble.

Sections:

1. "Overview" — 3-5 bullets. What is this product/company, what problem it solves, who built it, core value proposition. Be specific — name the company/product, name the problem.

2. "Business Model" — How do they monetize? Subscription, SaaS, ads, marketplace, licensing, freemium, enterprise sales, etc. Infer from pricing structure if not explicitly stated. 2-4 bullets.

3. "Key Features" — 4-6 bullets. Name each feature and explain what it does in one sentence. Pull exact feature names from the site. Do not list vague capabilities.

4. "Target Audience" — 2-4 bullets. Who uses this? Industries, job roles, company sizes, or specific use cases. Infer from product language, examples, and case studies if no explicit statement.

5. "Technology" — List technologies, frameworks, APIs, platforms, integrations, compliance certifications explicitly mentioned or implied (e.g. "built on AWS", "SOC 2 certified", "Zapier integration"). 1 item per technology. If nothing found, "No source found."

6. "Pricing" — Exact plan names and prices. Include free tier, trial, or "contact sales" if stated. Quote prices verbatim. If completely absent from content, "No source found."

7. "Pros & Cons" — Prefix each with "Pro:" or "Con:". 2-4 of each. Pros: real strengths from content. Cons: limitations, gaps in coverage, missing features, or things notably absent.

Formatting:
- Max 50 words per bullet.
- No marketing fluff: "cutting-edge", "powerful", "world-class", "innovative".
- Plain direct English.

CONTENT:
{context}

JSON:"""

    raw = _call_llm(prompt)
    structured = _parse_json_blocks(raw)
    structured = _clean_no_source(structured)
    return {"structured": structured, "raw": raw}


def _clean_no_source(blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Remove 'No source found.' placeholder when section has real items alongside it."""
    result = []
    for block in blocks:
        items = block.get("items", [])
        real = [i for i in items if i.strip().lower() != "no source found."]
        block["items"] = real if real else ["No source found."]
        result.append(block)
    return result


def _parse_json_blocks(text: str) -> List[Dict[str, Any]]:
    clean = text.strip()
    if clean.startswith("```"):
        lines = clean.splitlines()
        inner = [l for l in lines if not l.strip().startswith("```")]
        clean = "\n".join(inner).strip()
    start = clean.find("[")
    end = clean.rfind("]")
    if start != -1 and end != -1:
        try:
            return json.loads(clean[start: end + 1])
        except json.JSONDecodeError:
            pass
    lines = [l.strip("-• ").strip() for l in text.splitlines() if l.strip()]
    return [{"title": "Analysis", "items": lines[:12]}]
