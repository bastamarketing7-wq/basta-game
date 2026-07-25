/**
 * DigitalPresenceCollector — يحدد المنصات المتوفرة وحالة بياناتها.
 * لا يجمع بيانات من الإنترنت ولا يتجاوز شروط المنصات.
 * أدوات التصفح غير مفعّلة في هذه النسخة، لذا يُعتمد على:
 *   الروابط المضافة + الملفات المرفوعة + رصد الموظف اليدوي.
 */

import type { ClientRecord, StoredFile } from '../lib/clientTypes'
import { CANNOT_VERIFY, NEEDS_MANUAL } from './EvidenceValidator'
import type { PlatformDataState, PlatformId } from './types'

export interface CollectedPlatform {
  platform: PlatformId
  url?: string
  state: PlatformDataState
  statusNote?: string
  /** الملفات المرفوعة المرتبطة بهذه المنصة */
  evidenceFiles: StoredFile[]
}

/** ربط نوع الملف بالمنصة التي يدعمها. */
const FILE_TO_PLATFORM: Partial<Record<StoredFile['kind'], PlatformId>> = {
  instagram_insights: 'instagram',
  tiktok_analytics: 'tiktok',
  google_business: 'google',
  google_analytics: 'website',
  search_console: 'website',
}

const ALL_PLATFORMS: PlatformId[] = [
  'google',
  'instagram',
  'tiktok',
  'snapchat',
  'website',
  'store',
  'x',
  'linkedin',
]

export function collect(client: ClientRecord): CollectedPlatform[] {
  const out: CollectedPlatform[] = []

  for (const platform of ALL_PLATFORMS) {
    const url = (client.links[platform] ?? '').trim() || undefined

    const evidenceFiles = client.files.filter((f) => {
      if (FILE_TO_PLATFORM[f.kind] === platform) return true
      // اللقطات العامة تُنسب للمنصة إن ذُكر اسمها في اسم الملف
      if (f.kind === 'screenshot_chat' || f.kind === 'screenshot_order' || f.kind === 'other') {
        return f.name.toLowerCase().includes(platform)
      }
      return false
    })

    // هل رصد الموظف أي بند لهذه المنصة يدويًا؟
    const hasManualChecks = Object.entries(client.platformChecks).some(
      ([k, v]) => k.startsWith(`${platform}.`) && v.trim() !== '',
    )

    let state: PlatformDataState
    let statusNote: string | undefined

    if (evidenceFiles.length > 0 || hasManualChecks) {
      state = 'evidence_provided'
    } else if (url) {
      state = 'link_only'
      statusNote = `${CANNOT_VERIFY} ${NEEDS_MANUAL}`
    } else {
      state = 'not_provided'
      statusNote = 'لم يُضف رابط أو ملف لهذه المنصة.'
    }

    // لا تُدرج منصة بلا رابط وبلا أدلة إطلاقًا
    if (state === 'not_provided' && !url) continue

    out.push({ platform, url, state, statusNote, evidenceFiles })
  }

  return out
}

/** التحقق الشكلي من صحة الرابط دون فتحه. */
export function isValidUrl(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  try {
    const u = new URL(v.startsWith('http') ? v : `https://${v}`)
    return Boolean(u.hostname) && u.hostname.includes('.')
  } catch {
    return false
  }
}
