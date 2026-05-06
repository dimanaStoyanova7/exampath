'use client'
import { createContext, useContext, useState, ReactNode } from 'react'

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
      resetForNewUpload
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