/**
 * KeywordPlanner — يقترح كلمات مفتاحية مبنية على نوع النشاط والخدمات والمدينة.
 * لا يُذكر حجم بحث ولا درجة صعوبة لعدم توفر أداة أو مصدر موثوق.
 */

import type { ClientRecord } from '../lib/clientTypes'
import { isEmptyValue } from './EvidenceValidator'
import type { KeywordPlan } from './types'

function pick(client: ClientRecord, key: string): string {
  const a = client.survey.answers[key]
  if (!isEmptyValue(a)) return a.trim()
  const p = (client.profile as unknown as Record<string, string>)[key]
  return isEmptyValue(p) ? '' : p.trim()
}

function splitList(v: string): string[] {
  return v
    .split(/[،,\n•|/]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
    .slice(0, 6)
}

export function buildKeywordPlan(client: ClientRecord): KeywordPlan {
  const activityType = pick(client, 'sector')
  const city = client.profile.city || pick(client, 'city')
  const geo = pick(client, 'geo')
  const services = [...new Set([...splitList(pick(client, 'bestSellers')), ...splitList(pick(client, 'description'))])]

  const serviceAreas = [city, geo].filter(Boolean)

  const basis = { activityType, services, city, serviceAreas }

  // بدون نوع نشاط أو مدينة لا تُبنى قائمة
  if (!activityType && !services.length) {
    return {
      basis,
      groups: [],
      note: 'لا يمكن بناء قائمة كلمات مفتاحية قبل تحديد نوع النشاط والخدمات الأساسية.',
    }
  }

  const base = services.length ? services : activityType ? [activityType] : []
  const cityLabel = city || ''

  const buy: string[] = []
  const local: string[] = []
  const info: string[] = []
  const brand: string[] = []

  const brandName = client.profile.businessName || pick(client, 'businessName')

  for (const s of base) {
    if (cityLabel) {
      buy.push(`${s} ${cityLabel}`)
      local.push(`أفضل ${s} في ${cityLabel}`)
      local.push(`${s} قريب مني`)
    }
    buy.push(`أسعار ${s}`)
    info.push(`كيف أختار ${s}`)
    info.push(`ما الفرق بين أنواع ${s}`)
  }

  if (activityType && cityLabel) {
    buy.push(`${activityType} ${cityLabel}`)
    local.push(`أفضل ${activityType} في ${cityLabel}`)
    local.push(`${activityType} قريب مني`)
  }

  if (brandName) {
    brand.push(brandName)
    if (cityLabel) brand.push(`${brandName} ${cityLabel}`)
    brand.push(`تقييمات ${brandName}`)
  }

  const dedupe = (a: string[]) => [...new Set(a.filter(Boolean))].slice(0, 10)

  const groups = [
    { id: 'buy', label: 'كلمات بنية الشراء', words: dedupe(buy) },
    { id: 'local', label: 'كلمات محلية', words: dedupe(local) },
    { id: 'info', label: 'كلمات معلوماتية', words: dedupe(info) },
    { id: 'brand', label: 'كلمات العلامة التجارية', words: dedupe(brand) },
  ].filter((g) => g.words.length > 0)

  return {
    basis,
    groups,
    note: 'قائمة مقترحة مبنية على نوع النشاط والخدمات والمدينة. لم تُذكر أحجام البحث أو درجات الصعوبة لعدم توفر أداة قياس معتمدة.',
  }
}
