'use client'
import { useApp } from '@/context/AppContext'

export default function LoadingScreen() {
  const { loadingMessage } = useApp()
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'transparent',
        padding: '2rem'
      }}
    >
      <div className="premium-card" style={{ textAlign: 'center', padding: '1.35rem 1.55rem', borderRadius: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '3px solid rgba(154, 168, 199, 0.22)',
            borderTopColor: 'var(--accent)',
            margin: '0 auto 14px',
            animation: 'spin 0.9s linear infinite'
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif', fontSize: '1.01rem', lineHeight: 1.6 }}>
          {loadingMessage || 'Loading…'}
        </p>
      </div>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}