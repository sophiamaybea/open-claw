import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HIVE for OpenClaw',
  description: 'A front-end visual prototype of the HIVE operating system for OpenClaw.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
