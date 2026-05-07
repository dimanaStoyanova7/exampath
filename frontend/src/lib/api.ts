const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function parseError(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    if (json.detail) return json.detail
  } catch {}
  return text || `Request failed (${res.status})`
}

export async function uploadAndAnalyze(files: File[]) {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const res = await fetch(`${BASE}/extract-topics`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function generateQuiz(sessionId: string, questionsPerTopic: number = 2) {
  const res = await fetch(`${BASE}/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, questions_per_topic: questionsPerTopic })
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function fetchSession(sessionId: string) {
  const res = await fetch(`${BASE}/session/${sessionId}`)
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}

export async function submitAnswers(sessionId: string, answers: { question_id: number; selected: string }[]) {
  const res = await fetch(`${BASE}/submit-answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, answers })
  })
  if (!res.ok) throw new Error(await parseError(res))
  return res.json()
}