import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LearningRadar',
  description: 'Know exactly what to study.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'LearningRadar',
    description: 'Know exactly what to study.',
    images: [{ url: '/metadata-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LearningRadar',
    description: 'Know exactly what to study.',
    images: ['/metadata-image.png'],
  },
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
