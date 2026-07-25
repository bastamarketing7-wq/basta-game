/**
 * ReportGenerator — يبني محتوى التقرير المكوّن من 7 صفحات بالضبط.
 * طبقة بيانات فقط: لا يحتوي أي كود عرض. التصميم في طبقة منفصلة.
 * كل فقرة محدودة بـ 60 كلمة، ولا تتكرر المعلومة بين الصفحات.
 */

import { STATUS_LABEL, type CriterionStatus } from '../config/evaluationCriteria'
import { CONFIDENCE_LABEL } from '../config/evaluationCriteria'
import type { ClientRecord } from '../lib/clientTypes'
import { NO_DATA } from './EvidenceValidator'
import type { DiagnosisResult, Recommendation } from './types'
import { PLATFORM_LABEL, PRIORITY_LABEL, READINESS_LABEL } from './types'

/** قص أي فقرة عند 60 كلمة. */
export function cap60(text: string): string {
  const w = text.trim().split(/\s+/)
  return w.length <= 60 ? text.trim() : w.slice(0, 60).join(' ') + '.'
}

export interface ReportPage1 {
  reportTitle: string
  clientName: string
  sector: string
  city: string
  issueDate: string
  byline: string
  tagline: string
}

export interface ReportPage2 {
  essence: string
  mainGoal: string
  topChallenge: string
  topOpportunity: string
  readinessLevel: string
  executiveSummary: string
}

export interface ReportPage3 {
  overallScore: number | null
  scoreLabel: string
  confidence: string
  items: Array<{ label: string; percent: number | null; status: CriterionStatus; statusLabel: string }>
  strongest: string
  weakest: string
  priority: string
  note: string
}

export interface ReportPage4 {
  cards: Array<{
    platform: string
    currentState: string
    strongestPoint: string
    biggestGap: string
    proposedAction: string
  }>
  note?: string
}

export interface ReportPage5 {
  readingSource: string
  readingKind: string
  confidence: string
  satisfaction: string[]
  frictions: string[]
  complaints: string[]
  lossPoints: string[]
}

export interface ReportPage6 {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  days7: Array<{ what: string; priority: string }>
  days30: Array<{ what: string; priority: string }>
  days90: Array<{ what: string; priority: string }>
}

export interface ReportPage7 {
  approach: string
  packageAvailable: boolean
  packageName?: string
  packageDetails?: string[]
  packageWhy?: string
  packageMessage?: string
  alternative?: string
  nextStep: string
  tagline: string
}

export interface ReportContent {
  page1: ReportPage1
  page2: ReportPage2
  page3: ReportPage3
  page4: ReportPage4
  page5: ReportPage5
  page6: ReportPage6
  page7: ReportPage7
}

const listOf = (arr: Array<{ text: string }>, max: number) => arr.slice(0, max).map((x) => cap60(x.text))

/** يستبعد الإجراءات الداخلية ويُبقي ما يخص العميل فقط. */
const clientFacing = (list: Recommendation[]) =>
  list
    .filter((r) => !r.internalOnly)
    .map((r) => ({ what: cap60(r.what), priority: PRIORITY_LABEL[r.priority] }))

export function generateReport(
  client: ClientRecord,
  a: DiagnosisResult,
  identity: { tagline: string; reportTitle: string; byline: string },
): ReportContent {
  const readyCount = a.questionnaire.readiness.filter((r) => r.state === 'ready').length
  const readinessLevel =
    readyCount >= a.questionnaire.readiness.length * 0.7
      ? READINESS_LABEL.ready
      : readyCount >= a.questionnaire.readiness.length * 0.4
        ? READINESS_LABEL.partial
        : READINESS_LABEL.needs_prep

  const mainGoal = a.questionnaire.goals[0]?.text ?? NO_DATA
  const topChallenge = a.questionnaire.challenges[0]?.text ?? NO_DATA
  const topOpportunity = a.swot.opportunities[0]?.text ?? a.questionnaire.opportunities[0]?.text ?? NO_DATA

  const page1: ReportPage1 = {
    reportTitle: identity.reportTitle,
    clientName: client.profile.businessName || 'غير محدد',
    sector: client.profile.sector || 'غير محدد',
    city: client.profile.city || 'غير محدد',
    issueDate: new Date().toLocaleDateString('ar-SA-u-ca-gregory', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    byline: identity.byline,
    tagline: identity.tagline,
  }

  // الملخص التنفيذي يركز على القرار ولا يكرر الزبدة
  const decisionLine = a.swot.weaknesses.length
    ? `الأولوية الآن معالجة ${cap60(a.swot.weaknesses[0].text)}`
    : 'الأولوية الآن استكمال البيانات الناقصة قبل بناء الخطة.'

  const page2: ReportPage2 = {
    essence: cap60(a.questionnaire.essence),
    mainGoal: cap60(mainGoal),
    topChallenge: cap60(topChallenge),
    topOpportunity: cap60(topOpportunity),
    readinessLevel,
    executiveSummary: cap60(`${decisionLine} ${a.questionnaire.seriousness.summary}`),
  }

  const page3: ReportPage3 = {
    overallScore: a.digital.score.total,
    scoreLabel:
      a.digital.score.total === null
        ? NO_DATA
        : STATUS_LABEL[
            a.digital.score.total >= 70 ? 'good' : a.digital.score.total >= 45 ? 'needs_improvement' : 'weak'
          ],
    confidence: CONFIDENCE_LABEL[a.digital.score.confidence],
    items: a.digital.score.items.map((i) => ({
      label: i.label,
      percent: i.percent,
      status: i.status,
      statusLabel: STATUS_LABEL[i.status],
    })),
    strongest: a.digital.comparison.strongest,
    weakest: a.digital.comparison.weakest,
    priority: a.digital.comparison.priority,
    note: cap60(a.digital.comparison.biggestGap),
  }

  const cards = a.digital.platforms.map((p) => ({
    platform: PLATFORM_LABEL[p.platform],
    currentState: cap60(p.currentState),
    strongestPoint: cap60(p.strongestPoint),
    biggestGap: cap60(p.biggestGap),
    proposedAction: cap60(p.proposedAction),
  }))

  const page4: ReportPage4 = {
    cards,
    note: cards.length === 0 ? 'لم تُضف منصات لهذا العميل.' : undefined,
  }

  const page5: ReportPage5 = {
    readingSource: a.experience.readingTypeLabel,
    readingKind: a.experience.readingType === 'field' ? 'قراءة فعلية' : 'قراءة رقمية',
    confidence: CONFIDENCE_LABEL[a.experience.confidence],
    satisfaction: listOf(a.experience.satisfaction, 4),
    frictions: listOf(a.experience.frictions, 4),
    complaints: listOf(a.experience.repeatedComplaints, 3),
    lossPoints: listOf(a.experience.lossPoints, 3),
  }

  const page6: ReportPage6 = {
    strengths: listOf(a.swot.strengths, 3),
    weaknesses: listOf(a.swot.weaknesses, 3),
    opportunities: listOf(a.swot.opportunities, 3),
    // الإجراءات الداخلية التي تخص فريق بسطة لا تظهر في تقرير العميل
    days7: clientFacing(a.recommendations.days7),
    days30: clientFacing(a.recommendations.days30),
    days90: clientFacing(a.recommendations.days90),
  }

  const pkg = a.packageRecommendation
  const approach = a.recommendations.days7.length
    ? cap60(
        `البدء بمعالجة ما يقطع مسار التواصل خلال ٧ أيام، ثم ضبط الهوية والمحتوى خلال ٣٠ يومًا، ثم العمل على الظهور في البحث وتحسين التحويل خلال ٩٠ يومًا.`,
      )
    : 'يلزم استكمال البيانات قبل اقتراح منهج عمل.'

  const page7: ReportPage7 = {
    approach,
    packageAvailable: pkg.available,
    packageName: pkg.main?.name,
    packageDetails: pkg.main
      ? [pkg.main.price, pkg.main.duration, ...pkg.main.includes].filter((x): x is string => Boolean(x))
      : undefined,
    packageWhy: pkg.main?.why,
    packageMessage: pkg.message,
    alternative: pkg.alternative ? `${pkg.alternative.name} — ${pkg.alternative.why}` : undefined,
    nextStep: pkg.available
      ? 'اعتماد الباقة وتحديد موعد بدء التنفيذ.'
      : 'مراجعة نتائج التشخيص مع فريق بسطة وتحديد نطاق العمل.',
    tagline: identity.tagline,
  }

  return { page1, page2, page3, page4, page5, page6, page7 }
}
