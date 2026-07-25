/**
 * تخزين محلي منظّم داخل المتصفح.
 * الطبقة معزولة حتى يسهل استبدالها بقاعدة بيانات لاحقًا دون تغيير الواجهات.
 */

import { DEFAULT_TEMPLATE_ID } from '../config/surveyTemplate'
import {
  EMPTY_NOTES,
  EMPTY_PROFILE,
  type ClientRecord,
} from './clientTypes'

const KEY = 'basta_diagnosis_clients_v1'

function read(): ClientRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ClientRecord[]) : []
  } catch {
    return []
  }
}

function write(list: ClientRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function newId(): string {
  return 'c_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function emptyClient(): ClientRecord {
  const now = new Date().toISOString()
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    profile: { ...EMPTY_PROFILE },
    survey: { templateId: DEFAULT_TEMPLATE_ID, rawText: '', answers: {}, answerSources: {} },
    links: {},
    files: [],
    notes: { ...EMPTY_NOTES },
    platformChecks: {},
    reportOverrides: {},
    hiddenSections: [],
  }
}

export function listClients(): ClientRecord[] {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getClient(id: string): ClientRecord | undefined {
  return read().find((c) => c.id === id)
}

export function saveClient(client: ClientRecord): ClientRecord {
  const list = read()
  const updated: ClientRecord = { ...client, updatedAt: new Date().toISOString() }
  const i = list.findIndex((c) => c.id === client.id)
  if (i >= 0) list[i] = updated
  else list.push(updated)
  write(list)
  return updated
}

export function deleteClient(id: string): void {
  write(read().filter((c) => c.id !== id))
}

export interface DashboardStats {
  total: number
  completed: number
  inReview: number
  drafts: number
}

export function stats(): DashboardStats {
  const list = read()
  return {
    total: list.length,
    completed: list.filter((c) => c.status === 'completed').length,
    inReview: list.filter((c) => c.status === 'review').length,
    drafts: list.filter((c) => c.status === 'draft').length,
  }
}
