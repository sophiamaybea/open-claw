'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, CircleDot, Command, Database, LockKeyhole, Mail, Orbit, Search, ShieldCheck, Sparkles, Workflow } from 'lucide-react'

const AgentScene = dynamic(()=>import('@/components/AgentScene'),{ssr:false})

const chapters = [
  ['01','MAP THE DULL WORK','We find the repetitive decisions, handoffs and follow-ups that quietly eat your week.'],
  ['02','GIVE IT TOOLS','Your worker gets the exact accounts and systems it needs. Nothing else.'],
  ['03','PUT RULES AROUND IT','The model can reason. Deterministic policy decides what it may actually do.'],
  ['04','LET IT KEEP GOING','Standing orders, scheduled jobs and durable memory mean the work continues after you leave.']
]

const workers = [
  {name:'INBOX',desc:'Reads, sorts, drafts and follows up without turning your email into another dashboard.',icon:<Mail/>},
  {name:'SALES',desc:'Researches prospects, prepares outreach, tracks replies and keeps the pipeline moving.',icon:<Workflow/>},
  {name:'RESEARCH',desc:'Watches sources, gathers evidence, synthesises findings and leaves a useful brief.',icon:<Search/>},
  {name:'CUSTOM',desc:'We map the annoying bits of your actual job and build the worker around those.',icon:<Sparkles/>}
]

function Reveal({children,className=''}:{children:React.ReactNode,className?:string}){
  const ref=useRef<HTMLDivElement>(null)
  const [seen,setSeen]=useState(false)
  useEffect(()=>{
    const el=ref.current
    if(!el)return
    const io=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setSeen(true);io.disconnect()}},{threshold:.16})
    io.observe(el)
    return()=>io.disconnect()
  },[])
  return <div ref={ref} className={`reveal ${seen?'is-seen':''} ${className}`}>{children}</div>
}

function Cursor(){
  const dot=useRef<HTMLDivElement>(null)
  const ring=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    let x=0,y=0,rx=0,ry=0,raf=0
    const move=(e:PointerEvent)=>{x=e.clientX;y=e.clientY;if(dot.current)dot.current.style.transform=`translate3d(${x}px,${y}px,0)`}
    const loop=()=>{rx+=(x-rx)*.13;ry+=(y-ry)*.13;if(ring.current)ring.current.style.transform=`translate3d(${rx}px,${ry}px,0)`;raf=requestAnimationFrame(loop)}
    window.addEventListener('pointermove',move);raf=requestAnimationFrame(loop)
    return()=>{window.removeEventListener('pointermove',move);cancelAnimationFrame(raf)}
  },[])
  return <><div ref={ring} className="cursor-ring"/><div ref={dot} className="cursor-dot"/></>
}

function ScrollProgress(){
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const run=()=>{const h=document.documentElement.scrollHeight-innerHeight;const p=h?scrollY/h:0;if(ref.current)ref.current.style.transform=`scaleX(${p})`}
    run();addEventListener('scroll',run,{passive:true});return()=>removeEventListener('scroll',run)
  },[])
  return <div ref={ref} className="scroll-progress"/>
}

export default function Home(){
  return <main>
    <Cursor/><ScrollProgress/>
    <nav className="nav shell"><a className="brand" href="#top"><span className="mark">C</span>CLAWHOUSE</a><div className="nav-index"><span>MANAGED AI WORKERS</span><span>EST. 2026</span></div><a className="nav-cta magnetic" href="mailto:hello@studiobeasophia.com?subject=Build%20my%20AI%20worker">BUILD MINE <ArrowUpRight size={14}/></a></nav>
    <section id="top" className="hero-awwwards"><div className="hero-gridline hero-gridline-a"/><div className="hero-gridline hero-gridline-b"/><div className="hero-serial">PRIVATE / AUTONOMOUS / YOURS</div><div className="hero-scene"><AgentScene/></div><div className="hero-copy-a shell"><div className="eyebrow"><CircleDot size={12}/> PRIVATE AI, ACTUALLY WORKING</div><h1><span>YOUR</span><span>QUIETEST</span><span className="italic">EMPLOYEE</span></h1></div><div className="hero-bottom shell"><p>We install a private AI worker around the way your business already works. It researches, organises, follows up and keeps moving after you close the laptop.</p><div className="hero-bottom-actions"><a className="button black" href="mailto:hello@studiobeasophia.com?subject=Build%20my%20AI%20worker">BUILD MY WORKER <ArrowUpRight size={16}/></a><a className="round-link" href="#system">↓</a></div></div><div className="status-pill"><span className="live-dot"/> WORKER ONLINE <b>24 / 7</b></div></section>
    <section className="ticker" aria-label="capabilities"><div>GMAIL <i>↗</i> CALENDAR <i>↗</i> RESEARCH <i>↗</i> SALES <i>↗</i> DRIVE <i>↗</i> CRM <i>↗</i> SHOPIFY <i>↗</i> YOUR WORKFLOW <i>↗</i> </div></section>
    <section className="manifesto shell"><Reveal><p className="overline">NOT ANOTHER CHAT WINDOW</p><p className="manifesto-line">Most AI waits for you.</p><p className="manifesto-line offset">Yours gets <em>a job.</em></p></Reveal><div className="manifesto-notes"><span>STANDING ORDERS</span><span>SCHEDULED WORK</span><span>DURABLE MEMORY</span><span>REAL TOOLS</span></div></section>
    <section id="system" className="machine-room"><div className="machine-sticky shell"><div className="machine-title"><span>HOW IT BECOMES USEFUL</span><h2>We build the<br/><em>machine room.</em></h2></div><div className="machine-telemetry"><span>GATEWAY: PRIVATE</span><span>STATE: PERSISTENT</span><span>POLICY: ENFORCED</span></div></div><div className="chapter-list shell">{chapters.map(([n,t,d],i)=><Reveal key={n}><article className="chapter"><div className="chapter-number">{n}</div><div><h3>{t}</h3><p>{d}</p></div><div className="chapter-orbit"><span>{i===0?'DISCOVER':i===1?'CONNECT':i===2?'GUARD':'RUN'}</span></div></article></Reveal>)}</div></section>
    <section id="workers" className="workers-section"><div className="shell worker-head"><p className="overline">CHOOSE THE FIRST JOB</p><h2>One worker.<br/><em>One clear responsibility.</em></h2></div><div className="worker-rail">{workers.map((worker,i)=><article className="worker-panel" key={worker.name}><div className="panel-top"><span>0{i+1}</span>{worker.icon}</div><h3>{worker.name}</h3><p>{worker.desc}</p><div className="panel-foot"><span>PRIVATE INSTANCE</span><ArrowUpRight/></div></article>)}</div></section>
    <section className="control-plane shell"><Reveal className="control-intro"><p className="overline">THE PRIVATE CONTROL PLANE</p><h2>One business.<br/>One isolated brain.</h2><p>Every customer gets their own agent boundary, persistent workspace and credentials. We do not put everybody inside one giant shared machine.</p></Reveal><div className="control-diagram"><div className="control-node business-node"><span>YOUR<br/>BUSINESS</span></div><div className="control-wire"><i/><i/><i/></div><div className="gateway-card"><div className="gateway-head"><Command/><span>PRIVATE GATEWAY</span></div><strong>24:00:00</strong><small>ALWAYS-ON CONTROL PLANE</small></div><div className="control-wire"><i/><i/><i/></div><div className="tool-cluster"><span><Database/> MEMORY</span><span><ShieldCheck/> RULES</span><span><Orbit/> JOBS</span><span><LockKeyhole/> SECRETS</span></div></div></section>
    <section className="statement-band"><div className="shell"><Reveal><p>TELL US THE REPETITIVE PARTS OF YOUR JOB.</p><h2>WE BUILD<br/><em>THE EMPLOYEE.</em></h2></Reveal></div></section>
    <section id="pricing" className="pricing-new shell"><div className="pricing-aside"><p className="overline">PILOT PRICING</p><h2>Start with<br/>one useful thing.</h2><p>We scope one responsibility, build the worker around it, then expand only when it is proving useful.</p></div><div className="pricing-main"><article className="price-feature"><div className="price-head"><span>SMALL BUSINESS</span><span className="live-dot"/></div><div className="price-figure">£300 <small>setup</small></div><p>from £149 / month</p><ul><li><Check/>private managed gateway</li><li><Check/>multiple workflows</li><li><Check/>custom standing orders</li><li><Check/>health monitoring</li></ul><a href="mailto:hello@studiobeasophia.com?subject=Small%20business%20AI%20worker">BUILD MY WORKER <ArrowUpRight/></a></article><div className="price-small-grid"><article><span>SOLO</span><strong>£99</strong><p>setup · from £39/month</p><a href="mailto:hello@studiobeasophia.com?subject=Solo%20AI%20worker">START SMALL ↗</a></article><article><span>CUSTOM EMPLOYEE</span><strong>£750+</strong><p>setup · from £250/month</p><a href="mailto:hello@studiobeasophia.com?subject=Custom%20AI%20employee">SCOPE THE JOB ↗</a></article></div></div></section>
    <footer className="footer-new"><div className="shell footer-grid"><div className="footer-title"><span className="brand invert"><span className="mark">C</span>CLAWHOUSE</span><h2>WHAT WOULD YOU<br/><em>STOP DOING</em><br/>TOMORROW?</h2></div><div className="footer-side"><p>Tell us the dull, repetitive, easy-to-forget work. We’ll tell you what can be handed over.</p><a className="button acid" href="mailto:hello@studiobeasophia.com?subject=Build%20my%20AI%20worker">BUILD MY WORKER <ArrowUpRight/></a><div className="footer-meta"><span>PRIVATE BY DESIGN</span><span>STUDIO BEA SOPHIA / 2026</span></div></div></div></footer>
  </main>
}
