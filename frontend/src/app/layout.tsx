import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ExamPath',
  description: 'Know exactly what to study.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
