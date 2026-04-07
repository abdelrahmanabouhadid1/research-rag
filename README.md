# Research RAG

A simple RAG (Retrieval-Augmented Generation) system for uploading documents and asking questions. Built for PhD research, designed to scale with experiments.

## Stack

- **Backend**: Python, FastAPI, ChromaDB, sentence-transformers, Anthropic Claude
- **Frontend**: Next.js, React, TailwindCSS, shadcn/ui

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Supported Document Types

- PDF
- TXT
- DOCX
