import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HIVE — OpenClaw control surface',
  description:
    'An accessible visual control surface for OpenClaw missions, Bees, opportunities, memory, money, builds and system health.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
