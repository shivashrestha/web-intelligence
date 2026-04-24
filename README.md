# Web Intelligence QA – AI Website Analyst

A production-shaped portfolio project that turns one or more URLs into a queryable knowledge base with source-backed answers, structured business insights, and multi-URL comparison.

## What it does

- Ingests single or multiple URLs
- Scrapes clean content with BeautifulSoup
- Chunks text and stores metadata
- Creates local MiniLM embeddings
- Indexes vectors in FAISS
- Answers questions with source attribution
- Generates business insights
- Supports comparison across multiple URLs

## Tech stack

- **Backend:** FastAPI
- **Frontend:** React + Vite + TailwindCSS
- **Scraping:** requests + BeautifulSoup
- **Embeddings:** sentence-transformers (MiniLM)
- **Vector DB:** FAISS
- **LLM:** OpenAI API optional, with heuristic fallback

## Project structure

```txt
/backend
  main.py
  scraper.py
  processor.py
  embeddings.py
  rag.py

/frontend
  src/
    components/
    services/api.js
    App.jsx
    main.jsx
    index.css

/data
  faiss_index/
  cached_pages/
  sessions/
```

## Local setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # on Windows use .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment variables

- `OPENAI_API_KEY` – optional
- `OPENAI_MODEL` – defaults to `gpt-4o-mini`
- `FRONTEND_ORIGIN` – defaults to `http://localhost:5173`
- `VITE_API_BASE_URL` – frontend API URL

## Notes

- The app caches scraped pages locally in `data/cached_pages`
- FAISS indexes are stored in `data/faiss_index`
- Sessions are persisted in `data/sessions`
- Multi-URL comparison is supported when more than one URL is provided

## Next upgrades

- Streaming responses
- Better section-level highlighting
- User authentication
- Background job queue
- Improved comparison table rendering
- Deployment scripts for Render/Railway + Vercel/Netlify
