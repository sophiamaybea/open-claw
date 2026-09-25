import HiveClient from './HiveClient'

export const metadata = {
  title: 'HIVE Control · OpenClaw',
  robots: { index: false, follow: false },
}

export default function HiveControlPage() {
  return <HiveClient />
}
