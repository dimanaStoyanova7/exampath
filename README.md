# ExamPath

ExamPath is an AI-assisted study diagnostics app:
- Upload up to 15 PDF course files
- Extract exam-relevant topics from the materials
- Generate a topic-aligned quiz
- Grade answers and return topic-level strengths/gaps

The repository has two apps:
- `frontend/` - Next.js + TypeScript user interface
- `backend/` - FastAPI service for extraction, quiz generation, and grading

## Project Structure

```text
exampath/
  frontend/   # Next.js client
  backend/    # FastAPI server
```

## End-to-End Flow

1. User uploads PDFs in the frontend.
2. Frontend calls `POST /extract-topics`.
3. Backend extracts text (with a character budget), asks Claude for topics, and creates a session.
4. Frontend calls `POST /generate-quiz` for the session.
5. User answers quiz questions in the frontend.
6. Frontend calls `POST /submit-answers`.
7. Backend grades answers and returns topic summaries and score breakdown.

## Quick Start

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
ANTHROPIC_API_KEY=your_key_here
```

Run API:

```bash
uvicorn main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional `frontend/.env.local` override:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then open [http://localhost:3000](http://localhost:3000).

## Contributing

### Development workflow

- Keep frontend and backend running in separate terminals.
- Validate backend health via `GET /health`.
- Use `npm run lint` in `frontend/` before opening a PR.
- Keep API payloads backwards-compatible when possible.

### Where to make changes

- UI states and navigation: `frontend/src/context/AppContext.tsx` and `frontend/src/components/`
- Frontend API calls: `frontend/src/lib/api.ts`
- PDF extraction logic: `backend/extractor.py`
- LLM prompts and quiz generation logic: `backend/ai.py`
- API routes and session lifecycle: `backend/main.py`

### Expectations for PRs

- Include a short summary of user-visible behavior changes.
- Include test/verification notes (manual or automated).
- Keep docs in sync when endpoint shapes or setup change.

## Current Notes

- Backend sessions are in-memory (`sessions` dict in `backend/main.py`), so restarting the API clears active sessions.
- CORS is currently open (`allow_origins=["*"]`) for local development convenience.