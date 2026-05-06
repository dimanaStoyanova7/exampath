'use client'
import { useApp } from '@/context/AppContext'
import UploadScreen from './UploadScreen'
import TopicsScreen from './TopicsScreen'
import LoadingScreen from './LoadingScreen'
import QuizScreen from './QuizScreen'
import ResultsScreen from './ResultsScreen'

export default function AppShell() {
  const { screen, expiryState, dismissExpiryWarning, resetForNewUpload, setScreen } = useApp()

  let content
  if (screen === 'loading' || screen === 'grading') content = <LoadingScreen />
  else if (screen === 'topics') content = <TopicsScreen />
  else if (screen === 'quiz') content = <QuizScreen />
  else if (screen === 'results') content = <ResultsScreen />
  else content = <UploadScreen />

  return (
    <>
      {content}

      {expiryState === 'warning' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(245,158,11,0.12)',
          borderBottom: '1px solid rgba(245,158,11,0.35)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 13,
        }}>
          <span style={{ color: '#f59e0b' }}>
            Your session expires in ~2 minutes — finish up soon.
          </span>
          <button
            onClick={dismissExpiryWarning}
            style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {expiryState === 'expired' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          background: 'rgba(0,0,0,0.72)',
          display: 'grid',
          placeItems: 'center',
          padding: '1.5rem',
        }}>
          <div
            className="premium-card"
            style={{ maxWidth: 400, width: '100%', padding: '2.5rem 2rem', textAlign: 'center', borderRadius: 16 }}
          >
            <p style={{ fontSize: 36, marginBottom: 14 }}>⏱</p>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.55rem', marginBottom: 10 }}>
              Session expired
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.65, marginBottom: 26 }}>
              Your session timed out after 15 minutes. Re-upload your materials to start a new quiz.
            </p>
            <button
              type="button"
              className="cta-button"
              onClick={() => { resetForNewUpload(); setScreen('upload') }}
              style={{
                width: '100%',
                padding: '13px 18px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: '#f8f7ff',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Start over →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
