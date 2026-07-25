/**
 * SWOTAnalyzer — يدمج مخرجات الاستبيان والمنصات وتجربة العميل في ملخص تنفيذي.
 * كل نقطة مرتبطة بدليل. المخاطر تُذكر فقط عند وضوحها وأثرها.
 */

import { limit, makeFinding } from './EvidenceValidator'
import type {
  CustomerExperienceAnalysis,
  DigitalPresenceAnalysis,
  Finding,
  QuestionnaireAnalysis,
  SwotAnalysis,
} from './types'
import { PLATFORM_LABEL } from './types'

export function analyzeSwot(
  q: QuestionnaireAnalysis,
  d: DigitalPresenceAnalysis,
  cx: CustomerExperienceAnalysis,
): SwotAnalysis {
  /* ---------------- القوة ---------------- */
  const strengths: Finding[] = [...q.strengths]
  for (const p of d.platforms) {
    if (p.strongestPoint && !p.strongestPoint.startsWith('لا') && !p.strongestPoint.startsWith('البيانات')) {
      const f = makeFinding({
        text: `${PLATFORM_LABEL[p.platform]}: ${p.strongestPoint}.`,
        classification: 'observation',
        source: { kind: 'platform', label: PLATFORM_LABEL[p.platform] },
        confidence: 'medium',
        evidence: p.currentState,
      })
      if (f) strengths.push(f)
    }
  }
  strengths.push(...cx.satisfaction)

  /* ---------------- الضعف ---------------- */
  const weaknesses: Finding[] = [...q.weaknesses]
  for (const p of d.platforms) {
    if (p.biggestGap && !p.biggestGap.startsWith('لا') && !p.biggestGap.startsWith('البيانات')) {
      const f = makeFinding({
        text: `${PLATFORM_LABEL[p.platform]}: فجوة في ${p.biggestGap}.`,
        classification: 'observation',
        source: { kind: 'platform', label: PLATFORM_LABEL[p.platform] },
        confidence: 'medium',
        evidence: p.currentState,
      })
      if (f) weaknesses.push(f)
    }
  }
  weaknesses.push(...cx.frictions)

  // ترتيب الضعف بحسب الأثر: المؤكد أولًا ثم الملاحظ
  const rank = (f: Finding) => (f.classification === 'confirmed' ? 0 : f.classification === 'observation' ? 1 : 2)
  weaknesses.sort((a, b) => rank(a) - rank(b))

  /* ---------------- الفرص ---------------- */
  const rawOpps: Finding[] = [...q.opportunities]
  if (d.keywords.groups.length) {
    const f = makeFinding({
      text: `توجد كلمات مفتاحية محلية غير مستثمرة في نصوص المنصات والموقع (${d.keywords.groups
        .map((g) => g.label)
        .join('، ')}).`,
      classification: 'analytical',
      source: { kind: 'system', label: 'خطة الكلمات المفتاحية' },
      confidence: 'medium',
      evidence: d.keywords.groups.flatMap((g) => g.words).slice(0, 5).join('، '),
    })
    if (f) rawOpps.push(f)
  }
  if (d.comparison.highestPotential && !d.comparison.highestPotential.startsWith('البيانات')) {
    const f = makeFinding({
      text: `تركيز الجهد على ${d.comparison.highestPotential}`,
      classification: 'analytical',
      source: { kind: 'system', label: 'مقارنة المنصات' },
      confidence: 'medium',
      evidence: d.comparison.biggestGap,
    })
    if (f) rawOpps.push(f)
  }

  const opportunities = limit(rawOpps, 5).map((o) => ({
    ...o,
    impact: o.classification === 'confirmed' ? 'مرتفع' : 'متوسط',
    ease: 'قابل للتنفيذ ضمن الموارد الحالية',
    speed: 'قصير المدى',
    // لا تُذكر تكلفة تقديرية دون مصدر معتمد
    cost: 'غير محددة — تُقدّر بعد اعتماد نطاق العمل',
  }))

  /* ---------------- المخاطر ---------------- */
  const risks: Array<Finding | null> = []

  // سمعة: شكاوى متكررة بلا ردود
  if (cx.repeatedComplaints.length) {
    risks.push(
      makeFinding({
        text: 'تراكم الشكاوى المتكررة دون معالجة معلنة يهدد السمعة الرقمية ويؤثر على قرار العملاء الجدد.',
        classification: 'analytical',
        source: { kind: 'platform', label: 'التقييمات العامة' },
        confidence: 'medium',
        evidence: cx.repeatedComplaints.map((c) => c.text).join(' | '),
      }),
    )
  }

  // الاعتماد على منصة واحدة
  const active = d.platforms.filter((p) => p.state === 'evidence_provided')
  if (active.length === 1) {
    risks.push(
      makeFinding({
        text: `الاعتماد على ${PLATFORM_LABEL[active[0].platform]} كقناة وحيدة موثقة يجعل الوصول للعملاء مرهونًا بمنصة واحدة.`,
        classification: 'analytical',
        source: { kind: 'system', label: 'مقارنة المنصات' },
        confidence: 'medium',
        evidence: `عدد المنصات ذات الأدلة: ${active.length}`,
      }),
    )
  }

  // رحلة تواصل ضعيفة
  if (cx.lossPoints.length >= 2) {
    risks.push(
      makeFinding({
        text: 'وجود أكثر من نقطة ضعف في مسار التواصل يعني فقد عملاء محتملين قبل الوصول إلى الطلب.',
        classification: 'analytical',
        source: { kind: 'system', label: 'قراءة تجربة العميل' },
        confidence: 'medium',
        evidence: cx.lossPoints.map((l) => l.text).join(' | '),
      }),
    )
  }

  // عدم اتساق الهوية
  const identityWeak = d.score.items.find((i) => i.id === 'identity')
  if (identityWeak && identityWeak.percent !== null && identityWeak.percent < 45) {
    risks.push(
      makeFinding({
        text: 'ضعف اتساق الهوية بين المنصات يُضعف تذكّر العلامة ويقلل الثقة عند أول تعامل.',
        classification: 'analytical',
        source: { kind: 'system', label: 'نموذج التقييم' },
        confidence: 'medium',
        evidence: identityWeak.basis,
      }),
    )
  }

  // الموقع لا يدعم التحويل
  const site = d.platforms.find((p) => p.platform === 'website')
  const conv = d.score.items.find((i) => i.id === 'conversion')
  if (site && conv && conv.percent !== null && conv.percent < 45) {
    risks.push(
      makeFinding({
        text: 'الموقع لا يدعم إتمام التحويل بشكل كافٍ، ما يحوّل الزيارات إلى تصفح دون طلب.',
        classification: 'analytical',
        source: { kind: 'platform', label: 'الموقع الإلكتروني' },
        confidence: 'medium',
        evidence: conv.basis,
      }),
    )
  }

  return {
    strengths: limit(strengths, 5),
    weaknesses: limit(weaknesses, 5),
    opportunities,
    risks: limit(risks, 5),
  }
}
