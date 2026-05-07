'use client'
import { useApp } from '@/context/AppContext'

const TIER_BORDER: Record<string, string> = {
  positive: 'rgba(34, 197, 94, 0.35)',
  negative: 'rgba(239, 68, 68, 0.35)',
  neutral: 'rgba(148, 163, 184, 0.3)',
}
const TIER_BG: Record<string, string> = {
  positive: 'rgba(34, 197, 94, 0.07)',
  negative: 'rgba(239, 68, 68, 0.07)',
  neutral: 'rgba(148, 163, 184, 0.07)',
}
const TIER_COLOR: Record<string, string> = {
  positive: 'var(--positive)',
  negative: 'var(--negative)',
  neutral: 'var(--neutral)',
}
const TIER_LABEL: Record<string, string> = {
  positive: '✓ Strong',
  negative: '✗ Needs work',
  neutral: '~ Partial',
}

export default function ResultsScreen() {
  const { results, questions, setScreen, setResults } = useApp()

  if (!results) return null

  const { total_correct, total_questions, percentage, topic_summaries, question_grades } = results

  const questionMap: Record<number, any> = {}
  questions.forEach((q: any) => {
    questionMap[q.question_id] = q
  })

  const restart = () => {
    setResults(null)
    setScreen('upload')
  }

  const scoreColor =
    percentage >= 70
      ? 'var(--positive)'
      : percentage >= 50
      ? 'var(--accent)'
      : 'var(--negative)'

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '3.5rem 1.5rem 6rem' }}>

      {/* Score hero */}
      <div
        className="premium-card animate-fade-up"
        style={{
          borderRadius: 16,
          padding: '2.25rem 2rem',
          marginBottom: 28,
          textAlign: 'center',
          animationFillMode: 'both',
        }}
      >
        <p
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: 10,
            fontWeight: 600,
          }}
        >
          Your result
        </p>
        <div
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(4rem, 12vw, 7rem)',
            lineHeight: 1,
            color: scoreColor,
            marginBottom: 6,
          }}
        >
          {percentage}
          <span style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>%</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
          {total_correct} out of {total_questions} correct
        </p>
      </div>

      {/* Topic summaries */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 12,
        }}
      >
        By topic
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 36 }}>
        {topic_summaries.map((t: any, i: number) => (
          <div
            key={t.topic}
            className="premium-card animate-fade-up"
            style={{
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              animationDelay: `${i * 50}ms`,
              animationFillMode: 'both',
              border: TIER_BORDER[t.tier],
              background: TIER_BG[t.tier],
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 0',
                borderRadius: 6,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                width: 92,
                textAlign: 'left',
                paddingLeft: 9,
                paddingRight: 9,
                color: TIER_COLOR[t.tier],
                border: `1px solid ${TIER_COLOR[t.tier]}`,
                background: `${TIER_COLOR[t.tier]}18`,
              }}
            >
              {TIER_LABEL[t.tier]}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 3,
                }}
              >
                {t.topic}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {t.judgment}
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                flexShrink: 0,
                paddingTop: 2,
              }}
            >
              {t.correct}/{t.total}
            </span>
          </div>
        ))}
      </div>

      {/* Q&A breakdown */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 12,
        }}
      >
        Question breakdown
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 36 }}>
        {question_grades.map((g: any, i: number) => {
          const q = questionMap[g.question_id]
          const correct = g.correct
          const leftBorder = correct ? 'var(--positive)' : 'var(--negative)'
          return (
            <div
              key={g.question_id}
              className="animate-fade-up"
              style={{
                background: 'var(--surface)',
                border: `0.5px solid ${
                  correct ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'
                }`,
                borderLeft: `3px solid ${leftBorder}`,
                borderRadius: 10,
                padding: '14px 16px',
                animationDelay: `${i * 25}ms`,
                animationFillMode: 'both',
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text)',
                  lineHeight: 1.5,
                  marginBottom: 10,
                  fontWeight: 500,
                }}
              >
                {q?.question}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {q &&
                  Object.entries(q.options).map(([letter, text]: [string, any]) => {
                    const isSelected = g.selected === letter
                    const isCorrect = g.correct_answer === letter
                    let bg = 'transparent'
                    let color = 'var(--text-muted)'
                    let border = 'transparent'
                    if (isCorrect) {
                      bg = 'rgba(34,197,94,0.1)'
                      color = 'var(--positive)'
                      border = 'rgba(34,197,94,0.3)'
                    }
                    if (isSelected && !correct) {
                      bg = 'rgba(239,68,68,0.1)'
                      color = 'var(--negative)'
                      border = 'rgba(239,68,68,0.3)'
                    }
                    return (
                      <div
                        key={letter}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 10px',
                          borderRadius: 7,
                          background: bg,
                          border: `1px solid ${border}`,
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                            background: isCorrect
                              ? 'rgba(34,197,94,0.2)'
                              : isSelected && !correct
                              ? 'rgba(239,68,68,0.2)'
                              : 'var(--surface2)',
                            color,
                          }}
                        >
                          {letter.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12.5, color, lineHeight: 1.4 }}>
                          {text}
                        </span>
                        {isCorrect && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--positive)',
                              marginLeft: 'auto',
                            }}
                          >
                            ✓ correct
                          </span>
                        )}
                        {isSelected && !correct && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--negative)',
                              marginLeft: 'auto',
                            }}
                          >
                            ✗ your answer
                          </span>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Restart */}
      <button
        type="button"
        onClick={restart}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: 12,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Start over with new materials
      </button>
    </div>
  )
}