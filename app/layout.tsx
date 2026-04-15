import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HTML Visual Editor',
  description: 'Edit any HTML page visually — click, drag, and customise without writing code.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
