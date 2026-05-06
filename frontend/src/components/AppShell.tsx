'use client'
import { useApp } from '@/context/AppContext'
import UploadScreen from './UploadScreen'
import TopicsScreen from './TopicsScreen'
import LoadingScreen from './LoadingScreen'

export default function AppShell() {
  const { screen } = useApp()
  if (screen === 'loading' || screen === 'grading') return <LoadingScreen />
  if (screen === 'topics') return <TopicsScreen />
  return <UploadScreen />
}