'use client'
import { useApp } from '@/context/AppContext'
import UploadScreen from './UploadScreen'
import TopicsScreen from './TopicsScreen'
import LoadingScreen from './LoadingScreen'
import QuizScreen from './QuizScreen'
import ResultsScreen from './ResultsScreen'


export default function AppShell() {
  const { screen } = useApp()
  if (screen === 'loading' || screen === 'grading') return <LoadingScreen />
  if (screen === 'topics') return <TopicsScreen />
  if (screen === 'quiz') return <QuizScreen />
  if (screen === 'results') return <ResultsScreen />
  return <UploadScreen />
}
