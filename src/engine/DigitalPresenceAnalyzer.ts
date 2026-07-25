/**
 * DigitalPresenceAnalyzer — تحليل مستقل لكل منصة + نموذج التقييم من 100 + المقارنة.
 * البند غير المرصود لا يُمنح درجة، والمقياس يُعاد ضبطه على البنود المتوفرة فقط.
 */

import {
  CRITERIA,
  confidenceFromCoverage,
  statusFromPercent,
} from '../config/evaluationCriteria'
import { PLATFORM_CHECKS, labelOfState, percentOfState } from '../config/platformChecks'
import type { ClientRecord } from '../lib/clientTypes'
import { collect, type CollectedPlatform } from './DigitalPresenceCollector'
import { CANNOT_VERIFY, NO_DATA, makeFinding } from './EvidenceValidator'
import { buildKeywordPlan } from './KeywordPlanner'
import type {
  CheckItem,
  DigitalPresenceAnalysis,
  Finding,
  PlatformAnalysis,
  PlatformComparison,
  ScoreResult,
} from './types'
import { PLATFORM_LABEL } from './types'

/* ------------------------------------------------------------------ */
/* تحليل منصة واحدة                                                    */
/* ------------------------------------------------------------------ */

function analyzePlatform(client: ClientRecord, c: CollectedPlatform): PlatformAnalysis {
  const checksDef = PLATFORM_CHECKS[c.platform] ?? []
  const checks: CheckItem[] = []
  const scores: Record<string, number | null> = {}
  const findings: Finding[] = []

  // تجميع نسب البنود بحسب معيار التقييم
  const byCriterion = new Map<string, number[]>()

  for (const def of checksDef) {
    const raw = (client.platformChecks[`${c.platform}.${def.key}`] ?? '').trim()
    const pct = percentOfState(raw)
    checks.push({
      key: def.key,
      label: def.label,
      value: raw ? labelOfState(raw) : '',
      classification: raw ? 'observation' : 'unavailable',
    })
    if (pct !== null) {
      if (!byCriterion.has(def.criterion)) byCriterion.set(def.criterion, [])
      byCriterion.get(def.criterion)!.push(pct)
    }
  }

  for (const [crit, list] of byCriterion) {
    scores[crit] = list.reduce((a, b) => a + b, 0) / list.length
  }

  const observed = checks.filter((k) => k.value !== '')
  const strong = observed.filter((k) => k.value === 'جيد')
  const weak = observed.filter((k) => k.value === 'ضعيف' || k.value === 'غير موجود')
  const partial = observed.filter((k) => k.value === 'يحتاج تحسين')

  const platformName = PLATFORM_LABEL[c.platform]

  let currentState: string
  let strongestPoint: string
  let biggestGap: string
  let proposedAction: string

  if (c.state === 'not_provided') {
    currentState = 'لم تُضف بيانات لهذه المنصة.'
    strongestPoint = NO_DATA
    biggestGap = NO_DATA
    proposedAction = 'إضافة الرابط أو رفع لقطات لتفعيل التحليل.'
  } else if (observed.length === 0) {
    currentState = `${CANNOT_VERIFY} تمت إضافة الرابط دون رصد يدوي أو ملفات داعمة.`
    strongestPoint = NO_DATA
    biggestGap = NO_DATA
    proposedAction = 'رصد بنود المنصة يدويًا في شاشة المراجعة أو رفع لقطات الشاشة.'
    findings.push({
      id: `pf_${c.platform}_na`,
      text: `${platformName}: ${CANNOT_VERIFY}`,
      classification: 'unavailable',
      source: { kind: 'link', label: c.url ?? platformName },
      confidence: 'low',
      evidence: 'لا توجد أدلة مرفوعة ولا رصد يدوي.',
      visibleToClient: true,
    })
  } else {
    const coverage = Math.round((observed.length / checksDef.length) * 100)
    currentState = `رُصد ${observed.length} بندًا من ${checksDef.length} (${coverage}٪): ${strong.length} جيد، ${partial.length} يحتاج تحسين، ${weak.length} ضعيف أو غير موجود.`

    strongestPoint = strong.length ? strong.map((k) => k.label).slice(0, 3).join('، ') : 'لا يوجد بند مرصود بحالة جيدة.'
    biggestGap = weak.length
      ? weak.map((k) => k.label).slice(0, 3).join('، ')
      : partial.length
        ? partial.map((k) => k.label).slice(0, 3).join('، ')
        : 'لا توجد فجوة ظاهرة في البنود المرصودة.'

    proposedAction = weak.length
      ? `معالجة: ${weak.map((k) => k.label).slice(0, 2).join('، ')}.`
      : partial.length
        ? `رفع مستوى: ${partial.map((k) => k.label).slice(0, 2).join('، ')}.`
        : 'الحفاظ على المستوى الحالي ومتابعة الانتظام.'

    for (const k of weak.slice(0, 4)) {
      const f = makeFinding({
        text: `${platformName}: ${k.label} — ${k.value}.`,
        classification: 'observation',
        source: { kind: 'platform', label: platformName, checkedAt: new Date().toISOString().slice(0, 10) },
        confidence: 'medium',
        evidence: `رصد يدوي لبند ${k.label}: ${k.value}`,
      })
      if (f) findings.push(f)
    }
    for (const k of strong.slice(0, 3)) {
      const f = makeFinding({
        text: `${platformName}: ${k.label} — ${k.value}.`,
        classification: 'observation',
        source: { kind: 'platform', label: platformName, checkedAt: new Date().toISOString().slice(0, 10) },
        confidence: 'medium',
        evidence: `رصد يدوي لبند ${k.label}: ${k.value}`,
      })
      if (f) findings.push(f)
    }
  }

  return {
    platform: c.platform,
    state: c.state,
    url: c.url,
    statusNote: c.statusNote,
    checks,
    currentState,
    strongestPoint,
    biggestGap,
    proposedAction,
    findings,
    scores,
  }
}

/* ------------------------------------------------------------------ */
/* نموذج التقييم من 100                                                */
/* ------------------------------------------------------------------ */

function computeScore(platforms: PlatformAnalysis[]): ScoreResult {
  const items: ScoreResult['items'] = []
  let weightedSum = 0
  let coveredWeight = 0

  for (const crit of CRITERIA) {
    const values: number[] = []
    const contributors: string[] = []
    for (const p of platforms) {
      const v = p.scores[crit.id]
      if (typeof v === 'number') {
        values.push(v)
        contributors.push(PLATFORM_LABEL[p.platform])
      }
    }

    if (values.length === 0) {
      items.push({
        id: crit.id,
        label: crit.label,
        weight: crit.weight,
        percent: null,
        status: 'unavailable',
        explanation: crit.explanation,
        basis: 'لا توجد بنود مرصودة تخص هذا المعيار.',
      })
      continue
    }

    const percent = values.reduce((a, b) => a + b, 0) / values.length
    weightedSum += (percent / 100) * crit.weight
    coveredWeight += crit.weight
    items.push({
      id: crit.id,
      label: crit.label,
      weight: crit.weight,
      percent: Math.round(percent),
      status: statusFromPercent(percent),
      explanation: crit.explanation,
      basis: `مبني على بنود مرصودة في: ${[...new Set(contributors)].join('، ')}.`,
    })
  }

  // إعادة الضبط: الدرجة من 100 على البنود المتوفرة فقط
  const total = coveredWeight > 0 ? Math.round((weightedSum / coveredWeight) * 100) : null

  return {
    total,
    coverage: coveredWeight,
    confidence: confidenceFromCoverage(coveredWeight),
    items,
  }
}

/* ------------------------------------------------------------------ */
/* المقارنة بين المنصات                                                */
/* ------------------------------------------------------------------ */

function averageScore(p: PlatformAnalysis): number | null {
  const vals = Object.values(p.scores).filter((v): v is number => typeof v === 'number')
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function compare(platforms: PlatformAnalysis[]): PlatformComparison {
  const scored = platforms
    .map((p) => ({ p, avg: averageScore(p) }))
    .filter((x): x is { p: PlatformAnalysis; avg: number } => x.avg !== null)

  if (scored.length === 0) {
    return {
      strongest: NO_DATA,
      weakest: NO_DATA,
      highestPotential: NO_DATA,
      priority: NO_DATA,
      biggestGap: NO_DATA,
      interoperability: NO_DATA,
      journey: 'لا يمكن رسم رحلة العميل قبل رصد بيانات المنصات.',
    }
  }

  const sorted = [...scored].sort((a, b) => b.avg - a.avg)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  // منصة واحدة فقط مرصودة: لا تُبنى مقارنة، ويُذكر ذلك صراحة
  if (scored.length === 1) {
    const only = PLATFORM_LABEL[best.p.platform]
    const notRated = platforms
      .filter((p) => p.platform !== best.p.platform)
      .map((p) => PLATFORM_LABEL[p.platform])
    return {
      strongest: `${only} — المنصة الوحيدة التي تتوفر لها بنود مرصودة.`,
      weakest: notRated.length
        ? `لا يمكن تحديدها. منصات بلا رصد: ${notRated.join('، ')}.`
        : 'لا يمكن تحديدها لعدم وجود منصة أخرى مرصودة.',
      highestPotential: `${only} — الفجوات المرصودة فيها قابلة للمعالجة.`,
      priority: only,
      biggestGap: 'لا يمكن قياس الفجوة بين المنصات قبل رصد منصة ثانية على الأقل.',
      interoperability: notRated.length
        ? `لا يمكن تقييم الترابط. يلزم رصد: ${notRated.join('، ')}.`
        : 'لا توجد منصات أخرى لتقييم الترابط بينها.',
      journey: `رحلة العميل مقروءة من ${only} فقط، ولا تغطي بقية نقاط الدخول.`,
    }
  }

  // أعلى إمكانية نمو: منصة ضعيفة لكن لديها رابط فعّال وبنود مرصودة كثيرة
  const potential = [...scored].sort(
    (a, b) => a.avg - b.avg || b.p.checks.filter((c) => c.value).length - a.p.checks.filter((c) => c.value).length,
  )[0]

  const missingLinks = platforms.filter((p) => p.state === 'not_provided').map((p) => PLATFORM_LABEL[p.platform])
  const unverified = platforms.filter((p) => p.state === 'link_only').map((p) => PLATFORM_LABEL[p.platform])

  const spread = Math.round(best.avg - worst.avg)

  return {
    strongest: `${PLATFORM_LABEL[best.p.platform]} — الأعلى في البنود المرصودة.`,
    weakest: `${PLATFORM_LABEL[worst.p.platform]} — الأدنى في البنود المرصودة.`,
    highestPotential: `${PLATFORM_LABEL[potential.p.platform]} — الفجوة فيها قابلة للمعالجة بأثر سريع.`,
    priority: `${PLATFORM_LABEL[worst.p.platform]}${
      scored.length > 1 ? `، يليها ${PLATFORM_LABEL[potential.p.platform]}` : ''
    }.`,
    biggestGap:
      spread >= 30
        ? `فرق واضح بين أقوى وأضعف منصة بمقدار ${spread} نقطة، ما يعني تجربة غير متسقة بحسب نقطة الدخول.`
        : `تقارب مستوى المنصات المرصودة بفارق ${spread} نقطة.`,
    interoperability: unverified.length
      ? `منصات أُضيفت روابطها دون تحقق: ${unverified.join('، ')}.`
      : missingLinks.length
        ? `منصات غير مفعّلة: ${missingLinks.join('، ')}.`
        : 'المنصات المرصودة مترابطة ضمن حدود البيانات المتاحة.',
    journey:
      'رحلة العميل تبدأ من نقطة الاكتشاف على المنصة الأقوى، وتتعثر عند البنود الضعيفة في التواصل والتحويل المرصودة أعلاه.',
  }
}

/* ------------------------------------------------------------------ */

export function analyzeDigitalPresence(client: ClientRecord): DigitalPresenceAnalysis {
  const collected = collect(client)
  const platforms = collected.map((c) => analyzePlatform(client, c))
  return {
    platforms,
    score: computeScore(platforms),
    comparison: compare(platforms),
    keywords: buildKeywordPlan(client),
  }
}
