'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { generateQuiz } from '@/lib/api'

export default function TopicsScreen() {
  const {
    topics, budget, sessionId,
    setScreen, setLoadingMessage, setQuestions,
    generationError, setGenerationError,
  } = useApp()

  const [perTopic, setPerTopic] = useState(2)
  const [loading, setLoading] = useState(false)

  const startMessageCycle = (msgs: string[], ms = 4000) => {
    setLoadingMessage(msgs[0])
    if (msgs.length === 1) return () => {}
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % msgs.length
      setLoadingMessage(msgs[i])
    }, ms)
    return () => clearInterval(id)
  }

  const handleStart = async () => {
    setGenerationError('')
    setLoading(true)
    setScreen('loading')

    const stopCycle = startMessageCycle([
      'Crafting your questions…',
      'Calibrating difficulty…',
      'Almost ready…',
    ], 4000)

    try {
      const quiz = await generateQuiz(sessionId, perTopic)
      stopCycle()
      setQuestions(quiz.questions)
      setScreen('quiz')
    } catch {
      stopCycle()
      setGenerationError("We couldn't generate a quiz. Try a different number of questions or re-upload your materials.")
      setScreen('topics')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 900,
        width: '100%',
        margin: '0 auto',
        padding: '5.25rem 1.25rem 3.5rem'
      }}
    >
      <div style={{ marginBottom: 30 }}>
        <h2
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2.25rem, 5.2vw, 3.9rem)',
            lineHeight: 0.98,
            letterSpacing: '-0.025em',
            marginBottom: 12
          }}
        >
          Materials analyzed
        </h2>
        <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 10, fontSize: '1.03rem' }}>
          {topics.length} topics found
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.72 }}>
          Review the topics below, then choose how many questions you want per topic.
        </p>
      </div>

      {budget && budget.excluded_files?.length > 0 && (
        <p
          className="premium-card"
          style={{
            marginBottom: 18,
            color: 'var(--cool)',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            background: 'rgba(96, 165, 250, 0.08)',
            padding: '0.8rem 0.95rem',
            borderRadius: 10
          }}
        >
          {budget.excluded_files.length} file(s) were not included — content budget reached.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 32 }}>
        {topics.map((topic, i) => (
          <span
            key={`${topic}-${i}`}
            className="animate-fade-up"
            style={{
              animationDelay: `${i * 100}ms`,
              animationFillMode: 'both',
              padding: '0.54rem 0.86rem',
              borderRadius: 999,
              border: '1px solid rgba(139, 92, 246, 0.34)',
              background: 'rgba(139, 92, 246, 0.11)',
              color: 'var(--text)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.025)',
              fontSize: 14
            }}
          >
            {topic}
          </span>
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 10,
        }}>
          Questions per topic
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setPerTopic(n)}
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                border: perTopic === n ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                background: perTopic === n ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface)',
                color: perTopic === n ? 'var(--accent)' : 'var(--text-muted)',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 17,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {n}
            </button>
          ))}
          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 6 }}>
            ~{topics.length * perTopic} questions total
          </span>
        </div>
      </div>

      {generationError && (
        <p style={{ color: '#ef4444', marginBottom: 14, fontSize: 14 }}>
          {generationError}
        </p>
      )}

      <button
        className="cta-button"
        type="button"
        onClick={handleStart}
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          color: '#f8f7ff',
          border: 'none',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 15.5,
          fontWeight: 700,
          letterSpacing: '0.01em',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        Start quiz →
      </button>
    </div>
  )
}
