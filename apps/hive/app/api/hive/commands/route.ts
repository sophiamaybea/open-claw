import { NextRequest, NextResponse } from 'next/server'
import type { HiveCommand, HiveCommandResult } from '@/lib/engine-contract'

export const dynamic = 'force-dynamic'

const ALLOWED_COMMANDS = new Set<HiveCommand['type']>([
  'bee.check_in',
  'bee.pause',
  'bee.sleep',
  'bee.redirect',
  'bee.add_note',
  'bee.request_review',
  'mission.focus',
  'hive.feedback',
  'comfort.preference',
])

function isCommand(value: unknown): value is HiveCommand {
  if (!value || typeof value !== 'object') return false
  const type = (value as { type?: unknown }).type
  return typeof type === 'string' && ALLOWED_COMMANDS.has(type as HiveCommand['type'])
}

export async function POST(request: NextRequest) {
  const engineUrl = process.env.HIVE_ENGINE_URL?.replace(/\/$/, '')
  const engineToken = process.env.HIVE_ENGINE_TOKEN

  if (!engineUrl || !engineToken) {
    return NextResponse.json<HiveCommandResult>(
      {
        ok: false,
        status: 'rejected',
        message: 'HIVE is in preview mode. Private engine actions are not enabled.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  let command: unknown
  try {
    command = await request.json()
  } catch {
    return NextResponse.json<HiveCommandResult>(
      { ok: false, status: 'rejected', message: 'Invalid JSON command.' },
      { status: 400 },
    )
  }

  if (!isCommand(command)) {
    return NextResponse.json<HiveCommandResult>(
      { ok: false, status: 'rejected', message: 'Command type is not allowed by the HIVE gateway.' },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(`${engineUrl}/v1/hive/commands`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${engineToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })

    const payload = (await response.json()) as HiveCommandResult

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: payload.status ?? 'rejected',
          message: payload.message || `Engine returned ${response.status}`,
        },
        { status: response.status },
      )
    }

    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('HIVE engine command failed', error)
    return NextResponse.json<HiveCommandResult>(
      {
        ok: false,
        status: 'rejected',
        message: 'Private OpenClaw engine is unavailable. Nothing was executed.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
