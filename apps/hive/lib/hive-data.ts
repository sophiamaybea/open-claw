export type HiveCategory =
  | 'research'
  | 'coding'
  | 'complete'
  | 'waiting'
  | 'creative'
  | 'security'
  | 'neutral'

export type BeeStatus = 'working' | 'idle' | 'sleeping' | 'needs-you'

export type Bee = {
  id: string
  name: string
  family: string
  task: string
  status: BeeStatus
  category: HiveCategory
  priority: number
  cost: number
  duration: string
  note: string
  permissions: string[]
}

export type Mission = {
  id: string
  title: string
  summary: string
  stage: string
  beeCount: number
  category: HiveCategory
  priority: number
  nextStep: string
  needsUser: boolean
}

export type Opportunity = {
  id: string
  title: string
  industry: string
  reward: number
  deadline: string
  competition: 'Low' | 'Medium' | 'High' | 'Unknown'
  confidence: number
  capabilityMatch: number
  category: HiveCategory
  priority: number
}

export type MoneyItem = {
  id: string
  title: string
  amount: number
  stage: 'verified' | 'accepted' | 'submitted' | 'solving' | 'potential'
  category: HiveCategory
}

export type BrainNode = {
  id: string
  label: string
  kind: 'decision' | 'experiment' | 'learning' | 'architecture' | 'reference'
  summary: string
}

export type HiveSnapshot = {
  source: 'demo' | 'engine'
  updatedAt: string
  bees: Bee[]
  missions: Mission[]
  opportunities: Opportunity[]
  money: MoneyItem[]
  brain: BrainNode[]
}

export const CATEGORY_COLOURS: Record<HiveCategory, string> = {
  research: '#823DDB',
  coding: '#0870C5',
  complete: '#14B47B',
  waiting: '#F0A23D',
  creative: '#E653B7',
  security: '#F00559',
  neutral: '#777B91',
}

export const DEMO_SNAPSHOT: HiveSnapshot = {
  source: 'demo',
  updatedAt: new Date().toISOString(),
  bees: [
    { id: 'bee-14', name: 'Scout Bee 14', family: 'Scout Bee', task: 'Find neglected paid technical problems', status: 'needs-you', category: 'research', priority: 0, cost: .23, duration: '39 min', note: 'Found three candidates worth deeper investigation.', permissions: ['public web', 'public GitHub', 'Brain read'] },
    { id: 'bee-02', name: 'Research Bee 02', family: 'Research Bee', task: 'Compare evidence for two research paths', status: 'working', category: 'research', priority: 2, cost: .18, duration: '27 min', note: 'No action needed.', permissions: ['public web', 'Brain read'] },
    { id: 'bee-03', name: 'Builder Bee 03', family: 'Builder Bee', task: 'Build the HIVE control surface', status: 'working', category: 'coding', priority: 1, cost: .48, duration: '1 h 12 min', note: 'Implementing accessible visual controls.', permissions: ['GitHub branch', 'test runner'] },
    { id: 'bee-04', name: 'Debug Bee 04', family: 'Debug Bee', task: 'Inspect failing integration tests', status: 'idle', category: 'coding', priority: 3, cost: .07, duration: '14 min', note: 'Waiting for a new build.', permissions: ['test logs', 'repository read'] },
    { id: 'bee-05', name: 'Maths Bee 05', family: 'Maths Bee', task: 'Model opportunity expected value', status: 'working', category: 'complete', priority: 2, cost: .11, duration: '22 min', note: 'Testing a conservative scoring model.', permissions: ['Brain read', 'calculation tools'] },
    { id: 'bee-06', name: 'Science Bee 06', family: 'Science Bee', task: 'Search prize and challenge programmes', status: 'working', category: 'research', priority: 3, cost: .14, duration: '31 min', note: 'Two programmes need eligibility checks.', permissions: ['public web', 'Brain read'] },
    { id: 'bee-07', name: 'Security Bee 07', family: 'Security Bee', task: 'Check dependency and permission boundaries', status: 'working', category: 'security', priority: 1, cost: .09, duration: '19 min', note: 'No critical findings.', permissions: ['dependency metadata', 'audit read'] },
    { id: 'bee-08', name: 'Reviewer Bee 08', family: 'Reviewer Bee', task: 'Challenge Builder Bee output', status: 'needs-you', category: 'creative', priority: 0, cost: .05, duration: '8 min', note: 'One product decision needs a human choice.', permissions: ['repository read', 'preview read'] },
    { id: 'bee-09', name: 'Tester Bee 09', family: 'Tester Bee', task: 'Run HIVE interaction tests', status: 'working', category: 'complete', priority: 2, cost: .04, duration: '11 min', note: '46 checks passed.', permissions: ['test runner'] },
    { id: 'bee-10', name: 'Archivist Bee 10', family: 'Archivist Bee', task: 'Consolidate verified project memory', status: 'working', category: 'neutral', priority: 4, cost: .03, duration: '9 min', note: 'Preparing a Project Brain update.', permissions: ['Brain read', 'memory candidate write'] },
    { id: 'bee-11', name: 'Money Bee 11', family: 'Money Bee', task: 'Track opportunity economics', status: 'idle', category: 'waiting', priority: 3, cost: .02, duration: '6 min', note: 'Waiting for new outcomes.', permissions: ['opportunity read', 'ledger read'] },
    { id: 'bee-12', name: 'Accessibility Bee 12', family: 'Accessibility Bee', task: 'Inspect motor and visual friction', status: 'working', category: 'creative', priority: 1, cost: .06, duration: '13 min', note: 'Recommends larger target spacing.', permissions: ['UI telemetry', 'preference read'] },
    { id: 'bee-13', name: 'Workflow Bee 13', family: 'Workflow Bee', task: 'Observe navigation loops', status: 'sleeping', category: 'neutral', priority: 4, cost: 0, duration: 'resting', note: 'Sleeping.', permissions: ['interaction summary'] },
    { id: 'bee-15', name: 'Optimiser Bee 15', family: 'Optimiser Bee', task: 'Find expensive repeated work', status: 'working', category: 'waiting', priority: 3, cost: .08, duration: '24 min', note: 'Testing whether one workflow can replace three.', permissions: ['telemetry read', 'Brain read'] },
    { id: 'bee-16', name: 'Guardian Bee 16', family: 'Guardian Bee', task: 'Watch for anomalous behaviour', status: 'sleeping', category: 'security', priority: 4, cost: .01, duration: 'background', note: 'No active incident.', permissions: ['audit read', 'quarantine signal'] },
  ],
  missions: [
    { id: 'MIS-301', title: 'HIVE control surface', summary: 'Turn OpenClaw state into a calm visual operating system.', stage: 'Building', beeCount: 8, category: 'creative', priority: 0, nextStep: 'Preview the first usable control surface', needsUser: true },
    { id: 'MIS-294', title: 'Memory bridge', summary: 'Keep operational memory, provenance and human-readable truth connected.', stage: 'Testing', beeCount: 6, category: 'complete', priority: 2, nextStep: 'Verify end-to-end retrieval', needsUser: false },
    { id: 'MIS-317', title: 'Opportunity intelligence', summary: 'Find high-value under-supplied problems across industries.', stage: 'Researching', beeCount: 5, category: 'coding', priority: 2, nextStep: 'Qualify the next opportunity batch', needsUser: false },
    { id: 'MIS-288', title: 'Security hardening', summary: 'Reduce blast radius and keep authority explicit.', stage: 'Monitoring', beeCount: 7, category: 'waiting', priority: 3, nextStep: 'Run dependency audit', needsUser: false },
  ],
  opportunities: [
    { id: 'OP-27', title: 'Scientific AI challenge', industry: 'Science', reward: 250000, deadline: '4 Dec', competition: 'High', confidence: 78, capabilityMatch: 82, category: 'research', priority: 1 },
    { id: 'OP-31', title: 'Open-source maintenance bounty', industry: 'Software', reward: 12000, deadline: '18 Oct', competition: 'Low', confidence: 88, capabilityMatch: 91, category: 'coding', priority: 0 },
    { id: 'OP-44', title: 'Data reconciliation contract', industry: 'Operations', reward: 6500, deadline: '31 Oct', competition: 'Medium', confidence: 74, capabilityMatch: 86, category: 'waiting', priority: 2 },
    { id: 'OP-50', title: 'Forecasting tournament', industry: 'Forecasting', reward: 35000, deadline: '12 Jan', competition: 'Medium', confidence: 69, capabilityMatch: 72, category: 'creative', priority: 2 },
    { id: 'OP-52', title: 'Research reproducibility prize', industry: 'Research', reward: 50000, deadline: '22 Nov', competition: 'Unknown', confidence: 67, capabilityMatch: 76, category: 'complete', priority: 3 },
    { id: 'OP-61', title: 'Authorised security programme', industry: 'Security', reward: 80000, deadline: 'Rolling', competition: 'High', confidence: 63, capabilityMatch: 68, category: 'security', priority: 3 },
  ],
  money: [
    { id: 'M-01', title: 'Verified payout', amount: 12480, stage: 'verified', category: 'complete' },
    { id: 'M-02', title: 'Accepted work', amount: 8600, stage: 'accepted', category: 'coding' },
    { id: 'M-03', title: 'Submitted bounty', amount: 4200, stage: 'submitted', category: 'research' },
    { id: 'M-04', title: 'Being solved', amount: 15800, stage: 'solving', category: 'waiting' },
    { id: 'M-05', title: 'Potential pipeline', amount: 59000, stage: 'potential', category: 'creative' },
  ],
  brain: [
    { id: 'B-1', label: 'Private operational memory', kind: 'architecture', summary: 'Machine-queryable memory remains behind a private engine boundary.' },
    { id: 'B-2', label: 'Project Brain', kind: 'decision', summary: 'Human-readable institutional truth is consolidated rather than blindly appended.' },
    { id: 'B-3', label: 'Evaluation gate', kind: 'learning', summary: 'Improvements require external evidence before promotion.' },
    { id: 'B-4', label: 'HIVE', kind: 'experiment', summary: 'Test whether a visual control surface reduces human attention cost.' },
    { id: 'B-5', label: 'Provenance', kind: 'reference', summary: 'Every durable claim should preserve source, freshness and confidence.' },
  ],
}
