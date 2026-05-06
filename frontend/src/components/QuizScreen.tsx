'use client'
import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { submitAnswers } from '@/lib/api'

type Question = {
  question_id: number
  topic: string
  question: string
  question_type: string
  options: Record<string, string>
}

export default function QuizScreen() {
  const {
    questions, answers, setAnswer,
    setScreen, setLoadingMessage,
    sessionId, setResults
  } = useApp()

  const [index, setIndex] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [error, setError] = useState('')

  const q = questions[index] as Question | undefined
  const total = questions.length
  const progress = total > 0 ? Math.round(((index + 1) / total) * 100) : 0
  const selected = q ? answers[q.question_id] : undefined
  const isLast = index === total - 1
  const letters = Object.keys(q?.options || {})

  const handleSelect = (letter: string) => {
    if (!q) return
    setAnswer(q.question_id, letter)
    setError('')
  }

  const handleNext = () => {
    if (!selected) { setError('Pick an answer to continue.'); return }
    setAnimKey(k => k + 1)
    setIndex(i => i + 1)
    setError('')
  }

  const handleSubmit = async () => {
    if (!selected) { setError('Pick an answer to continue.'); return }
    const allAnswers = Object.entries(answers).map(([qid, sel]) => ({
      question_id: Number(qid),
      selected: sel
    }))
    setLoadingMessage('Grading your answers…')
    setScreen('grading')
    try {
      const results = await submitAnswers(sessionId, allAnswers)
      setResults(results)
      setScreen('results')
    } catch {
      setScreen('quiz')
      setError('Submission failed. Check your connection and try again.')
    }
  }

  if (!q) return null

  return (
    <div
      style={{
        maxWidth: 860,
        width: '100%',
        margin: '0 auto',
        padding: '5.25rem 1.25rem 3.5rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14
        }}
      >
        <p
          style={{
            color: 'var(--accent)',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase'
          }}
        >
          {q.topic}
        </p>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
          {index + 1} / {total}
        </p>
      </div>

      <div
        style={{
          width: '100%',
          height: 5,
          borderRadius: 999,
          background: 'var(--surface2)',
          overflow: 'hidden',
          marginBottom: 28
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
            transition: 'width 220ms ease'
          }}
        />
      </div>

      <div
        key={animKey}
        className="animate-slide"
        style={{
          animationFillMode: 'both'
        }}
      >
        <h2
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 'clamp(1.15rem, 2.2vw, 1.45rem)',
            lineHeight: 1.55,
            letterSpacing: '0',
            fontWeight: 500,
            marginBottom: 22
          }}
        >
          {q.question}
        </h2>

        <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
          {letters.map(letter => {
            const isSelected = selected === letter
            return (
              <button
                key={letter}
                type="button"
                onClick={() => handleSelect(letter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '13px 16px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(139, 92, 246, 0.1)' : 'var(--surface)',
                  color: 'var(--text)',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  fontFamily: 'DM Sans, sans-serif',
                  width: '100%'
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    display: 'inline-grid',
                    placeItems: 'center',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(139, 92, 246, 0.18)' : 'var(--surface2)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                    flexShrink: 0
                  }}
                >
                  {letter}
                </span>
                <span style={{ lineHeight: 1.55 }}>
                  {q.options[letter]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <p style={{ color: '#ef4444', marginBottom: 12, fontSize: 14 }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={isLast ? handleSubmit : handleNext}
        disabled={!selected}
        className={selected ? 'cta-button' : ''}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: 12,
          border: selected ? 'none' : '1px solid #4a5060',
          background: selected
            ? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
            : '#3a3f4d',
          color: selected ? '#f8f7ff' : '#c2c7d6',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 15.5,
          fontWeight: 700,
          letterSpacing: '0.01em',
          cursor: selected ? 'pointer' : 'not-allowed',
          opacity: selected ? 1 : 0.75,
          transition: 'all 0.2s'
        }}
      >
        {isLast ? 'Submit quiz →' : 'Next question →'}
      </button>
    </div>
  )
}