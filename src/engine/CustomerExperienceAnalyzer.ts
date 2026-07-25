/**
 * CustomerExperienceAnalyzer — «قراءة تجربة العميل».
 * يفرّق بين قراءة رقمية أولية وبين متسوق سري فعلي موثّق بملاحظات الفريق.
 * لا تُنسب أي ملاحظة إلى متسوق سري ما لم يوثّق الموظف زيارة أو اتصالًا أو طلبًا فعليًا.
 */

import type { ClientRecord } from '../lib/clientTypes'
import { isEmptyValue, limit, makeFinding } from './EvidenceValidator'
import type { Classification, CustomerExperienceAnalysis, Finding } from './types'

const NOTES_SRC = (label: string) => ({ kind: 'team_notes' as const, label })

/** جمل تدل على تنفيذ فعلي لا مجرد انطباع. */
const FIELD_EVIDENCE = ['زيارة', 'اتصلت', 'اتصال', 'طلبت', 'طلب', 'جربت', 'حجزت', 'راسلت', 'زرت', 'تواصلت']

function hasFieldEvidence(notes: ClientRecord['notes']): boolean {
  const ms = notes.mysteryShopper.trim()
  if (!ms) return false
  return FIELD_EVIDENCE.some((w) => ms.includes(w)) || ms.length > 40
}

/** تقسيم النص إلى ملاحظات مستقلة. */
function splitNotes(v: string): string[] {
  return v
    .split(/[\n•]+|(?<=[.؟!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8)
}

const POSITIVE = ['سريع', 'ممتاز', 'جيد', 'نظيف', 'متعاون', 'واضح', 'مرتب', 'لطيف', 'جودة', 'رد سريع']
const NEGATIVE = ['بطيء', 'تأخر', 'لم يرد', 'ما رد', 'صعب', 'غير واضح', 'ضعيف', 'مشكلة', 'شكوى', 'مغلق', 'خطأ', 'ناقص']

const hasAny = (v: string, list: string[]) => list.some((w) => v.includes(w))

export function analyzeCustomerExperience(client: ClientRecord): CustomerExperienceAnalysis {
  const field = hasFieldEvidence(client.notes)
  const readingType = field ? 'field' : 'digital'

  const satisfaction: Array<Finding | null> = []
  const frictions: Array<Finding | null> = []
  const repeatedComplaints: Array<Finding | null> = []
  const lossPoints: Array<Finding | null> = []
  const quickWins: Array<Finding | null> = []

  /* ---------------- القراءة الأولية: من المنصات وملاحظات الفريق ---------------- */

  // شكاوى وثناء مرصودة في Google
  const complaints = client.platformChecks['google.complaints']
  const praise = client.platformChecks['google.praise']
  if (!isEmptyValue(complaints) && complaints !== 'good') {
    repeatedComplaints.push(
      makeFinding({
        text: 'رُصدت شكاوى متكررة في تقييمات Google تحتاج معالجة معلنة.',
        classification: 'observation',
        source: { kind: 'platform', label: 'Google Business' },
        confidence: 'medium',
        evidence: `حالة بند الشكاوى المتكررة: ${complaints}`,
      }),
    )
  }
  if (praise === 'good') {
    satisfaction.push(
      makeFinding({
        text: 'عناصر ثناء متكررة ظاهرة في التقييمات تصلح كرسالة تسويقية.',
        classification: 'observation',
        source: { kind: 'platform', label: 'Google Business' },
        confidence: 'medium',
        evidence: 'بند عناصر الثناء المتكررة مرصود بحالة جيد.',
      }),
    )
  }

  // بنود التحويل الضعيفة عبر كل المنصات = نقاط فقد
  const conversionWeak = Object.entries(client.platformChecks).filter(
    ([, v]) => v === 'weak' || v === 'missing',
  )
  for (const [key] of conversionWeak.slice(0, 5)) {
    const [platform, check] = key.split('.')
    if (['cta', 'contactLink', 'whatsapp', 'contactForm', 'buttons', 'checkout', 'contactEase', 'responseTime'].includes(check)) {
      lossPoints.push(
        makeFinding({
          text: `ضعف في وسيلة التواصل أو التحويل على ${platform} (${check}) يقطع الرحلة قبل الوصول للطلب.`,
          classification: 'observation',
          source: { kind: 'platform', label: platform },
          confidence: 'medium',
          evidence: `بند ${check} مرصود بحالة ضعيفة أو غير موجود.`,
        }),
      )
    }
  }

  // ملاحظات التواصل من الفريق
  for (const n of splitNotes(client.notes.communication)) {
    const target = hasAny(n, NEGATIVE) ? frictions : hasAny(n, POSITIVE) ? satisfaction : frictions
    target.push(
      makeFinding({
        text: n,
        classification: 'observation',
        source: NOTES_SRC('ملاحظات التواصل'),
        confidence: field ? 'high' : 'medium',
        evidence: n,
      }),
    )
  }

  // ملاحظات عامة ومعلومات خارج المنصات
  for (const n of splitNotes(client.notes.general).slice(0, 3)) {
    ;(hasAny(n, POSITIVE) ? satisfaction : frictions).push(
      makeFinding({
        text: n,
        classification: 'observation',
        source: NOTES_SRC('ملاحظات عامة'),
        confidence: 'medium',
        evidence: n,
      }),
    )
  }

  /* ---------------- المتسوق السري: فقط عند وجود توثيق فعلي ---------------- */

  const journey: CustomerExperienceAnalysis['journey'] = []
  const journeySteps = [
    'البحث عن النشاط وإيجاده',
    'فهم الخدمة أو المنتج',
    'سهولة التواصل',
    'سرعة الرد',
    'جودة الرد',
    'سهولة الطلب أو الحجز',
    'وضوح السعر',
    'تجربة الاستلام أو الزيارة',
    'التعامل مع الملاحظات',
    'الانطباع بعد التجربة',
  ]

  if (field) {
    const msNotes = splitNotes(client.notes.mysteryShopper)
    const visitNotes = splitNotes(client.notes.visit)
    const all = [...msNotes, ...visitNotes]

    for (const n of all) {
      const isNeg = hasAny(n, NEGATIVE)
      const f = makeFinding({
        text: n,
        classification: 'confirmed',
        source: NOTES_SRC('المتسوق السري — تجربة موثقة'),
        confidence: 'high',
        evidence: n,
      })
      if (isNeg) frictions.push(f)
      else satisfaction.push(f)
    }

    // ربط الملاحظات بخطوات الرحلة بحسب الكلمات الواردة فيها
    for (const step of journeySteps) {
      const match = all.find((n) => step.split(' ').some((w) => w.length > 3 && n.includes(w)))
      journey.push({
        step,
        state: match ?? 'لم تُوثّق ملاحظة لهذه الخطوة.',
        classification: (match ? 'confirmed' : 'unavailable') as Classification,
      })
    }

    // مكاسب سريعة من الاحتكاكات الموثقة
    for (const fr of frictions.filter(Boolean).slice(0, 3)) {
      quickWins.push(
        makeFinding({
          text: `معالجة: ${fr!.text}`,
          classification: 'analytical',
          source: NOTES_SRC('المتسوق السري — تجربة موثقة'),
          confidence: 'medium',
          evidence: fr!.evidence,
        }),
      )
    }
  } else {
    for (const step of journeySteps) {
      journey.push({
        step,
        state: 'لم تُنفّذ تجربة فعلية — القراءة رقمية فقط.',
        classification: 'unavailable',
      })
    }
    // مكاسب سريعة من نقاط الفقد الرقمية
    for (const lp of lossPoints.filter(Boolean).slice(0, 3)) {
      quickWins.push(
        makeFinding({
          text: `معالجة: ${lp!.text}`,
          classification: 'analytical',
          source: { kind: 'platform', label: 'رصد المنصات' },
          confidence: 'medium',
          evidence: lp!.evidence,
        }),
      )
    }
  }

  const cleanSat = limit(satisfaction, 5)
  const cleanFric = limit(frictions, 5)

  const confidence = field ? 'high' : cleanSat.length + cleanFric.length >= 3 ? 'medium' : 'low'

  return {
    readingType,
    readingTypeLabel: field
      ? 'قراءة فعلية — مبنية على تجربة موثقة من فريق بسطة'
      : 'قراءة رقمية أولية — لم تُنفّذ زيارة أو تجربة فعلية',
    confidence,
    satisfaction: cleanSat,
    frictions: cleanFric,
    repeatedComplaints: limit(repeatedComplaints, 5),
    lossPoints: limit(lossPoints, 5),
    quickWins: limit(quickWins, 5),
    journey,
  }
}
