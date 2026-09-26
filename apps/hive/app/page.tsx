'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Code2,
  Coins,
  FileText,
  FlaskConical,
  Folder,
  Hammer,
  Home as HomeIcon,
  Layers3,
  MoreHorizontal,
  RefreshCw,
  Radar,
  Search,
  Share2,
  Shield,
  Sun,
  Users,
} from 'lucide-react'

type HiveNode = {
  id: string
  label: string
  short: string
  category: string
  need: string
  timing: string
  related: string
  status: string
  accent: string
  bee: string
  x: number
  y: number
  size: number
  kind?: 'you' | 'task'
}

const majorNodes: HiveNode[] = [
  {
    id: 'research',
    label: 'Research AI tools',
    short: 'Explore AI tools for note organisation',
    category: 'Research',
    need: 'High',
    timing: 'Soon',
    related: 'Brain, Build, Work',
    status: 'Needs You',
    accent: '#913EE8',
    bee: 'Scout Bee 14',
    x: 43,
    y: 21,
    size: 112,
  },
  {
    id: 'prototype',
    label: 'Build prototype',
    short: 'Shape the first working HIVE interaction',
    category: 'Build',
    need: 'Medium',
    timing: 'Now',
    related: 'Build, Work',
    status: 'In motion',
    accent: '#1374C8',
    bee: 'Builder Bee 07',
    x: 27,
    y: 43,
    size: 120,
  },
  {
    id: 'visuals',
    label: 'Design new visuals',
    short: 'Finish the new visual system and interaction states',
    category: 'Design',
    need: 'High',
    timing: 'Today',
    related: 'Work, Build',
    status: 'Needs You',
    accent: '#DD43A4',
    bee: 'Studio Bee 03',
    x: 33,
    y: 64,
    size: 122,
  },
  {
    id: 'finances',
    label: 'Plan finances',
    short: 'Review Q3 budget and subscriptions',
    category: 'Finance',
    need: 'Medium',
    timing: 'This week',
    related: 'Money, Work',
    status: 'Review',
    accent: '#F2923A',
    bee: 'Ledger Bee 09',
    x: 54,
    y: 77,
    size: 116,
  },
  {
    id: 'docs',
    label: 'Write documentation',
    short: 'Finalise the user guide outline',
    category: 'Writing',
    need: 'Medium',
    timing: 'Soon',
    related: 'Brain, Build, Work',
    status: 'In motion',
    accent: '#20A879',
    bee: 'Archive Bee 21',
    x: 80,
    y: 36,
    size: 126,
  },
  {
    id: 'security',
    label: 'Security review',
    short: 'Check API permissions and deployment boundaries',
    category: 'Security',
    need: 'High',
    timing: 'This week',
    related: 'Security, Build',
    status: 'Needs You',
    accent: '#E63B66',
    bee: 'Guard Bee 02',
    x: 84,
    y: 59,
    size: 108,
  },
  {
    id: 'rest',
    label: 'Rest & recover',
    short: 'Protect a quiet block with no incoming work',
    category: 'Personal',
    need: 'Low',
    timing: 'Later',
    related: 'Me',
    status: 'Protected',
    accent: '#8A8179',
    bee: 'Care Bee 01',
    x: 81,
    y: 78,
    size: 112,
  },
  {
    id: 'you',
    label: 'YOU',
    short: 'More focus, less friction',
    category: 'Control centre',
    need: 'You',
    timing: 'Now',
    related: 'Everything',
    status: 'Present',
    accent: '#A98D7C',
    bee: 'Sophia',
    x: 61,
    y: 49,
    size: 142,
    kind: 'you',
  },
]

const ambientNodes = [
  [13, 28, 62, '#2D435F'], [18, 52, 20, '#F05493'], [23, 32, 28, '#8290A3'],
  [20, 72, 16, '#4AB89A'], [31, 28, 16, '#F08452'], [35, 17, 22, '#EB5B82'],
  [52, 17, 30, '#49B88A'], [69, 17, 38, '#4BAE88'], [89, 19, 36, '#32435A'],
  [95, 38, 30, '#A8A2AB'], [73, 51, 42, '#9447D6'], [93, 56, 28, '#9D9AA6'],
  [18, 66, 32, '#F09A42'], [45, 46, 32, '#3AAE82'], [52, 43, 18, '#F18E45'],
  [58, 38, 34, '#197BC3'], [46, 70, 22, '#F18B3E'], [64, 71, 28, '#2279C7'],
  [46, 88, 58, '#4C455F'], [60, 91, 20, '#207DBD'], [70, 86, 44, '#DE6A47'],
  [91, 88, 23, '#7D694D'], [72, 68, 35, '#AEA7B2'], [60, 64, 18, '#8340B3'],
  [57, 57, 19, '#F3933E'], [74, 31, 22, '#D954A6'], [88, 30, 32, '#EE4D9B'],
  [25, 80, 17, '#3FAD88'], [29, 90, 26, '#2D566A'], [13, 84, 14, '#5F456F'],
  [7, 62, 24, '#314052'], [7, 39, 48, '#27384F'], [92, 72, 15, '#5F7784'],
] as const

const connections = [
  'M43 21 C50 22 56 30 61 49',
  'M27 43 C39 42 49 45 61 49',
  'M33 64 C43 58 52 54 61 49',
  'M54 77 C58 67 61 59 61 49',
  'M61 49 C69 45 75 39 80 36',
  'M61 49 C70 52 78 55 84 59',
  'M61 49 C69 61 75 70 81 78',
  'M43 21 C31 27 28 34 27 43',
  'M27 43 C24 53 27 59 33 64',
  'M33 64 C38 73 45 77 54 77',
  'M54 77 C66 82 74 82 81 78',
  'M80 36 C86 43 87 51 84 59',
  'M84 59 C87 67 85 73 81 78',
]

const navItems = [
  ['Today', HomeIcon],
  ['Hive', Share2],
  ['Work', Folder],
  ['Bees', Users],
  ['Radar', Radar],
  ['Money', Coins],
  ['Brain', BrainCircuit],
  ['Build', Hammer],
  ['Lab', FlaskConical],
  ['Security', Shield],
  ['Me', CircleUserRound],
] as const

const needsYou = [
  ['research', 'Scout Bee 14', 'Explore AI tools for note organisation', 'Soon', '#913EE8'],
  ['visuals', 'Design new visuals', 'Finish homepage concepts', 'Today', '#DD43A4'],
  ['finances', 'Plan finances', 'Review Q3 budget and subscriptions', 'This week', '#F2923A'],
  ['security', 'Security review', 'Check API permissions', 'This week', '#E63B66'],
  ['docs', 'Write documentation', 'Finalise user guide outline', 'Soon', '#20A879'],
] as const

type LiveBee = { bee_id: string; role_bias: string; lifecycle_state: string; status: string; last_heartbeat_at: string | null; last_status: Record<string, unknown>; revenue_contribution: Record<string, number> }
type LiveWorkItem = { id: string; title: string; url: string | null; workstream: string; status: string; priority: number; claimed_by: string | null; payload: Record<string, unknown>; updated_at: string }
type LiveEvent = { id: number; bee_id: string; work_item_id: string | null; event_type: string; status: string; details: Record<string, unknown>; occurred_at: string }
type LiveOpportunity = { id: string; title: string; source_url: string; category: string; funding_verified: boolean; reward_amount: number | null; reward_currency: string | null; reward_status: string; status: string; confidence: number | null; last_verified_at: string }
type Snapshot = { generated_at: string; truth_note: string; bees: LiveBee[]; work_items: LiveWorkItem[]; events: LiveEvent[]; opportunities: LiveOpportunity[] }

const DASHBOARD_ENDPOINT = 'https://jaxdinqxfrgfpwcrhfum.supabase.co/functions/v1/hive-dashboard'

const relativeTime = (iso: string | null) => {
  if (!iso) return 'No heartbeat yet'
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return minutes + 'm ago'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + 'h ago'
  return Math.floor(hours / 24) + 'd ago'
}

export default function Home() {
  const [selectedId, setSelectedId] = useState('research')
  const [activeNav, setActiveNav] = useState('Today')
  const [mode, setMode] = useState<'simple' | 'full'>('full')
  const [comfort, setComfort] = useState(true)
  const [done, setDone] = useState<string[]>([])
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [liveLoading, setLiveLoading] = useState(true)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [plainOpen, setPlainOpen] = useState(false)
  const [technicalOpen, setTechnicalOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [colourBy, setColourBy] = useState<'Function' | 'Status'>('Function')
  const [sizeBy, setSizeBy] = useState<'Need for Sophia' | 'Priority'>('Need for Sophia')
  const [positionBy, setPositionBy] = useState<'Time' | 'Status'>('Time')

  const loadSnapshot = async () => {
    setLiveLoading(true)
    setLiveError(null)
    try {
      const response = await fetch(DASHBOARD_ENDPOINT, { cache: 'no-store' })
      if (!response.ok) throw new Error('Live data unavailable')
      setSnapshot(await response.json())
    } catch {
      setLiveError('Live OpenClaw data is unavailable. Nothing below is being presented as live until the connection recovers.')
    } finally {
      setLiveLoading(false)
    }
  }

  useEffect(() => { void loadSnapshot() }, [])

  const selected = useMemo(
    () => majorNodes.find((node) => node.id === selectedId) ?? majorNodes[0],
    [selectedId],
  )

  const liveItems = snapshot?.work_items ?? []
  const filteredLiveItems = liveItems.filter((item) => (item.title + ' ' + item.workstream + ' ' + item.status).toLowerCase().includes(query.toLowerCase()))
  const filteredBees = (snapshot?.bees ?? []).filter((bee) => (bee.bee_id + ' ' + bee.role_bias + ' ' + bee.status).toLowerCase().includes(query.toLowerCase()))
  const liveChanges = snapshot?.events.slice(0, 6) ?? []

  const toggleDone = () => {
    setDone((items) => items.includes(selected.id) ? items.filter((id) => id !== selected.id) : [...items, selected.id])
  }

  return (
    <main className={'hive-app ' + (comfort ? 'comfort-on' : '')}>
      <header className="topbar">
        <div className="wordmark">
          <div className="brand-dots"><i /><i /></div>
          <strong>HIVE</strong>
          <span>for OpenClaw</span>
        </div>

        <div className="mode-switch" aria-label="Complexity mode">
          <button className={mode === 'simple' ? 'active' : ''} onClick={() => setMode('simple')}>SIMPLE</button>
          <button className={mode === 'full' ? 'active' : ''} onClick={() => setMode('full')}>FULL</button>
        </div>

        <label className="searchbox">
          <Search size={20} />
          <input aria-label="Search your hive" placeholder="Search your hive…" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>

        <div className="top-actions">
          <button className="sun-button" aria-label="Refresh live data" onClick={() => void loadSnapshot()} disabled={liveLoading}><RefreshCw size={22} className={liveLoading ? 'spin' : ''} /></button>
          <button className={'comfort-button ' + (comfort ? 'active' : '')} onClick={() => setComfort((value) => !value)}>
            <Sun size={17} /> COMFORT
          </button>
        </div>
      </header>

      <aside className="sidebar">
        <nav>
          {navItems.map(([label, Icon]) => (
            <button
              key={label}
              className={activeNav === label ? 'active' : ''}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={25} strokeWidth={1.7} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span>keep<br />looking<br />for things<br />in places<br />where there<br />is nothing</span>
          <svg viewBox="0 0 84 130" aria-hidden="true"><path d="M8 8 C36 6 20 31 47 35 C75 39 38 68 68 77 C82 81 63 112 45 122" /></svg>
        </div>
      </aside>

      <section className="stage">
        <div className="stage-copy">
          <h1>{activeNav}</h1>
          <h2>YOUR HIVE AT A GLANCE</h2>
          <p>{activeNav === 'Today' ? <>A living map of what matters,<br />shaped around your energy,<br />attention and goals.</> : <>You are viewing <b>{activeNav}</b>.<br />The map stays visible while the<br />live operational panels refocus.</>}</p>
        </div>

        <div className="time-axis" aria-hidden="true">
          <span>LESS URGENT</span>
          <i />
          <b>LATER</b>
          <b>SOON</b>
          <b>NOW</b>
        </div>

        <div className="orbit-field">
          <svg className="connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {connections.map((path, index) => <path key={index} d={path} />)}
            <ellipse cx="59" cy="51" rx="28" ry="34" />
            <ellipse cx="59" cy="51" rx="38" ry="45" className="dashed" />
            <ellipse cx="59" cy="51" rx="48" ry="52" className="dotted" />
          </svg>

          <div className="star-dust dust-a" aria-hidden="true" />
          <div className="star-dust dust-b" aria-hidden="true" />

          {mode === 'full' && ambientNodes.map(([x, y, size, color], index) => (
            <span
              key={index}
              className="ambient-orb"
              style={{ left: x + '%', top: y + '%', width: size, height: size, backgroundColor: color }}
            />
          ))}

          {majorNodes.map((node) => (
            <button
              key={node.id}
              className={'orb task-orb ' + (node.kind === 'you' ? 'you-orb ' : '') + (selected.id === node.id ? 'selected ' : '')}
              style={{
                left: node.x + '%',
                top: node.y + '%',
                width: node.size,
                height: node.size,
                backgroundColor: node.accent,
              }}
              onClick={() => setSelectedId(node.id)}
              aria-label={'Open ' + node.label}
            >
              {node.kind === 'you' ? (
                <>
                  <CircleUserRound size={31} />
                  <strong>YOU</strong>
                  <small>More focus<br />less friction</small>
                </>
              ) : (
                <span>{node.label}</span>
              )}
            </button>
          ))}
        </div>

        <div className="map-controls">
          <button onClick={() => setColourBy((value) => value === 'Function' ? 'Status' : 'Function')}>
            <span className="control-icon palette-icon"><i /><i /><i /></span>
            <span><small>COLOUR BY</small><b>{colourBy}</b></span>
            <ChevronDown size={19} />
          </button>
          <button onClick={() => setSizeBy((value) => value === 'Need for Sophia' ? 'Priority' : 'Need for Sophia')}>
            <span className="control-icon size-icon"><i /><i /></span>
            <span><small>SIZE BY</small><b>{sizeBy}</b></span>
            <ChevronDown size={19} />
          </button>
          <button onClick={() => setPositionBy((value) => value === 'Time' ? 'Status' : 'Time')}>
            <span className="control-icon position-icon" />
            <span><small>POSITION BY</small><b>{positionBy}</b></span>
            <ChevronDown size={19} />
          </button>
        </div>
      </section>

      <aside className="inspector">
        <div className="inspector-head">
          <span className="bee-kind"><i style={{ backgroundColor: selected.accent }} /> {selected.category.toUpperCase()} BEE</span>
          <span>#{selected.bee.match(/\d+/)?.[0] ?? '01'}</span>
        </div>

        <div className="bee-title">
          <div>
            <h2>{selected.bee}</h2>
            <p>{selected.short}</p>
          </div>
          <div className="bee-organism" style={{ backgroundColor: selected.accent }}><i /><i /></div>
        </div>

        <span className="needs-pill" style={{ '--accent': selected.accent } as React.CSSProperties}>
          <i /> {done.includes(selected.id) ? 'Done' : selected.status}
        </span>

        <p className="inspector-description">
          {selected.id === 'research'
            ? 'Look into new tools that could help organise research, notes and ideas more visually. This supports your aim to reduce friction and keep knowledge connected across projects.'
            : selected.short + '. This visual node is part of the interface model; live operational truth is shown in the connected panels below.'}
        </p>

        <dl className="metadata">
          <div><dt><Radar size={20} /> Function</dt><dd>{selected.category}</dd></div>
          <div><dt><span className="meter-icon"><i /><i /><i /></span> Need for Sophia</dt><dd>{selected.need}</dd></div>
          <div><dt><Clock3 size={20} /> Timing</dt><dd>{selected.timing}</dd></div>
          <div><dt><Layers3 size={20} /> Related to</dt><dd>{selected.related}</dd></div>
        </dl>

        <div className="inspector-divider" />

        <button className="disclosure" onClick={() => setPlainOpen((value) => !value)} aria-expanded={plainOpen}>
          <FileText size={21} />
          <span><b>Plain English</b><small>Why this matters and what to do next.</small></span>
          <ChevronDown size={19} />
        </button>
        {plainOpen && <div className="disclosure-body">This card explains the selected visual node. Operational claims are only treated as live when they come from the connected OpenClaw backend.</div>}
        <button className="disclosure" onClick={() => setTechnicalOpen((value) => !value)} aria-expanded={technicalOpen}>
          <Code2 size={23} />
          <span><b>Technical Details</b><small>Links, files, prompts, metadata.</small></span>
          <ChevronDown size={19} />
        </button>
        {technicalOpen && <div className="disclosure-body technical">UI node: {selected.id}<br />Category: {selected.category}<br />Live source: {snapshot ? 'connected' : liveLoading ? 'connecting' : 'not connected'}<br />Generated: {snapshot?.generated_at ? new Date(snapshot.generated_at).toLocaleString() : 'not available'}</div>}

        <div className="inspector-actions">
          <button className="done-button" onClick={toggleDone}>
            {done.includes(selected.id) ? <Check size={21} /> : <CheckCircle2 size={21} />}
            {done.includes(selected.id) ? 'Marked done' : 'Mark as done'}
          </button>
          <button className="more-button" aria-label="More options" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}><MoreHorizontal size={24} /></button>
          {menuOpen && <div className="more-menu"><button onClick={() => { navigator.clipboard?.writeText(selected.label); setMenuOpen(false) }}>Copy label</button><button onClick={() => { setSelectedId('research'); setMenuOpen(false) }}>Reset selection</button></div>}
        </div>
      </aside>

      <section className="bottom-panel needs-panel">
        <div className="panel-heading">
          <h3><i className="orange-dot" /> Live work</h3>
          <span>{liveLoading ? 'connecting…' : liveError ? 'offline' : filteredLiveItems.length + ' items'}</span>
          <button aria-label="Refresh live work" onClick={() => void loadSnapshot()}>↻</button>
        </div>
        {liveError ? <div className="truth-state error">{liveError}</div> : liveLoading ? <div className="truth-state">Connecting to OpenClaw…</div> : (
          <div className="panel-list live-list">
            {filteredLiveItems.length === 0 && <div className="truth-state">No matching live work items.</div>}
            {filteredLiveItems.map((item) => (
              <button key={item.id} onClick={() => item.url && window.open(item.url, '_blank', 'noopener,noreferrer')}>
                <i className={'status-dot ' + item.status} />
                <b>{item.title}</b>
                <span>{item.workstream} · {item.status}{item.claimed_by ? ' · ' + item.claimed_by : ''}</span>
                <em>{relativeTime(item.updated_at)}</em>
              </button>
            ))}
          </div>
        )}
        {snapshot && <div className="truth-footer">{snapshot.truth_note}</div>}
      </section>

      <section className="bottom-panel changed-panel">
        <div className="panel-heading">
          <h3><i className="green-dot" /> Bees & changes</h3>
          <span>{snapshot ? filteredBees.length + ' bees' : '—'}</span>
          <button aria-label="Refresh bees" onClick={() => void loadSnapshot()}>↻</button>
        </div>
        {!liveError && snapshot && (
          <>
            <div className="bee-live-strip">
              {filteredBees.map((bee) => <button key={bee.bee_id} title={String(bee.last_status?.note ?? bee.role_bias)}><i className={'live-indicator ' + bee.status} /><b>{bee.bee_id.replace('G0-', '').replace('-001', '')}</b><span>{bee.status} · {relativeTime(bee.last_heartbeat_at)}</span></button>)}
            </div>
            <div className="change-list">
              {liveChanges.map((event) => (
                <div key={event.id}>
                  <i className={event.status}>{event.status === 'passed' ? '✓' : ''}</i>
                  <b>{event.bee_id.replace('G0-', '').replace('-001', '')}</b>
                  <span>{event.event_type.replaceAll('_', ' ')}</span>
                  <em>{relativeTime(event.occurred_at)}</em>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="stone-shadow" />
      </section>
    </main>
  )
}
