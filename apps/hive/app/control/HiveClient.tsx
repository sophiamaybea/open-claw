'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'

type HiveState = {
  tasks: any[]
  runs: any[]
  results: any[]
  memory: any[]
  events: any[]
  agents: any[]
  fetchedAt: string
}

const empty: HiveState = { tasks: [], runs: [], results: [], memory: [], events: [], agents: [], fetchedAt: '' }

function age(value?: string) {
  if (!value) return '—'
  const ms = Date.now() - new Date(value).getTime()
  const minutes = Math.max(0, Math.round(ms / 60000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return minutes + 'm'
  const hours = Math.round(minutes / 60)
  if (hours < 48) return hours + 'h'
  return Math.round(hours / 24) + 'd'
}

export default function HiveClient() {
  const [state, setState] = useState<HiveState>(empty)
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const load = useCallback(async () => {
    const response = await fetch('/api/hive/state', { cache: 'no-store' })
    if (response.status === 401) {
      setAuthed(false)
      setReady(true)
      return
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data.error || 'HIVE could not load.')
      setReady(true)
      return
    }
    const data = await response.json()
    setState(data)
    setAuthed(true)
    setError('')
    setReady(true)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!authed) return
    const timer = window.setInterval(load, 5000)
    return () => window.clearInterval(timer)
  }, [authed, load])

  async function login(event: FormEvent) {
    event.preventDefault()
    setError('')
    const response = await fetch('/api/hive/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) {
      setError('Sign-in failed.')
      return
    }
    setPassword('')
    await load()
  }

  async function logout() {
    await fetch('/api/hive/session', { method: 'DELETE' })
    setAuthed(false)
    setState(empty)
  }

  const metrics = useMemo(() => ({
    activeAgents: state.agents.filter(a => a.status === 'working').length,
    queued: state.tasks.filter(t => t.status === 'queued').length,
    running: state.tasks.filter(t => t.status === 'running').length,
    verified: state.results.filter(r => r.verification_status === 'verified').length,
    memory: state.memory.length,
  }), [state])

  if (!ready) {
    return <main className="hive-shell"><div className="hive-loading">CONNECTING TO HIVE…</div></main>
  }

  if (!authed) {
    return <main className="hive-shell hive-login-wrap">
      <form className="hive-login" onSubmit={login}>
        <div className="hive-kicker">OPENCLAW / PRIVATE CONTROL PLANE</div>
        <h1>Enter the HIVE.</h1>
        <p>The dashboard uses your Supabase user session. Anonymous database access is disabled.</p>
        <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        {error && <div className="hive-error">{error}</div>}
        <button type="submit">CONNECT</button>
      </form>
    </main>
  }

  return <main className="hive-shell">
    <header className="hive-topbar">
      <div><span className="hive-mark">H</span><strong>HIVE</strong><small>OPENCLAW VISUAL OPERATING SYSTEM</small></div>
      <div className="hive-top-actions"><span className="hive-live">● LIVE</span><span>REFRESH {state.fetchedAt ? age(state.fetchedAt) : '—'}</span><button onClick={logout}>SIGN OUT</button></div>
    </header>

    <section className="hive-command">
      <div>
        <div className="hive-kicker">STATE OF THE HIVE</div>
        <h1>Everything, folded.<br/><em>Nothing hidden.</em></h1>
      </div>
      <p>One shared state across the OpenClaw runtime, CLI, GitHub activity and this control plane. Drill down from system state to individual events and results.</p>
    </section>

    <section className="hive-metrics">
      <Metric label="WORKING BEES" value={metrics.activeAgents} />
      <Metric label="QUEUED" value={metrics.queued} />
      <Metric label="RUNNING" value={metrics.running} />
      <Metric label="VERIFIED RESULTS" value={metrics.verified} />
      <Metric label="MEMORY VISIBLE" value={metrics.memory} />
    </section>

    {error && <div className="hive-error hive-global-error">{error}</div>}

    <section className="hive-grid">
      <Panel title="TASK QUEUE" meta={state.tasks.length + ' VISIBLE'}>
        <div className="hive-list">{state.tasks.map(task => <article className="hive-row" key={task.id}>
          <span className={'status status-' + task.status}>{task.status}</span>
          <div><strong>{task.title}</strong><small>{task.source} · priority {task.priority}</small></div>
          <time>{age(task.updated_at)}</time>
        </article>)}</div>
      </Panel>

      <Panel title="LATEST RESULTS" meta={state.results.length + ' VISIBLE'}>
        <div className="hive-list">{state.results.map(result => <article className="hive-row" key={result.id}>
          <span className={'verify verify-' + result.verification_status}>{result.verification_status}</span>
          <div><strong>{result.title}</strong><small>{result.result_type}{result.score != null ? ' · score ' + result.score : ''}</small></div>
          <time>{age(result.created_at)}</time>
        </article>)}</div>
      </Panel>

      <Panel title="MACHINE MEMORY" meta={state.memory.length + ' RECORDS'}>
        <div className="hive-list memory-list">{state.memory.map(item => <article className="hive-row" key={item.id}>
          <span className="memory-kind">{item.kind}</span>
          <div><strong>{item.title}</strong><small>{item.summary || item.source} · confidence {Math.round(Number(item.confidence || 0) * 100)}%</small></div>
          <time>{age(item.updated_at)}</time>
        </article>)}</div>
      </Panel>

      <Panel title="SWARM" meta={state.agents.length + ' AGENTS'}>
        <div className="agent-grid">{state.agents.map(agent => <article className="agent-card" key={agent.id}>
          <div><span className={'agent-dot agent-' + agent.status}/><strong>{agent.name}</strong></div>
          <p>{agent.role || 'generalist'}</p>
          <small>{agent.status} · {age(agent.last_seen_at || agent.updated_at)}</small>
        </article>)}</div>
      </Panel>

      <Panel title="AUDIT STREAM" meta={state.events.length + ' EVENTS'} wide>
        <div className="event-stream">{state.events.map(event => <article key={event.id}>
          <time>{age(event.created_at)}</time><span>{event.source}</span><strong>{event.event_type}</strong><code>{event.source_ref || event.entity_type || 'event'}</code>
        </article>)}</div>
      </Panel>
    </section>
  </main>
}

function Metric({label, value}:{label:string,value:number}) {
  return <article><small>{label}</small><strong>{String(value).padStart(2, '0')}</strong></article>
}

function Panel({title, meta, wide=false, children}:{title:string,meta:string,wide?:boolean,children:React.ReactNode}) {
  return <section className={'hive-panel' + (wide ? ' hive-wide' : '')}><header><strong>{title}</strong><span>{meta}</span></header>{children}</section>
}
