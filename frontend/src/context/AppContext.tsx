'use client'
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

export type Screen = 'upload' | 'loading' | 'topics' | 'quiz' | 'grading' | 'results'

interface AppState {
  screen: Screen
  loadingMessage: string
  sessionId: string
  topics: string[]
  budget: any
  questions: any[]
  answers: Record<number, string>
  results: any
  setScreen: (s: Screen) => void
  setLoadingMessage: (m: string) => void
  setSessionId: (id: string) => void
  setTopics: (t: string[]) => void
  setBudget: (b: any) => void
  setQuestions: (q: any[]) => void
  setAnswer: (qid: number, selected: string) => void
  setResults: (r: any) => void
  resetForNewUpload: () => void
  expiryState: 'none' | 'warning' | 'expired'
  dismissExpiryWarning: () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('upload')
  const [loadingMessage, setLoadingMessage] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [budget, setBudget] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [results, setResults] = useState<any>(null)
  const [expiryState, setExpiryState] = useState<'none' | 'warning' | 'expired'>('none')
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (warningTimer.current) clearTimeout(warningTimer.current)
    if (expiryTimer.current) clearTimeout(expiryTimer.current)
    if (!sessionId) { setExpiryState('none'); return }
    setExpiryState('none')
    warningTimer.current = setTimeout(() => setExpiryState('warning'), 13 * 60 * 1000)
    expiryTimer.current = setTimeout(() => setExpiryState('expired'), 15 * 60 * 1000)
    return () => {
      if (warningTimer.current) clearTimeout(warningTimer.current)
      if (expiryTimer.current) clearTimeout(expiryTimer.current)
    }
  }, [sessionId])

  const dismissExpiryWarning = () => setExpiryState('none')

  const setAnswer = (qid: number, selected: string) =>
    setAnswers(prev => ({ ...prev, [qid]: selected }))

  const resetForNewUpload = () => {
    setSessionId('')
    setTopics([])
    setBudget(null)
    setQuestions([])
    setAnswers({})
    setResults(null)
  }

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      loadingMessage, setLoadingMessage,
      sessionId, setSessionId,
      topics, setTopics,
      budget, setBudget,
      questions, setQuestions,
      answers, setAnswer,
      results, setResults,
      resetForNewUpload,
      expiryState,
      dismissExpiryWarning,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}