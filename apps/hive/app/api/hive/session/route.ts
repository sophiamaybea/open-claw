import { NextResponse } from 'next/server'
import { signIn } from '@/lib/openclaw-supabase'

const secure = process.env.NODE_ENV === 'production'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || '')
    const password = String(body?.password || '')
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const session = await signIn(email, password)
    const response = NextResponse.json({ ok: true })
    response.cookies.set('oc_access', session.access_token, {
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
  } catch (error: any) {
    const status = Number(error?.status || 401)
    return NextResponse.json({ error: 'Unable to sign in to HIVE.' }, { status })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('oc_access', '', { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 0 })
  response.cookies.set('oc_refresh', '', { httpOnly: true, secure, sameSite: 'strict', path: '/', maxAge: 0 })
  return response
}
