'use client'

import {
  Activity,
  AlertTriangle,
  Archive,
  Brain,
  Bug,
  ChevronRight,
  CircleDollarSign,
  Code2,
  FlaskConical,
  Focus,
  Home,
  Layers3,
  LayoutDashboard,
  Microscope,
  Moon,
  Pause,
  Radar,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  Sparkles,
  SunMedium,
  UserRound,
  UsersRound,
  WalletCards,
  Workflow,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  CATEGORY_COLOURS,
  DEMO_SNAPSHOT,
  Bee,
  BrainNode,
  HiveCategory,
  HiveSnapshot,
  Mission,
  Opportunity,
} from '@/lib/hive-data'

const HiveScene = dynamic(() => import('@/components/HiveScene'), {
  ssr: false,
  loading: () => <div className="scene-loading">Loading visual field…</div>,
})

type View =
  | 'Today'
  | 'Hive'
  | 'Work'
  | 'Bees'
  | 'Radar'
  | 'Money'
  | 'Brain'
  | 'Build'
  | 'Lab'
  | 'Security'
  | 'Me'

type ComfortMode =
  | 'Full Hive'
  | 'Focus'
  | 'Low Stimulation'
  | 'Migraine'
  | 'Low Energy'
  | 'Fog'
  | 'Text Only'
  | 'Custom'

type ComfortSettings = {
  mode: ComfortMode
  brightness: number
  contrast: number
  saturation: number
  textScale: number
  uiScale: number
  motion: 'off' | 'reduced' | 'normal'
  graph: 'simple' | 'balanced' | 'full'
  tint: string
}

const NAV: { view: View; icon: React.ComponentType<{ size?: number }> }[] = [
  { view: 'Today', icon: Home },
  { view: 'Hive', icon: LayoutDashboard },
  { view: 'Work', icon: Workflow },
  { view: 'Bees', icon: UsersRound },
  { view: 'Radar', icon: Radar },
  { view: 'Money', icon: CircleDollarSign },
  { view: 'Brain', icon: Brain },
  { view: 'Build', icon: Code2 },
  { view: 'Lab', icon: FlaskConical },
  { view: 'Security', icon: Shield },
  { view: 'Me', icon: UserRound },
]

const presets: Record<ComfortMode, Partial<ComfortSettings>> = {
  'Full Hive': { brightness: .92, contrast: .96, saturation: .94, textScale: 1, uiScale: 1, motion: 'reduced', graph: 'full', tint: '#162039' },
  Focus: { brightness: .88, contrast: 1, saturation: .72, textScale: 1.04, uiScale: 1.08, motion: 'reduced', graph: 'simple', tint: '#152039' },
  'Low Stimulation': { brightness: .78, contrast: .88, saturation: .5, textScale: 1.04, uiScale: 1.1, motion: 'off', graph: 'simple', tint: '#18243a' },
  Migraine: { brightness: .62, contrast: .76, saturation: .34, textScale: 1.08, uiScale: 1.12, motion: 'off', graph: 'simple', tint: '#1d2740' },
  'Low Energy': { brightness: .82, contrast: .9, saturation: .62, textScale: 1.09, uiScale: 1.16, motion: 'off', graph: 'simple', tint: '#20283b' },
  Fog: { brightness: .84, contrast: 1.06, saturation: .58, textScale: 1.14, uiScale: 1.16, motion: 'off', graph: 'simple', tint: '#17233d' },
  'Text Only': { brightness: .86, contrast: 1.02, saturation: .35, textScale: 1.08, uiScale: 1.12, motion: 'off', graph: 'simple', tint: '#17223b' },
  Custom: {},
}

function money(value: number) {
  if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}m`
  if (value >= 1000) return `£${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return `£${value.toLocaleString('en-GB')}`
}

function StatusDot({ category }: { category: HiveCategory }) {
  return <span className="status-dot" style={{ background: CATEGORY_COLOURS[category] }} />
}

function SectionTitle({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string
  title: string
  copy: string
}) {
  return (
    <header className="section-title">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{copy}</p>
    </header>
  )
}

function DetailCard({
  bee,
  onClose,
}: {
  bee: Bee
  onClose?: () => void
}) {
  return (
    <aside className="detail-card" aria-label={`Details for ${bee.name}`}>
      <div className="detail-topline">
        <div><StatusDot category={bee.category} /> {bee.family.toUpperCase()}</div>
        {onClose && <button className="icon-button" onClick={onClose} aria-label="Close details"><X size={18} /></button>}
      </div>
      <h2>{bee.name}</h2>
      <p className="detail-task">{bee.task}</p>
      <div className={`status-pill status-${bee.status}`}>{bee.status.replace('-', ' ')}</div>
      <p className="plain-copy">{bee.note}</p>
      <dl className="detail-list">
        <div><dt>Working for</dt><dd>{bee.duration}</dd></div>
        <div><dt>Cost</dt><dd>£{bee.cost.toFixed(2)}</dd></div>
        <div><dt>Priority</dt><dd>{bee.priority === 0 ? 'Needs you' : `Ring ${bee.priority}`}</dd></div>
      </dl>
      <div className="progressive">
        <button><span>Plain English</span><ChevronRight size={17} /></button>
        <button><span>Show work</span><ChevronRight size={17} /></button>
        <button><span>Permissions</span><ChevronRight size={17} /></button>
        <button><span>Technical details</span><ChevronRight size={17} /></button>
      </div>
    </aside>
  )
}

function TodayView({
  snapshot,
  motion,
  graph,
  simple,
  scrollProgress,
}: {
  snapshot: HiveSnapshot
  motion: ComfortSettings['motion']
  graph: ComfortSettings['graph']
  simple: boolean
  scrollProgress: React.MutableRefObject<number>
}) {
  const [selected, setSelected] = useState(snapshot.bees[0]?.id)
  const bee = snapshot.bees.find((item) => item.id === selected) ?? snapshot.bees[0]
  const nodes = snapshot.bees
    .slice(0, graph === 'simple' ? 7 : graph === 'balanced' ? 11 : 15)
    .map((item) => ({
      id: item.id,
      label: item.name,
      category: item.category,
      priority: item.priority,
      size: item.priority === 0 ? 1.28 : item.priority === 1 ? 1.12 : .88,
    }))

  const needsYou = snapshot.bees.filter((item) => item.status === 'needs-you')
  return (
    <div className="today-layout">
      <div className="main-column">
        <SectionTitle
          eyebrow="YOUR HIVE AT A GLANCE"
          title="Today"
          copy="A living map of what matters, shaped around your attention rather than the amount of machine activity."
        />
        <div className="visual-card target-card">
          <div className="axis-label axis-top">LESS URGENT</div>
          <div className="ring-words" aria-hidden="true"><span>NOW</span><span>SOON</span><span>LATER</span></div>
          {simple || graph === 'simple' ? (
            <div className="simple-target">
              <div className="simple-centre">YOU<small>{needsYou.length} things need you</small></div>
              {needsYou.map((item, index) => (
                <button
                  key={item.id}
                  style={{ '--bubble': CATEGORY_COLOURS[item.category] } as React.CSSProperties}
                  onClick={() => setSelected(item.id)}
                >
                  {item.family}
                </button>
              ))}
            </div>
          ) : (
            <HiveScene
              nodes={nodes}
              selectedId={selected}
              onSelect={setSelected}
              motion={motion}
              mode="attention"
              scrollProgress={scrollProgress}
            />
          )}
          <div className="visual-controls" aria-label="Visual encoding">
            <button><span className="multi-dot">●●●</span><b>COLOUR BY</b><small>Function</small></button>
            <button><Layers3 size={18}/><b>SIZE BY</b><small>Impact</small></button>
            <button><Focus size={18}/><b>POSITION BY</b><small>Need for you</small></button>
          </div>
        </div>
        <div className="summary-grid">
          <article className="summary-card">
            <header><span><StatusDot category="waiting"/>What needs you</span><strong>{needsYou.length}</strong></header>
            {needsYou.map((item) => (
              <button key={item.id} className="summary-row" onClick={() => setSelected(item.id)}>
                <span><StatusDot category={item.category}/>{item.name}</span>
                <small>{item.task}</small>
                <ChevronRight size={16}/>
              </button>
            ))}
          </article>
          <article className="summary-card">
            <header><span><StatusDot category="complete"/>What changed</span><strong>4</strong></header>
            <div className="change-row"><span>Completed</span><small>HIVE visual system consolidated</small><time>now</time></div>
            <div className="change-row"><span>New</span><small>Private memory bridge detected</small><time>today</time></div>
            <div className="change-row"><span>Safer</span><small>Frontend / engine boundary retained</small><time>today</time></div>
            <div className="change-row"><span>Working</span><small>House Bees visible but not over-privileged</small><time>today</time></div>
          </article>
        </div>
      </div>
      {bee && <DetailCard bee={bee} />}
    </div>
  )
}

function WorkView({
  missions,
  motion,
  scrollProgress,
}: {
  missions: Mission[]
  motion: ComfortSettings['motion']
  scrollProgress: React.MutableRefObject<number>
}) {
  const [selectedId, setSelectedId] = useState(missions[0]?.id)
  const selected = missions.find((m) => m.id === selectedId) ?? missions[0]
  const nodes = missions.map((m) => ({
    id: m.id,
    label: m.id,
    category: m.category,
    priority: m.priority,
    size: 1 + Math.min(m.beeCount, 9) / 10,
  }))
  return (
    <div className="work-layout">
      <div className="main-column">
        <SectionTitle
          eyebrow="PROBLEMS GET SOLVED HERE"
          title="Work"
          copy="Missions are problems. Bees gather around them. You see the state first and the machinery only when you ask."
        />
        <div className="visual-card work-visual">
          <HiveScene nodes={nodes} selectedId={selectedId} onSelect={setSelectedId} motion={motion} mode="attention" centreLabel="missions in motion" scrollProgress={scrollProgress} />
        </div>
        <div className="mission-strip">
          {missions.map((mission) => (
            <button key={mission.id} className={selectedId === mission.id ? 'selected' : ''} onClick={() => setSelectedId(mission.id)}>
              <StatusDot category={mission.category}/>
              <strong>{mission.id}</strong>
              <span>{mission.title}</span>
              <small>{mission.beeCount} Bees</small>
            </button>
          ))}
        </div>
      </div>
      <aside className="detail-card">
        <div className="detail-topline"><div><StatusDot category={selected.category}/>MISSION</div><span>#{selected.id}</span></div>
        <h2>{selected.id}</h2>
        <p className="detail-task">{selected.title}</p>
        <p className="plain-copy">{selected.summary}</p>
        <dl className="detail-list">
          <div><dt>Stage</dt><dd>{selected.stage}</dd></div>
          <div><dt>Bees</dt><dd>{selected.beeCount} active</dd></div>
          <div><dt>Needs you</dt><dd>{selected.needsUser ? 'Yes' : 'Nothing right now'}</dd></div>
          <div><dt>Next step</dt><dd>{selected.nextStep}</dd></div>
        </dl>
        <button className="primary-action"><Focus size={18}/> FOCUS HERE</button>
        <p className="calm-note">{selected.needsUser ? 'One decision is waiting for you.' : 'The swarm can continue without interrupting you.'}</p>
      </aside>
    </div>
  )
}

function BeesView({ bees }: { bees: Bee[] }) {
  const [selectedId, setSelectedId] = useState(bees[0]?.id)
  const selected = bees.find((bee) => bee.id === selectedId) ?? bees[0]
  return (
    <div className="bees-layout">
      <div className="main-column">
        <SectionTitle eyebrow="WHO IS DOING THE WORK?" title="Bees" copy="A stable roster. Every Bee has a job, permissions, history and a clear way to stop it." />
        <div className="filter-row">
          <button className="active">All {bees.length}</button>
          <button>Working {bees.filter(b => b.status === 'working').length}</button>
          <button>Needs you {bees.filter(b => b.status === 'needs-you').length}</button>
          <button>Sleeping {bees.filter(b => b.status === 'sleeping').length}</button>
        </div>
        <div className="bee-grid">
          {bees.map((bee) => (
            <button key={bee.id} className={`bee-card ${selectedId === bee.id ? 'selected' : ''}`} onClick={() => setSelectedId(bee.id)}>
              <div className="bee-orb" style={{ '--orb': CATEGORY_COLOURS[bee.category] } as React.CSSProperties}><span>{bee.id.replace('bee-', '#')}</span></div>
              <div className="bee-status"><span><StatusDot category={bee.category}/>{bee.status.replace('-', ' ')}</span></div>
              <strong>{bee.family}</strong>
              <small>{bee.task}</small>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <aside className="detail-card bee-control-card">
          <div className="detail-topline"><div><StatusDot category={selected.category}/>{selected.family.toUpperCase()}</div><span>{selected.id}</span></div>
          <h2>{selected.name}</h2>
          <div className="working-line"><StatusDot category="complete"/>{selected.status.toUpperCase()}</div>
          <p className="detail-task">{selected.task}</p>
          <div className="bee-metrics"><span><b>{selected.duration}</b> working</span><span><b>£{selected.cost.toFixed(2)}</b> cost</span></div>
          <button className="primary-action">CHECK IN</button>
          <div className="control-grid">
            <button><Pause size={16}/>Pause</button>
            <button><Moon size={16}/>Sleep</button>
            <button><RefreshCcw size={16}/>Redirect</button>
            <button><Archive size={16}/>Add note</button>
            <button><Search size={16}/>Show work</button>
            <button><Shield size={16}/>Permissions</button>
            <button><WalletCards size={16}/>Spending</button>
            <button><UsersRound size={16}/>Ask reviewer</button>
          </div>
          <div className="check-in-box">
            <strong>Check in with {selected.family}</strong>
            <button>What are you actually doing?</button>
            <button>Explain that without technical language.</button>
            <button>Stop and wait for me.</button>
          </div>
        </aside>
      )}
    </div>
  )
}

function RadarView({
  opportunities,
  motion,
  scrollProgress,
}: {
  opportunities: Opportunity[]
  motion: ComfortSettings['motion']
  scrollProgress: React.MutableRefObject<number>
}) {
  const [selectedId, setSelectedId] = useState(opportunities[0]?.id)
  const selected = opportunities.find(o => o.id === selectedId) ?? opportunities[0]
  const nodes = opportunities.map(o => ({
    id: o.id,
    label: o.title,
    category: o.category,
    priority: o.priority,
    size: .8 + Math.min(o.reward / 60000, 1.8),
  }))

  return (
    <div className="radar-layout">
      <div className="radar-filters">
        <SectionTitle eyebrow="OPPORTUNITIES AHEAD" title="Radar" copy="A living field of paid problems, prizes and neglected work, filtered by fit rather than hype." />
        {['Colour by · Industry','Size by · Reward','Competition · Any','Eligibility · Eligible','Deadline · Any','Confidence · Any','Capability match · Any','Bee effort · Any','Risk · Any','Source · Any'].map((label) => (
          <button key={label}>{label}<ChevronRight size={15}/></button>
        ))}
      </div>
      <div className="visual-card radar-card">
        <div className="axis-label axis-top">HIGH REWARD</div>
        <div className="axis-label axis-bottom">LOW REWARD</div>
        <div className="axis-label axis-left">SOONER</div>
        <div className="axis-label axis-right">LATER</div>
        <HiveScene nodes={nodes} selectedId={selectedId} onSelect={setSelectedId} motion={motion} mode="radar" centreLabel="best fit" scrollProgress={scrollProgress} />
      </div>
      <aside className="detail-card">
        <div className="detail-topline"><div><StatusDot category={selected.category}/>SELECTED OPPORTUNITY</div><span>{selected.id}</span></div>
        <h2>{selected.title}</h2>
        <p className="detail-task">{selected.industry}</p>
        <div className="reward-figure">{money(selected.reward)}</div>
        <dl className="detail-list">
          <div><dt>Deadline</dt><dd>{selected.deadline}</dd></div>
          <div><dt>Competition</dt><dd>{selected.competition}</dd></div>
          <div><dt>Confidence</dt><dd>{selected.confidence}%</dd></div>
          <div><dt>Capability match</dt><dd>{selected.capabilityMatch}%</dd></div>
        </dl>
        <div className="assessment"><Sparkles size={19}/><div><strong>Worth investigating</strong><p>High fit is not the same as guaranteed money. It becomes a mission only after rules and eligibility are checked.</p></div></div>
      </aside>
    </div>
  )
}

function MoneyView({ snapshot }: { snapshot: HiveSnapshot }) {
  const totals = useMemo(() => {
    const map = { verified: 0, accepted: 0, submitted: 0, solving: 0, potential: 0 }
    snapshot.money.forEach((item) => { map[item.stage] += item.amount })
    return map
  }, [snapshot.money])

  const stageLabel: Record<string, string> = {
    verified: 'VERIFIED MONEY',
    accepted: 'ACCEPTED',
    submitted: 'SUBMITTED',
    solving: 'BEING SOLVED',
    potential: 'POTENTIAL',
  }
  return (
    <div className="money-layout">
      <div className="main-column">
        <SectionTitle eyebrow="FROM POSSIBILITY TO PAYOUT" title="Money" copy="Financial certainty is separated physically. Potential is never allowed to look like cash already earned." />
        <div className="money-rings">
          {(['potential','solving','submitted','accepted','verified'] as const).map((stage, index) => (
            <div className={`money-ring ring-${index}`} key={stage}>
              <span>{stageLabel[stage]}</span>
            </div>
          ))}
          <div className="money-centre"><WalletCards size={30}/><strong>{money(totals.verified)}</strong><small>verified</small></div>
          {snapshot.money.map((item, index) => (
            <div
              className={`money-bubble money-${item.stage}`}
              key={item.id}
              style={{
                '--bubble': CATEGORY_COLOURS[item.category],
                '--angle': `${index * 71}deg`,
              } as React.CSSProperties}
            >
              <strong>{money(item.amount)}</strong><small>{item.title}</small>
            </div>
          ))}
        </div>
        <div className="money-cards">
          <article><small>Verified</small><strong>{money(totals.verified)}</strong></article>
          <article><small>Awaiting payment</small><strong>{money(totals.accepted)}</strong></article>
          <article><small>Submitted</small><strong>{money(totals.submitted)}</strong></article>
          <article><small>Potential</small><strong>{money(totals.potential)}</strong></article>
        </div>
      </div>
      <aside className="detail-card">
        <div className="detail-topline"><div><StatusDot category="complete"/>ECONOMIC REALITY</div></div>
        <h2>Money is a state machine</h2>
        <p className="plain-copy">The centre is money already verified. Every outer ring carries more uncertainty.</p>
        {Object.entries(totals).map(([key, value]) => (
          <div className="money-line" key={key}><span>{stageLabel[key]}</span><strong>{money(value)}</strong></div>
        ))}
        <div className="assessment"><Shield size={19}/><div><strong>Payout discipline</strong><p>Reward advertised ≠ reward earned. HIVE only promotes money inward when evidence exists.</p></div></div>
      </aside>
    </div>
  )
}

const brainColour: Record<BrainNode['kind'], string> = {
  decision: '#F0A23D',
  experiment: '#0870C5',
  learning: '#E653B7',
  architecture: '#823DDB',
  reference: '#14B47B',
}

function BrainView({ nodes }: { nodes: BrainNode[] }) {
  const [selected, setSelected] = useState(nodes[0])
  return (
    <div className="brain-layout">
      <div className="brain-answer">
        <SectionTitle eyebrow="CONNECT IDEAS, EVIDENCE, AND ACTION" title="Brain" copy="Ask for the ordinary-language answer first. Trace the evidence only when you want it." />
        <article className="answer-card">
          <div className="answer-from"><Brain size={18}/>HIVE</div>
          <h2>Why is the engine separate from the front end?</h2>
          <p>The interface can evolve quickly without giving browser code direct access to private memory, credentials or agent authority. HIVE asks the engine for safe projections; the engine owns privileged actions.</p>
          <div className="answer-actions"><button>Show evidence</button><button>Show map</button></div>
        </article>
      </div>
      <div className="brain-map">
        <div className="brain-core">OPENCLAW<small>shared truth</small></div>
        {nodes.map((node, index) => (
          <button
            key={node.id}
            className={selected.id === node.id ? 'selected' : ''}
            onClick={() => setSelected(node)}
            style={{
              '--node': brainColour[node.kind],
              '--x': `${12 + ((index * 23) % 72)}%`,
              '--y': `${14 + ((index * 31) % 67)}%`,
            } as React.CSSProperties}
          >
            <span>{node.kind}</span>
            <strong>{node.label}</strong>
          </button>
        ))}
      </div>
      <aside className="detail-card">
        <div className="detail-topline"><div><span className="status-dot" style={{background: brainColour[selected.kind]}}/>{selected.kind.toUpperCase()}</div><span>{selected.id}</span></div>
        <h2>{selected.label}</h2>
        <p className="plain-copy">{selected.summary}</p>
        <div className="progressive">
          <button><span>Why it matters</span><ChevronRight size={17}/></button>
          <button><span>Evidence</span><ChevronRight size={17}/></button>
          <button><span>Relationships</span><ChevronRight size={17}/></button>
          <button><span>History</span><ChevronRight size={17}/></button>
        </div>
      </aside>
    </div>
  )
}

function BuildView() {
  const stages = [
    ['IDEA', '#F0A23D'],
    ['DESIGN', '#E653B7'],
    ['BUILD', '#14B47B'],
    ['TEST', '#0870C5'],
    ['YOUR REVIEW', '#823DDB'],
    ['DEPLOY', '#777B91'],
  ]
  return (
    <div className="build-page">
      <SectionTitle eyebrow="SHAPE A BETTER HIVE" title="Build" copy="HIVE can propose changes to itself, but product changes move through visible tests and your approval." />
      <div className="build-stats">
        <article><StatusDot category="complete"/><span>HIVE health</span><strong>Healthy</strong></article>
        <article><StatusDot category="creative"/><span>Changes prepared</span><strong>3</strong></article>
        <article><StatusDot category="coding"/><span>Tests</span><strong>46 passing</strong></article>
      </div>
      <div className="pipeline">
        {stages.map(([label, colour], index) => (
          <div className="pipeline-stage" key={label}>
            <div className="pipeline-orb" style={{ '--stage': colour } as React.CSSProperties}>{label}</div>
            {index < stages.length - 1 && <div className="pipeline-line" />}
          </div>
        ))}
      </div>
      <div className="build-detail">
        <article className="change-card">
          <small>CHANGE #241 · UX & ACCESSIBILITY</small>
          <h2>Make HIVE bubbles easier to tap</h2>
          <div className="before-after"><span>Before<em>36px target</em></span><ChevronRight/><span>After<em>52px target</em></span></div>
          <p>Spacing increased, click targets enlarged, and no interaction relies on hover or precise dragging.</p>
          <div className="test-pass">✓ 46 automated checks passed</div>
        </article>
        <div className="approval-stack">
          <button className="primary-action">Preview change</button>
          <button className="success-action">Approve</button>
          <button>Change something</button>
          <button className="danger-action">Reject</button>
          <button><RefreshCcw size={17}/>Undo last HIVE update</button>
        </div>
      </div>
    </div>
  )
}

function SecurityView() {
  return (
    <div className="security-page">
      <div className="main-column">
        <SectionTitle eyebrow="A SAFER HIVE, FREER IDEAS" title="Security" copy="The interface shows boundaries and incidents without turning every anomaly into a wall of panic." />
        <div className="immune-view">
          <div className="immune-boundary">
            <span className="protected-centre"><Shield size={32}/>HIVE<small>protected</small></span>
            {[
              ['Research', 'research', '20%', '24%'],
              ['Writer', 'complete', '66%', '27%'],
              ['Builder', 'coding', '68%', '62%'],
              ['Planner', 'waiting', '46%', '73%'],
              ['Reviewer', 'creative', '23%', '65%'],
            ].map(([name, cat, left, top]) => (
              <span className="immune-bee" key={name} style={{ '--bubble': CATEGORY_COLOURS[cat as HiveCategory], left, top } as React.CSSProperties}>{name}<small>Bee</small></span>
            ))}
          </div>
          <div className="quarantine"><AlertTriangle size={22}/><strong>Quarantined Bee</strong><small>outside permission boundary</small></div>
        </div>
      </div>
      <aside className="detail-card">
        <div className="detail-topline"><div><StatusDot category="security"/>SECURITY INCIDENT</div><span>#4821</span></div>
        <h2>Bee quarantined</h2>
        <p className="detail-task">Attempted an action outside its permissions after reading untrusted external content.</p>
        <div className="reassurance">✓ It did not gain access. No secrets were exposed.</div>
        <dl className="detail-list">
          <div><dt>Trigger</dt><dd>External page</dd></div>
          <div><dt>Attempted action</dt><dd>Out-of-scope access</dd></div>
          <div><dt>Result</dt><dd>Blocked automatically</dd></div>
        </dl>
        <div className="progressive">
          <button><span>Anomaly trail</span><ChevronRight size={17}/></button>
          <button><span>Show permissions</span><ChevronRight size={17}/></button>
          <button><span>Show exactly what happened</span><ChevronRight size={17}/></button>
        </div>
      </aside>
    </div>
  )
}

function LabView() {
  const experiments = [
    ['Meta-cognition', 'Compare two task decomposition methods', 'Running'],
    ['Retrieval', 'Brain-first retrieval vs. ideation-first', 'Ready'],
    ['Opportunity scoring', 'Conservative expected-value challenger', 'Running'],
    ['Accessibility', 'Low-stimulation visual density test', 'Ready'],
  ]
  return (
    <div className="single-page">
      <SectionTitle eyebrow="SAFE EXPERIMENTATION" title="Lab" copy="Experiments stay temporary until evidence earns promotion. Attractive ideas do not silently become architecture." />
      <div className="lab-grid">
        {experiments.map(([type, title, status], index) => (
          <article key={title}>
            <div className="lab-number">0{index + 1}</div>
            <small>{type}</small>
            <h2>{title}</h2>
            <span>{status}</span>
            <dl><div><dt>Baseline</dt><dd>Current champion</dd></div><div><dt>Metric</dt><dd>Useful outcome / cost</dd></div><div><dt>Rollback</dt><dd>Immediate</dd></div></dl>
          </article>
        ))}
      </div>
    </div>
  )
}

function MeView({
  comfort,
  setComfort,
}: {
  comfort: ComfortSettings
  setComfort: React.Dispatch<React.SetStateAction<ComfortSettings>>
}) {
  const rows = [
    ['Preferred theme', 'Midnight modified', 'visual'],
    ['Motion', comfort.motion, 'visual'],
    ['Information density', comfort.graph, 'visual'],
    ['Touch targets', comfort.uiScale > 1.08 ? 'Large' : 'Standard', 'visual'],
    ['Visual overview before detail', 'Usually', 'workflow'],
    ['Voice instructions', 'Frequent', 'workflow'],
    ['Current Missions', 'Often returns', 'workflow'],
    ['Large tables', 'Avoid when possible', 'workflow'],
  ]
  return (
    <div className="me-page">
      <SectionTitle eyebrow="YOUR PREFERENCES, YOUR HIVE" title="Me" copy="Everything HIVE believes about how you work should be visible, editable and forgettable." />
      <div className="resume-card"><span>RESUME</span><h2>You were reviewing MIS-281</h2><p>Continue where you were, or see what changed first.</p><div><button className="primary-action">Continue</button><button>See changes first</button></div></div>
      <div className="preference-card">
        <header><SunMedium size={20}/><div><h2>Visual & workflow</h2><p>Interface preferences, not medical diagnoses.</p></div></header>
        {rows.map(([label, value]) => (
          <div className="preference-row" key={label}>
            <div><strong>{label}</strong><small>{value}</small></div>
            <div><button className="keep">Keep</button><button>Change</button><button className="forget">Forget</button><button>Why?</button></div>
          </div>
        ))}
      </div>
      <div className="privacy-card"><Shield size={25}/><div><h2>Your data, your control</h2><p>HIVE should remember settings that reduce friction, not infer private diagnoses it does not need.</p></div></div>
    </div>
  )
}

function ComfortPanel({
  settings,
  setSettings,
  close,
}: {
  settings: ComfortSettings
  setSettings: React.Dispatch<React.SetStateAction<ComfortSettings>>
  close: () => void
}) {
  const applyPreset = (mode: ComfortMode) => {
    setSettings((current) => ({ ...current, mode, ...presets[mode] }))
  }
  return (
    <div className="comfort-backdrop" role="presentation">
      <section className="comfort-panel" role="dialog" aria-modal="true" aria-label="Comfort controls">
        <header className="comfort-header">
          <div><SunMedium size={28}/><div><h2>Comfort</h2><p>Shape HIVE to feel calmer for your eyes, attention and hands.</p></div></div>
          <button className="icon-button" onClick={close} aria-label="Close comfort panel"><X size={20}/></button>
        </header>
        <div className="preset-grid">
          {(Object.keys(presets) as ComfortMode[]).map((mode) => (
            <button className={settings.mode === mode ? 'selected' : ''} onClick={() => applyPreset(mode)} key={mode}>
              <span className="preset-orbs">● ● ●</span>
              <strong>{mode}</strong>
              <small>{mode === 'Migraine' ? 'lower light + no motion' : mode === 'Fog' ? 'larger, clearer, simpler' : mode === 'Focus' ? 'less noise, more signal' : 'editable starting point'}</small>
            </button>
          ))}
        </div>
        <div className="comfort-columns">
          <div className="comfort-group">
            <h3>Appearance</h3>
            <label>Brightness <input type="range" min=".5" max="1.1" step=".01" value={settings.brightness} onChange={e => setSettings(s => ({...s, mode:'Custom', brightness:Number(e.target.value)}))}/><span>{Math.round(settings.brightness*100)}%</span></label>
            <label>Contrast <input type="range" min=".7" max="1.2" step=".01" value={settings.contrast} onChange={e => setSettings(s => ({...s, mode:'Custom', contrast:Number(e.target.value)}))}/><span>{Math.round(settings.contrast*100)}%</span></label>
            <label>Saturation <input type="range" min=".2" max="1.1" step=".01" value={settings.saturation} onChange={e => setSettings(s => ({...s, mode:'Custom', saturation:Number(e.target.value)}))}/><span>{Math.round(settings.saturation*100)}%</span></label>
            <label>Overall tint <input type="color" value={settings.tint} onChange={e => setSettings(s => ({...s, mode:'Custom', tint:e.target.value}))}/><span>{settings.tint}</span></label>
          </div>
          <div className="comfort-group">
            <h3>Typography & spacing</h3>
            <label>Font size <input type="range" min=".92" max="1.3" step=".01" value={settings.textScale} onChange={e => setSettings(s => ({...s, mode:'Custom', textScale:Number(e.target.value)}))}/><span>{Math.round(settings.textScale*100)}%</span></label>
            <label>Touch target <input type="range" min="1" max="1.35" step=".01" value={settings.uiScale} onChange={e => setSettings(s => ({...s, mode:'Custom', uiScale:Number(e.target.value)}))}/><span>{settings.uiScale > 1.15 ? 'Large' : settings.uiScale > 1.05 ? 'Relaxed' : 'Standard'}</span></label>
            <div className="segmented"><span>Motion</span>{(['off','reduced','normal'] as const).map(value => <button key={value} className={settings.motion === value ? 'selected' : ''} onClick={() => setSettings(s => ({...s, mode:'Custom', motion:value}))}>{value}</button>)}</div>
            <div className="segmented"><span>Graph</span>{(['simple','balanced','full'] as const).map(value => <button key={value} className={settings.graph === value ? 'selected' : ''} onClick={() => setSettings(s => ({...s, mode:'Custom', graph:value}))}>{value}</button>)}</div>
          </div>
        </div>
        <footer className="comfort-footer"><button onClick={() => applyPreset('Full Hive')}><RefreshCcw size={17}/>Reset screen</button><button className="primary-action" onClick={close}>Save as preset</button></footer>
      </section>
    </div>
  )
}

export default function HiveDashboard() {
  const [view, setView] = useState<View>('Today')
  const [simple, setSimple] = useState(false)
  const [comfortOpen, setComfortOpen] = useState(false)
  const [snapshot, setSnapshot] = useState<HiveSnapshot>(DEMO_SNAPSHOT)
  const rootRef = useRef<HTMLElement>(null)
  const scrollProgress = useRef(0)
  const [comfort, setComfort] = useState<ComfortSettings>({
    mode: 'Full Hive',
    brightness: .92,
    contrast: .96,
    saturation: .94,
    textScale: 1,
    uiScale: 1,
    motion: 'reduced',
    graph: 'full',
    tint: '#162039',
  })

  useEffect(() => {
    let cancelled = false
    fetch('/api/hive/snapshot', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Snapshot request failed: ${response.status}`)))
      .then((next: HiveSnapshot) => {
        if (!cancelled) setSnapshot(next)
      })
      .catch(() => {
        // Demo state is an intentional safe fallback until the private engine gateway is configured.
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || comfort.motion === 'off') {
      scrollProgress.current = 0
      return
    }

    gsap.registerPlugin(ScrollTrigger)
    const cleanups: Array<() => void> = []
    const reduced = comfort.motion === 'reduced'
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const ctx = gsap.context(() => {
      const intro = root.querySelectorAll('.section-title, .visual-card, .detail-card, .answer-card, .resume-card')
      gsap.fromTo(
        intro,
        { opacity: 0, y: reduced ? 10 : 22, rotationX: reduced ? 0 : 2.4, transformPerspective: 1100 },
        { opacity: 1, y: 0, rotationX: 0, duration: reduced ? .42 : .72, stagger: .025, ease: 'power3.out' },
      )

      const revealTargets = gsap.utils.toArray<HTMLElement>('.summary-card, .bee-card, .mission-strip > button, .money-cards article, .lab-grid article, .preference-row')
      revealTargets.forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: reduced ? 8 : 18 },
          {
            opacity: 1,
            y: 0,
            duration: reduced ? .36 : .58,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 96%',
              once: true,
            },
          },
        )
      })

      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: reduced ? .8 : .45,
        onUpdate: (self) => {
          scrollProgress.current = self.progress
        },
      })

      if (finePointer && !reduced) {
        const tiltTargets = root.querySelectorAll<HTMLElement>('.detail-card, .summary-card, .bee-card, .change-card, .lab-grid article, .answer-card')
        tiltTargets.forEach((element) => {
          const toX = gsap.quickTo(element, 'rotationX', { duration: .45, ease: 'power3.out' })
          const toY = gsap.quickTo(element, 'rotationY', { duration: .45, ease: 'power3.out' })
          const toZ = gsap.quickTo(element, 'z', { duration: .4, ease: 'power3.out' })

          const onMove = (event: PointerEvent) => {
            const rect = element.getBoundingClientRect()
            const x = (event.clientX - rect.left) / rect.width - .5
            const y = (event.clientY - rect.top) / rect.height - .5
            toX(y * -3.2)
            toY(x * 3.8)
            toZ(10)
          }
          const onLeave = () => {
            toX(0)
            toY(0)
            toZ(0)
          }

          element.addEventListener('pointermove', onMove)
          element.addEventListener('pointerleave', onLeave)
          cleanups.push(() => {
            element.removeEventListener('pointermove', onMove)
            element.removeEventListener('pointerleave', onLeave)
          })
        })
      }
    }, root)

    ScrollTrigger.refresh()
    return () => {
      cleanups.forEach((cleanup) => cleanup())
      ctx.revert()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [view, comfort.motion])

  const style = {
    '--hive-bg': comfort.tint,
    '--brightness': comfort.brightness,
    '--contrast': comfort.contrast,
    '--saturation': comfort.saturation,
    '--text-scale': comfort.textScale,
    '--ui-scale': comfort.uiScale,
  } as React.CSSProperties

  const content = (() => {
    if (view === 'Today' || view === 'Hive') return <TodayView snapshot={snapshot} motion={comfort.motion} graph={comfort.graph} simple={simple || comfort.mode === 'Text Only'} scrollProgress={scrollProgress} />
    if (view === 'Work') return <WorkView missions={snapshot.missions} motion={comfort.motion} scrollProgress={scrollProgress} />
    if (view === 'Bees') return <BeesView bees={snapshot.bees} />
    if (view === 'Radar') return <RadarView opportunities={snapshot.opportunities} motion={comfort.motion} scrollProgress={scrollProgress} />
    if (view === 'Money') return <MoneyView snapshot={snapshot} />
    if (view === 'Brain') return <BrainView nodes={snapshot.brain} />
    if (view === 'Build') return <BuildView />
    if (view === 'Lab') return <LabView />
    if (view === 'Security') return <SecurityView />
    return <MeView comfort={comfort} setComfort={setComfort} />
  })()

  return (
    <main ref={rootRef} className="hive-root" style={style}>
      <a className="skip-link" href="#hive-content">Skip to main content</a>
      <header className="topbar">
        <div className="wordmark"><span className="brand-dots">● ●</span>HIVE <small>for OpenClaw</small></div>
        <div className="mode-toggle" aria-label="Information level">
          <button className={!simple ? '' : 'selected'} onClick={() => setSimple(true)}>SIMPLE</button>
          <button className={!simple ? 'selected' : ''} onClick={() => setSimple(false)}>FULL</button>
        </div>
        <label className="search-box"><Search size={19}/><input aria-label="Search your hive" placeholder="Search your hive…"/></label>
        <div className="top-actions">
          <span className="source-state" title={snapshot.source === 'engine' ? 'Live projection from the private OpenClaw engine.' : 'Safe demo data is shown until the authenticated engine gateway is configured.'}><span className="live-dot"/>{snapshot.source === 'engine' ? 'LIVE ENGINE' : 'UI PREVIEW'}</span>
          <button className="comfort-button" onClick={() => setComfortOpen(true)}><SunMedium size={18}/>COMFORT</button>
        </div>
      </header>
      <aside className="sidebar" aria-label="Main navigation">
        <nav>
          {NAV.map(({view: item, icon: Icon}) => (
            <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>
              <Icon size={22}/><span>{item}</span>
            </button>
          ))}
        </nav>
        <div className="side-note">complexity<br/>folded,<br/>never hidden<span>⌁</span></div>
      </aside>
      <section id="hive-content" className="content" tabIndex={-1}>
        {content}
      </section>
      <div className="universal-actions">
        <button title="What am I looking at?">?</button>
        <button title="What needs me?"><Focus size={18}/></button>
        <button title="Comfort" onClick={() => setComfortOpen(true)}><SunMedium size={18}/></button>
        <button title="Change or report"><Settings2 size={18}/></button>
      </div>
      {comfortOpen && <ComfortPanel settings={comfort} setSettings={setComfort} close={() => setComfortOpen(false)} />}
      <div className="sr-only" aria-live="polite">Current screen: {view}</div>
    </main>
  )
}
