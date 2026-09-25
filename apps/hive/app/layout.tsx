import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clawhouse — your private AI worker',
  description: 'We install, host and manage private AI workers that quietly handle the repetitive parts of your business.'
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
