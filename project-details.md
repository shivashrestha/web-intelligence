You are a senior AI + Fullstack engineer building a production-ready portfolio project.

---

# 🧠 PROJECT TITLE

**Web Intelligence QA – AI Website Analyst**

---

# 🎯 PRODUCT VISION

Build a modern AI-powered web application that transforms one or multiple URLs into a **queryable knowledge base with intelligent insights**.

This is NOT a simple chatbot.

It is an **AI analyst tool** that:

* understands website content
* answers questions with sources
* generates structured business insights
* supports multi-page comparison

---

# 👤 TARGET USER

* Developers
* Product managers
* Analysts
* Recruiters evaluating AI engineers

---

# ⚙️ CORE FEATURES

## 1. URL INGESTION

* Accept single or multiple URLs
* Validate URLs
* Show list of added URLs
* Allow remove/edit

---

## 2. SMART SCRAPING ENGINE

* Fetch HTML using lightweight methods
* Parse using BeautifulSoup
* Extract:

  * headings (h1, h2, h3)
  * paragraphs
  * lists
* Remove:

  * scripts, styles, navbars, ads
* Output clean structured text

---

## 3. TEXT PROCESSING PIPELINE

* Chunk text (300–500 tokens)
* Attach metadata:

  * source URL
  * section title
* Store as structured documents

---

## 4. EMBEDDINGS + STORAGE

* Use local embedding model (MiniLM)
* Generate embeddings
* Store in FAISS
* Cache results to avoid recomputation

---

## 5. RAG-BASED QUERY SYSTEM

When user asks a question:

1. Embed query
2. Retrieve top-k relevant chunks
3. Send context to LLM
4. Generate answer

---

## 6. SOURCE ATTRIBUTION (MANDATORY)

* Return:

  * answer
  * supporting text snippets
  * source URLs
* Make sources clickable in UI

---

## 7. INSIGHT GENERATION (KEY DIFFERENTIATOR)

Provide prebuilt actions:

* Summarize website
* Identify business model
* Extract key features
* Identify target audience
* Generate pros & cons

Use structured outputs:

* bullet points
* concise reasoning

---

## 8. MULTI-URL COMPARISON

* Combine multiple URLs into one knowledge base
* Enable queries like:

  * “Compare pricing”
  * “Which product is better?”
* Optionally show comparison table

---

## 9. MODERN UI (REACT REQUIRED)

Build a clean, production-like UI using React.

### Layout:

#### LEFT PANEL (Control)

* URL input
* URL list
* Process button
* Saved sessions (optional)

---

#### MAIN PANEL

### State 1: Empty

* Onboarding message
* Example URLs

---

### State 2: Processing

Show step-based loader:

* "Scraping content..."
* "Building knowledge base..."
* "Analyzing data..."

---

### State 3: Ready (Tabbed Interface)

#### Tab 1: Chat

* Chat interface (ChatGPT style)
* User queries + AI responses
* Show sources under each answer

---

#### Tab 2: Insights

* Cards:

  * Summary
  * Business Model
  * Features
  * Audience
  * Pros / Cons

---

#### Tab 3: Sources

* Display extracted content
* Highlight retrieved chunks

---

#### Tab 4: Compare (if multi-URL)

* Side-by-side comparison
* Structured output

---

## 10. UX REQUIREMENTS (VERY IMPORTANT)

* Use progressive flow (input → processing → results)
* Show meaningful loading messages (no generic spinners)
* Provide example queries
* Enable clickable sources with highlighting
* Handle errors gracefully

---

# 🧱 TECH STACK

## Backend:

* FastAPI

## Frontend:

* React (Vite or Next.js)
* TailwindCSS
* Optional: shadcn/ui

## Scraping:

* requests + BeautifulSoup

## Embeddings:

* sentence-transformers (MiniLM)

## Vector DB:

* FAISS

## LLM:

* OpenAI API or Mistral API

---

# 💾 PERFORMANCE CONSTRAINTS

* Must run within ~4GB RAM
* Limit number of URLs (5–10 max)
* Cache embeddings locally
* Avoid reprocessing same URLs
* Keep chunk sizes small

---

# 📁 PROJECT STRUCTURE

/backend

* main.py
* scraper.py
* processor.py
* embeddings.py
* rag.py

/frontend

* components/
* pages/
* services/api.js

/data

* faiss_index/
* cached_pages/

---

# 🚀 DEPLOYMENT

* Frontend: Vercel / Netlify
* Backend: Render / Railway
* Store FAISS locally or lightweight storage
* Use environment variables for API keys

---

# 🎯 FINAL DELIVERABLES

1. Fully working deployed app
2. Clean GitHub repository
3. README with:

   * problem
   * solution
   * architecture
   * screenshots
4. 2–3 minute demo video

---

# 🧠 SUCCESS CRITERIA

The application must:

* Feel like a real product (not a demo)
* Provide accurate answers with sources
* Deliver meaningful insights (not generic text)
* Demonstrate AI + data engineering + frontend skills

---

# 🚀 DEVELOPMENT STRATEGY

1. Build MVP:

   * URL → scrape → embed → ask → answer

2. Add:

   * source attribution
   * insights

3. Upgrade:

   * multi-URL
   * comparison
   * UI polish

---

Focus on niche, clarity, usability, and real-world value over complexity. 
