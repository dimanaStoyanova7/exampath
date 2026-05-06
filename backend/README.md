# Backend (FastAPI)

This service powers ExamPath's document analysis and quiz pipeline:
- Extracts text from uploaded PDFs
- Detects exam-relevant topics with Claude
- Generates quiz questions per topic
- Grades submissions and returns topic-level summaries

## Tech Stack

- FastAPI
- pdfplumber (PDF text extraction)
- Anthropic SDK (topic extraction, quiz generation, judgments)

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env`:

```env
ANTHROPIC_API_KEY=your_key_here
```

Run server:

```bash
uvicorn main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## API Endpoints

- `GET /health`
  - Returns service status.

- `POST /extract-topics`
  - Multipart upload: `files` (list of PDFs, max 15).
  - Extracts text, enforces character budget, returns:
    - `session_id`
    - `topics`
    - `budget` details (`included_files`, `excluded_files`, `skipped_files`)

- `POST /generate-quiz`
  - Body: `{ "session_id": "..." }`
  - Generates and caches session quiz.
  - Response omits `correct_answer` fields for client safety.

- `POST /submit-answers`
  - Body:
    - `session_id`
    - `answers`: `[{ question_id, selected }]`
  - Grades answers, computes topic summaries, returns final results.

- `GET /session/{session_id}`
  - Debug/status endpoint for session state.

## Internal Architecture

- `main.py`
  - FastAPI routes
  - Session lifecycle and in-memory cache
  - Grading and result shaping
- `extractor.py`
  - PDF text extraction and utility chunking
- `ai.py`
  - Prompt construction and Anthropic calls
  - Topic extraction, quiz generation, and topic judgments

## Important Implementation Notes

- Sessions are stored in memory (`sessions` dict), not persisted.
- Server restart clears sessions/results.
- CORS is currently open for easier local development.
- Character budget in `main.py` (`CHAR_BUDGET`) limits total extracted text.
- Quiz generation stores full quiz internally with `correct_answer`, but strips it from client responses.

## Contributor Guidance

- Keep endpoint contracts stable for the frontend.
- If you change response schemas, update:
  - `frontend/src/lib/api.ts`
  - frontend component assumptions
  - root and service READMEs
- Preserve the "no answer leakage before submit" behavior.
- Fail gracefully with useful HTTP status/details for frontend UX.
