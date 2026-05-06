'use client'
import { useState, useRef, DragEvent } from 'react'
import { useApp } from '@/context/AppContext'
import { uploadAndAnalyze, generateQuiz } from '@/lib/api'

export default function UploadScreen() {
  const { setScreen, setLoadingMessage, setSessionId, setTopics, setBudget, setQuestions, resetForNewUpload } = useApp()
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [quizFailed, setQuizFailed] = useState(false)
  const quizRetryId = useRef('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const pdfs = Array.from(incoming).filter(f => f.name.endsWith('.pdf'))
    setFiles(prev => {
      const combined = [...prev, ...pdfs]
      return combined.slice(0, 15)
    })
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  const removeFile = (i: number) =>
    setFiles(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (files.length === 0) { setError('Add at least one PDF.'); return }
    setError('')
    setQuizFailed(false)
    quizRetryId.current = ''
    resetForNewUpload()
    setLoadingMessage('Analyzing your materials…')
    setScreen('loading')

    let data: any
    try {
      data = await uploadAndAnalyze(files)
    } catch {
      setScreen('upload')
      setError('Upload failed. Check your connection and try again.')
      return
    }

    setSessionId(data.session_id)
    setTopics(data.topics)
    setBudget(data.budget)
    quizRetryId.current = data.session_id
    setLoadingMessage('Generating your quiz…')

    try {
      const quiz = await generateQuiz(data.session_id)
      setQuestions(quiz.questions)
      setScreen('topics')
    } catch {
      setScreen('upload')
      setError('Quiz generation failed.')
      setQuizFailed(true)
    }
  }

  const handleRetryQuiz = async () => {
    if (!quizRetryId.current) return
    setError('')
    setQuizFailed(false)
    setLoadingMessage('Generating your quiz…')
    setScreen('loading')
    try {
      const quiz = await generateQuiz(quizRetryId.current)
      setQuestions(quiz.questions)
      setScreen('topics')
    } catch {
      setScreen('upload')
      setError('Quiz generation failed again. Please try re-uploading.')
    }
  }

  return (
    <div
      style={{
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        padding: '5.25rem 1.25rem 3.5rem'
      }}
    >
      <div style={{ marginBottom: 34 }}>
        <h1
          style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2.8rem, 7vw, 5.2rem)',
            lineHeight: 0.95,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            marginBottom: 18,
            textWrap: 'balance'
          }}
        >
          Know exactly
          <br />
          what to study.
        </h1>
        <p
          style={{
            fontFamily: 'DM Sans, sans-serif',
            color: 'var(--text-muted)',
            fontSize: '1.08rem',
            lineHeight: 1.72,
            maxWidth: 640
          }}
        >
          Upload your course materials. ExamPath diagnoses your knowledge gaps and tells you where to focus.
        </p>
      </div>

      <div
        className="premium-card"
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={e => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        style={{
          border: `1.5px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 14,
          padding: '2.9rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
          transition: 'all 0.2s',
          marginBottom: 20
        }}
      >
        <p style={{ fontSize: '1.75rem', marginBottom: 12 }}>📄</p>
        <p style={{ fontSize: 17, fontWeight: 500, marginBottom: 8 }}>Drop PDFs here or click to browse</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>Up to 15 files</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div
          className="premium-card"
          style={{
            marginBottom: 20,
            border: '1px solid var(--border)',
            borderRadius: 12,
            background: 'var(--surface)'
          }}
        >
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '0.75rem 1rem',
                borderBottom: i === files.length - 1 ? 'none' : '1px solid var(--border)'
              }}
            >
              <span
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.name}
              </span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: 16
                }}
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p style={{ color: '#ef4444', marginBottom: 10, fontSize: 14 }}>
          {error}
        </p>
      )}

      {quizFailed && (
        <button
          type="button"
          onClick={handleRetryQuiz}
          style={{
            display: 'block',
            marginBottom: 14,
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid var(--accent)',
            background: 'transparent',
            color: 'var(--accent)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.01em'
          }}
        >
          Retry quiz generation →
        </button>
      )}

      <button
        className={files.length > 0 ? 'cta-button' : ''}
        type="button"
        onClick={handleSubmit}
        disabled={files.length === 0}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: 12,
          background: files.length > 0 ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : '#3a3f4d',
          color: files.length > 0 ? '#f8f7ff' : '#c2c7d6',
          border: files.length > 0 ? 'none' : '1px solid #4a5060',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 15.5,
          fontWeight: 700,
          letterSpacing: '0.01em',
          cursor: files.length > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s'
        }}
      >
        Analyze materials →
      </button>
    </div>
  )
}

