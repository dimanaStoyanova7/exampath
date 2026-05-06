'use client'
import { useApp } from '@/context/AppContext'

export default function TopicsScreen() {
  const { topics, budget, setScreen } = useApp()

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
          Your quiz will cover all of these. Review them before you start.
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
          ⚠ {budget.excluded_files.length} file(s) were not included — content budget reached.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {topics.map((topic, i) => (
          <span
            key={`${topic}-${i}`}
            className="animate-fade-up"
            style={{
              animationDelay: `${i * 40}ms`,
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

      <button
        className="cta-button"
        type="button"
        onClick={() => setScreen('quiz')}
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
          cursor: 'pointer'
        }}
      >
        Start quiz →
      </button>
    </div>
  )
}