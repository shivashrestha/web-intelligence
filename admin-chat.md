# Web Intelligence — App & Developer Knowledge Base
# Edit this file to customize what the landing-page chatbot knows about you and the app.

## About the App

**Web Intelligence** is a free, open-source AI-powered website analysis tool.
Paste any public URL and the app crawls it, indexes content using FAISS vector
embeddings, then lets you:

- Ask natural-language questions about the site using RAG (Retrieval-Augmented Generation)
- Get structured business intelligence: overview, features, pricing, audience, tech stack, pros/cons
- Browse all images and media extracted from the site
- Explore every crawled source page and content chunk

The app is fully free — no sign-up, no cloud, no API key required by default (uses Ollama locally).

## Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide icons
- **Backend:** FastAPI (Python), FAISS vector search, sentence-transformers embeddings
- **LLM:** Ollama (local, default: gemma3) or Google Gemini (optional, via env var)
- **Scraping:** Custom BFS web crawler with caching, theme extraction, security analysis

## About the Developer

**Shiva Shrestha** — full-stack developer and AI enthusiast passionate about building
practical, open-source tools that make AI accessible to everyone.

- Built Web Intelligence as a personal project to explore RAG, LLMs, and web intelligence at scale
- Interests: AI/ML, web scraping, developer tools, SaaS products, freelance work
- Open to collaboration, contributing to others' projects, and freelance engagements
- Email: shivashrestha44@gmail.com

## Common Questions & Answers

**Is it free?**
Yes — completely free and open-source. No account, no payment, no usage limits.

**How does it work?**
Paste a URL → the app crawls all linked pages → chunks text → embeds with
sentence-transformers → stores vectors in FAISS → your questions trigger semantic
search → top chunks are fed to an LLM (Ollama/Gemini) as context → accurate answer returned.

**What is RAG?**
Retrieval-Augmented Generation: retrieve relevant text chunks from a knowledge base,
inject them as context into the LLM prompt, so the model answers from real content
rather than hallucinating.

**What LLM does it use?**
Ollama by default (local inference, model configurable via OLLAMA_MODEL env var).
Switch to Google Gemini by setting LLM_PROVIDER=gemini and GEMINI_API_KEY.

**Is my data private?**
Sessions are stored locally on the machine running the app. Nothing is sent to external
servers except when using Gemini (content sent to Google's API). No analytics, no tracking.

**Can I contribute or collaborate?**
Absolutely! Use the Collaborate button on the landing page to send your details.
Shiva is open to: improving Web Intelligence, freelance projects, contributing to
your project, business partnerships, and general networking.

**Where is the source code?**
The project is open-source. Ask the developer for the repository link.

**What sites work best?**
Public websites with text content — SaaS products, documentation, company sites,
news articles, wikis. JavaScript-heavy SPAs may return less content since there is
no headless browser (plain HTTP requests only).
