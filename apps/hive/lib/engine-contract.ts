import type { HiveSnapshot } from './hive-data'

export type HiveCommand =
  | { type: 'bee.check_in'; beeId: string; message: string }
  | { type: 'bee.pause'; beeId: string }
  | { type: 'bee.sleep'; beeId: string }
  | { type: 'bee.redirect'; beeId: string; objective: string }
  | { type: 'bee.add_note'; beeId: string; note: string }
  | { type: 'bee.request_review'; beeId: string; reviewer?: string }
  | { type: 'mission.focus'; missionId: string }
  | { type: 'hive.feedback'; componentId: string; category: string; comment?: string }
  | { type: 'comfort.preference'; key: string; value: unknown }

export type HiveCommandResult = {
  ok: boolean
  commandId?: string
  status?: 'accepted' | 'completed' | 'rejected' | 'needs-approval'
  message: string
}

export type HiveGatewayHealth = {
  ok: boolean
  engineVersion?: string
  memoryConnected?: boolean
  updatedAt: string
}

export type HiveGatewayContract = {
  snapshot(): Promise<HiveSnapshot>
  command(command: HiveCommand): Promise<HiveCommandResult>
  health(): Promise<HiveGatewayHealth>
}
