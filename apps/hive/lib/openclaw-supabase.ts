export type HiveState = {
  tasks: Array<Record<string, any>>
  runs: Array<Record<string, any>>
  results: Array<Record<string, any>>
  memory: Array<Record<string, any>>
  events: Array<Record<string, any>>
  agents: Array<Record<string, any>>
  fetchedAt: string
}

export class SupabaseHTTPError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('OpenClaw Supabase is not configured.')
  return { url: url.replace(/\/$/, ''), key }
}

async function parseOrThrow(response: Response) {
  if (!response.ok) {
    const text = await response.text()
    throw new SupabaseHTTPError(response.status, text || response.statusText)
  }
  return response.json()
}

export async function signIn(email: string, password: string) {
  const { url, key } = config()
  const response = await fetch(url + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })
  return parseOrThrow(response)
}

export async function refreshSession(refreshToken: string) {
  const { url, key } = config()
  const response = await fetch(url + '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store',
  })
  return parseOrThrow(response)
}

async function rest(accessToken: string, path: string) {
  const { url, key } = config()
  const response = await fetch(url + '/rest/v1/' + path, {
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + accessToken,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
  return parseOrThrow(response)
}

export async function loadHiveState(accessToken: string): Promise<HiveState> {
  const [tasks, runs, results, memory, events, agents] = await Promise.all([
    rest(accessToken, 'oc_tasks?select=id,title,status,priority,source,context,created_at,updated_at,completed_at&order=priority.desc,updated_at.desc&limit=24'),
    rest(accessToken, 'oc_runs?select=id,task_id,agent_id,status,model,output_summary,error,cost_usd,started_at,completed_at&order=started_at.desc&limit=24'),
    rest(accessToken, 'oc_results?select=id,task_id,run_id,result_type,title,content,verification_status,score,created_at&order=created_at.desc&limit=24'),
    rest(accessToken, 'oc_memory?select=id,kind,title,summary,source,confidence,status,freshness_class,last_verified_at,created_at,updated_at&order=updated_at.desc&limit=30'),
    rest(accessToken, 'oc_events?select=id,source,source_ref,event_type,entity_type,entity_id,payload,created_at&order=created_at.desc&limit=60'),
    rest(accessToken, 'oc_agents?select=id,name,role,status,capabilities,metrics,last_seen_at,updated_at&order=updated_at.desc&limit=30'),
  ])
  return { tasks, runs, results, memory, events, agents, fetchedAt: new Date().toISOString() }
}
