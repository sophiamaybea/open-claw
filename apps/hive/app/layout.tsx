import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HIVE — OpenClaw visual operating system',
  description: 'A calm, inspectable control surface for OpenClaw missions, Bees, memory, opportunity intelligence, money and safety.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>
}
