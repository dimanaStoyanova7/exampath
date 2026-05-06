# Frontend (Next.js)

This app is the ExamPath client UI. It handles:
- PDF upload UX
- Topic preview
- Quiz taking flow
- Grading/loading states
- Results visualization

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Inline component styling + shared CSS variables in `src/app/globals.css`

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

The frontend defaults to `http://localhost:8000` for API calls.

Optional override in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Source Map

- `src/app/page.tsx` - app entry with provider wiring
- `src/context/AppContext.tsx` - global UI/app state machine and setters
- `src/lib/api.ts` - backend request helpers
- `src/components/AppShell.tsx` - screen routing based on context `screen`
- `src/components/UploadScreen.tsx` - upload/dropzone + analyze trigger
- `src/components/TopicsScreen.tsx` - topic review + start quiz
- `src/components/QuizScreen.tsx` - question rendering, progress, answer submission
- `src/components/LoadingScreen.tsx` - loading/grading state UI
- `src/components/ResultsScreen.tsx` - score/topic/question breakdown presentation

## State and Screen Flow

App context (`useApp`) stores:
- `screen`: `'upload' | 'loading' | 'topics' | 'quiz' | 'grading' | 'results'`
- `sessionId`, `topics`, `questions`, `answers`, `budget`, `results`

Typical user flow:
1. Upload files -> set loading -> extract topics + generate quiz
2. Show topics -> move to quiz
3. Submit quiz -> grading -> results

## Theming and UI Guidelines

- Theme tokens live in `src/app/globals.css`.
- Primary visual identity is purple-based (`--accent`, `--accent-2`).
- Prefer existing utility classes for consistency:
  - `.premium-card`
  - `.cta-button`
- Maintain the typography pattern:
  - `Playfair Display` for large headings
  - `DM Sans` for body/UI text

## Contributor Notes

- Keep component behavior in sync with context state updates.
- When adding API calls, define request helpers in `src/lib/api.ts` first.
- If backend payloads change, update both:
  - Type assumptions in components
  - This README section(s)
- Run lint before commit:

```bash
npm run lint
```
