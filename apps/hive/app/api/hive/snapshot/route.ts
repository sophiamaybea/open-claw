import { NextResponse } from 'next/server'
import { DEMO_SNAPSHOT, type HiveSnapshot } from '@/lib/hive-data'

export const dynamic = 'force-dynamic'

function looksLikeSnapshot(value: unknown): value is HiveSnapshot {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<HiveSnapshot>
  return Array.isArray(candidate.bees)
    && Array.isArray(candidate.missions)
    && Array.isArray(candidate.opportunities)
    && Array.isArray(candidate.money)
    && Array.isArray(candidate.brain)
}

export async function GET() {
  const engineUrl = process.env.HIVE_ENGINE_URL?.replace(/\/$/, '')
  const engineToken = process.env.HIVE_ENGINE_TOKEN

  if (!engineUrl) {
    return NextResponse.json(
      { ...DEMO_SNAPSHOT, source: 'demo', updatedAt: new Date().toISOString() },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  if (!engineToken) {
    return NextResponse.json(
      { error: 'HIVE engine is configured without a server-side access token.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const response = await fetch(`${engineUrl}/v1/hive/snapshot`, {
      headers: {
        Authorization: `Bearer ${engineToken}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      throw new Error(`Engine returned ${response.status}`)
    }

    const payload: unknown = await response.json()
    if (!looksLikeSnapshot(payload)) {
      throw new Error('Engine snapshot did not match the HIVE projection contract.')
    }

    return NextResponse.json(
      { ...payload, source: 'engine' },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('HIVE engine snapshot failed', error)
    return NextResponse.json(
      {
        error: 'Private OpenClaw engine is unavailable.',
        stale: true,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
