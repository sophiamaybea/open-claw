import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { loadHiveState, refreshSession, SupabaseHTTPError } from '@/lib/openclaw-supabase'

const secure = process.env.NODE_ENV === 'production'

export async function GET() {
  const store = await cookies()
  let access = store.get('oc_access')?.value
  const refresh = store.get('oc_refresh')?.value

  if (!access) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }

  try {
    const state = await loadHiveState(access)
    return NextResponse.json(state)
  } catch (error) {
    if (error instanceof SupabaseHTTPError && error.status === 401 && refresh) {
      try {
        const session = await refreshSession(refresh)
        access = session.access_token
        const state = await loadHiveState(access)
        const response = NextResponse.json(state)
        response.cookies.set('oc_access', access, {
          httpOnly: true,
          secure,
          sameSite: 'strict',
          path: '/',
          maxAge: Math.max(60, Number(session.expires_in || 3600)),
        })
        if (session.refresh_token) {
          response.cookies.set('oc_refresh', session.refresh_token, {
            httpOnly: true,
            secure,
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
          })
        }
        return response
      } catch {
        return NextResponse.json({ error: 'Session expired.' }, { status: 401 })
      }
    }
    return NextResponse.json({ error: 'Unable to load HIVE state.' }, { status: 500 })
  }
}
