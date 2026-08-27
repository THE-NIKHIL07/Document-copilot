# Document Copilot 📊

> **Institutional-Grade Multi-Company Financial Filing Assistant with Grounded Source Passages & Zero Hallucination.**

[![Live Web Application](https://img.shields.io/badge/Live%20App-Vercel-black?logo=vercel)](https://document-copilot-07.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/THE-NIKHIL07/Document-copilot)

---

## 🚀 Live Demo

- **Web Application:** [https://document-copilot-07.vercel.app](https://document-copilot-07.vercel.app)
- **Database & Auth:** Supabase Cloud (PostgreSQL + `pgvector`)

---

## 💡 Overview

**Document Copilot** is an institutional investment research chatbot that enables analysts to query complex SEC filings (10-Ks, 10-Qs) in plain English and receive real-time, streaming answers strictly backed by cited document passages.

### ✨ Key Features

- **🔎 Institutional Grounded Citations:** Every claim is tied to an interactive citation badge (`[1 AAPL 10-K Filed 2024-10-31]`).
- **📑 Sliding Source Inspector Drawer:** Clicking any citation badge slides open a right-hand context drawer showing the exact cited passage with page numbers, document metadata, and surrounding context (`Chunk X-1`, `Chunk X`, `Chunk X+1`).
- **⚡ Ultra-Fast Streaming:** Real-time token streaming powered by **Groq Cloud LLM** (`qwen/qwen3.8-27b`).
- **🔒 Pure Cloud Storage:** 100% cloud-hosted vector search and metadata persistence using Supabase PostgreSQL + `pgvector`.
- **🔑 Google OAuth & Password Recovery:** Single-click Google login alongside email/password sign-in and reset flows.
- **🧹 Smart Thread Management:**
  - Hard limit of **10 chat threads** per user with auto-pruning of older chats.
  - Zero-clutter home screen ("Ask about the company") that generates threads on demand.
  - Permanent, database-backed chat deletion with a single click.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend (Vercel)"]
        UI["React SPA (Vite + Tailwind)"]
        Drawer["Source Context Drawer"]
        AuthView["Google OAuth / Supabase Auth"]
    end

    subgraph Backend ["Backend (Render)"]
        API["FastAPI Routes"]
        Orchestrator["RAG Turn Orchestrator"]
        Retriever["PostgreSQL Vector / FTS Search"]
    end

    subgraph CloudServices ["Cloud Infrastructure"]
        Groq["Groq Cloud LLM (Qwen 2.5 27B)"]
        SupaDB[("Supabase Cloud (PostgreSQL + pgvector)")]
    end

    UI -->|Stream Turn / SSE| API
    UI -->|Auth Tokens| SupaDB
    API -->|Hybrid Retrieval| Retriever
    Retriever -->|Vector / Chunk Query| SupaDB
    API -->|Prompt with Context| Groq
    Groq -->|Stream Tokens| UI
    UI -->|Click Citation| Drawer
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Vercel AI SDK UI |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, Structlog, Uvicorn |
| **LLM & Inference** | Groq Cloud API (`qwen/qwen3.8-27b`) |
| **Database & Vectors** | Supabase Cloud (PostgreSQL 15, `pgvector`, Full-Text Search) |
| **Hosting & CI/CD** | Vercel (Frontend SPA) + Render (Backend Web Service) |

---

## 📁 Repository Structure

```text
document-copilot/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routes (threads, streaming, messages)
│   │   ├── auth/            # Supabase JWT authentication dependencies
│   │   ├── chat/            # RAG turn orchestrator & SSE streaming
│   │   ├── database/        # SQLAlchemy models & database queries
│   │   ├── groq_service.py  # Groq LLM service with institutional prompting
│   │   ├── retriever.py     # Hybrid PostgreSQL retrieval engine
│   │   ├── config.py        # Settings & environment configuration
│   │   └── main.py          # FastAPI application entrypoint
│   ├── ingest/              # SEC document chunking & embedding pipeline
│   ├── requirements.txt     # Python production dependencies
│   ├── Dockerfile           # Container build file
│   └── Procfile             # Web process start command
├── frontend/
│   ├── src/
│   │   ├── components/      # ChatThreadView, SourceContextDrawer, Sidebar, Input
│   │   ├── lib/             # API client, Supabase auth, SSE parsing
│   │   ├── pages/           # ChatPage, LoginPage, ChatEmptyState
│   │   └── App.tsx          # React Router setup
│   ├── public/              # Icons & _redirects (SPA routing)
│   ├── package.json         # Node.js dependencies & scripts
│   └── vite.config.ts       # Vite build configuration
└── README.md                # Project documentation
```

---

## 💻 Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/THE-NIKHIL07/Document-copilot.git
cd Document-copilot
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
SUPABASE_URL=https://gelkmoejuydwbsiroogb.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://postgres.xxx:xxx@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=qwen/qwen3.8-27b
ALLOWED_ORIGINS=*
```

Run the backend:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://gelkmoejuydwbsiroogb.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the frontend:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🌐 Cloud Deployment

### Backend (Render)
- **Runtime:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Root Directory:** `backend`

### Frontend (Vercel)
- **Framework Preset:** `Vite`
- **Root Directory:** `frontend`
- **Environment Variables:** `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

---

## 📄 License
This project is open-source under the MIT License.
