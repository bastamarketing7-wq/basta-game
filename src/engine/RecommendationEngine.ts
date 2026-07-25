/**
 * RecommendationEngine — يحوّل المشكلات والفرص المرصودة إلى إجراءات.
 * كل توصية مرتبطة بمشكلة أو فرصة تم رصدها فعلًا. لا توصيات عامة.
 */

import type {
  CustomerExperienceAnalysis,
  DigitalPresenceAnalysis,
  Priority,
  Recommendation,
  RecommendationPlan,
  SwotAnalysis,
} from './types'
import { PLATFORM_LABEL } from './types'

let n = 0
const id = () => `r_${++n}`

interface Draft {
  what: string
  why: string
  where: string
  priority: Priority
  expectedImpact: string
  linkedTo: string
  /** الأفق الزمني المقترح */
  horizon: 7 | 30 | 90
  /** إجراء داخلي يخص فريق بسطة ولا يظهر في تقرير العميل */
  internalOnly?: boolean
}

export function buildRecommendations(
  d: DigitalPresenceAnalysis,
  cx: CustomerExperienceAnalysis,
  swot: SwotAnalysis,
): RecommendationPlan {
  const drafts: Draft[] = []

  /* ---------- عاجل: ما يقطع التواصل أو يضر السمعة ---------- */

  for (const lp of cx.lossPoints.slice(0, 2)) {
    drafts.push({
      what: 'تفعيل وسيلة تواصل مباشرة وواضحة في نقطة الضعف المرصودة.',
      why: lp.text,
      where: lp.source.label,
      priority: 'urgent',
      expectedImpact: 'تقليل فقد العملاء المحتملين عند نقطة التواصل.',
      linkedTo: lp.text,
      horizon: 7,
    })
  }

  for (const rc of cx.repeatedComplaints.slice(0, 1)) {
    drafts.push({
      what: 'الرد على التقييمات والشكاوى الظاهرة ردًا موحّد الأسلوب، ومعالجة السبب المتكرر.',
      why: rc.text,
      where: 'Google Business والتقييمات العامة',
      priority: 'urgent',
      expectedImpact: 'وقف تراكم الأثر السلبي على قرار العملاء الجدد.',
      linkedTo: rc.text,
      horizon: 7,
    })
  }

  // أضعف منصة: أول إجراء مقترح فيها
  const weakPlatforms = d.platforms
    .filter((p) => p.state !== 'not_provided' && !p.proposedAction.startsWith('إضافة'))
    .sort((a, b) => {
      const av = Object.values(a.scores).filter((v): v is number => typeof v === 'number')
      const bv = Object.values(b.scores).filter((v): v is number => typeof v === 'number')
      const aa = av.length ? av.reduce((x, y) => x + y, 0) / av.length : 999
      const bb = bv.length ? bv.reduce((x, y) => x + y, 0) / bv.length : 999
      return aa - bb
    })

  for (const p of weakPlatforms.slice(0, 2)) {
    // الإجراء الذي يخص رصد الفريق داخل النظام لا يُعرض على العميل
    const isInternal = p.proposedAction.includes('رصد بنود') || p.proposedAction.includes('شاشة المراجعة')
    drafts.push({
      what: p.proposedAction,
      why: isInternal ? 'لا تتوفر بنود مرصودة لهذه المنصة بعد.' : `فجوة مرصودة: ${p.biggestGap}.`,
      where: PLATFORM_LABEL[p.platform],
      priority: 'high',
      expectedImpact: 'رفع اكتمال المنصة ووضوح ما يقدمه النشاط عند أول زيارة.',
      linkedTo: p.biggestGap,
      horizon: 7,
      internalOnly: isInternal,
    })
  }

  // منصات بروابط دون تحقق
  const unverified = d.platforms.filter((p) => p.state === 'link_only')
  if (unverified.length) {
    drafts.push({
      what: 'استكمال أدلة المنصات غير المتحقق منها برفع لقطات أو تقارير رسمية.',
      why: `منصات أُضيفت روابطها دون إمكانية تحقق مباشر: ${unverified
        .map((p) => PLATFORM_LABEL[p.platform])
        .join('، ')}.`,
      where: 'ملف العميل داخل النظام',
      priority: 'high',
      expectedImpact: 'رفع مستوى الثقة في نتيجة التقييم وإكمال البنود غير المقيّمة.',
      linkedTo: 'نقص أدلة المنصات',
      horizon: 7,
      internalOnly: true,
    })
  }

  /* ---------- 30 يومًا: الهوية والمحتوى والانتظام ---------- */

  const identity = d.score.items.find((i) => i.id === 'identity')
  if (identity && identity.percent !== null && identity.percent < 70) {
    drafts.push({
      what: 'توحيد الهوية البصرية والنبذة التعريفية ووصف الخدمات على كل المنصات المفعّلة.',
      why: identity.basis,
      where: 'جميع المنصات المفعّلة',
      priority: 'high',
      expectedImpact: 'تذكّر أوضح للعلامة واتساق الانطباع بين نقاط الدخول المختلفة.',
      linkedTo: identity.label,
      horizon: 30,
    })
  }

  const consistency = d.score.items.find((i) => i.id === 'consistency')
  if (consistency && consistency.percent !== null && consistency.percent < 70) {
    drafts.push({
      what: 'اعتماد خطة نشر ثابتة بجدول أسبوعي محدد ومسؤول تنفيذ معروف.',
      why: consistency.basis,
      where: 'المنصات ذات النشاط الأعلى',
      priority: 'medium',
      expectedImpact: 'انتظام الظهور بدل النشاط المتقطع.',
      linkedTo: consistency.label,
      horizon: 30,
    })
  }

  const content = d.score.items.find((i) => i.id === 'contentQuality')
  if (content && content.percent !== null && content.percent < 70) {
    drafts.push({
      what: 'رفع جودة المواد البصرية والنصوص للمنتجات أو الخدمات الأساسية.',
      why: content.basis,
      where: 'المحتوى المنشور على المنصات',
      priority: 'medium',
      expectedImpact: 'وضوح أعلى لما يقدمه النشاط وأثر أفضل على قرار التواصل.',
      linkedTo: content.label,
      horizon: 30,
    })
  }

  for (const o of swot.opportunities.slice(0, 2)) {
    drafts.push({
      what: o.text,
      why: `فرصة مرصودة بأثر ${o.impact}.`,
      where: o.source.label,
      priority: 'medium',
      expectedImpact: 'استثمار فرصة قائمة بدل انتظار تغيّر السوق.',
      linkedTo: o.text,
      horizon: 30,
    })
  }

  /* ---------- 90 يومًا: البحث والتحويل والقياس ---------- */

  const search = d.score.items.find((i) => i.id === 'searchability')
  if (search && (search.percent === null || search.percent < 70)) {
    drafts.push({
      what: 'إدراج الكلمات المفتاحية المحلية في أسماء الحسابات والنبذ ووصف الخدمات وصفحات الموقع.',
      why: search.percent === null ? 'لا توجد بنود مرصودة تخص القابلية للبحث.' : search.basis,
      where: 'الموقع والمنصات',
      priority: 'medium',
      expectedImpact: 'ظهور أوسع عند البحث عن الخدمة داخل النطاق الجغرافي.',
      linkedTo: search.label,
      horizon: 90,
    })
  }

  const conversion = d.score.items.find((i) => i.id === 'conversion')
  if (conversion && (conversion.percent === null || conversion.percent < 70)) {
    drafts.push({
      what: 'تبسيط مسار الطلب أو الحجز حتى يكتمل بأقل عدد من الخطوات.',
      why: conversion.percent === null ? 'لا توجد بنود مرصودة تخص تجربة التحويل.' : conversion.basis,
      where: 'الموقع أو المتجر أو قناة الطلب المعتمدة',
      priority: 'high',
      expectedImpact: 'تحويل الاهتمام القائم إلى طلبات فعلية.',
      linkedTo: conversion.label,
      horizon: 90,
    })
  }

  if (cx.readingType === 'digital') {
    drafts.push({
      what: 'تنفيذ تجربة متسوق سري موثقة تشمل الاتصال والطلب والاستلام.',
      why: 'القراءة الحالية رقمية فقط ولا تغطي التجربة الفعلية.',
      where: 'فريق بسطة',
      priority: 'medium',
      expectedImpact: 'قياس التجربة الحقيقية بدل الاكتفاء بالانطباع الرقمي.',
      linkedTo: 'نوع القراءة الحالي',
      horizon: 90,
    })
  }

  drafts.push({
    what: 'اعتماد مؤشرات قياس شهرية ثابتة ومراجعة النتائج في تقرير دوري.',
    why: 'غياب خط أساس للقياس يمنع الحكم على أثر أي تنفيذ لاحق.',
    where: 'تقارير المتابعة',
    priority: 'low',
    expectedImpact: 'قرارات مبنية على مؤشرات بدل الانطباعات.',
    linkedTo: 'قياس الأثر',
    horizon: 90,
  })

  // إجراء داخلي: تنفيذ المتسوق السري يخص فريق بسطة
  const mysteryIdx = drafts.findIndex((x) => x.where === 'فريق بسطة')
  if (mysteryIdx >= 0) drafts[mysteryIdx].internalOnly = true

  /* ---------- التجميع مع سقف 3 إلى 5 لكل أفق ---------- */

  const toRec = (d0: Draft): Recommendation => ({
    id: id(),
    what: d0.what,
    why: d0.why,
    where: d0.where,
    priority: d0.priority,
    expectedImpact: d0.expectedImpact,
    linkedTo: d0.linkedTo,
    internalOnly: d0.internalOnly,
  })

  const order: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
  const bucket = (h: 7 | 30 | 90) =>
    drafts
      .filter((x) => x.horizon === h)
      .sort((a, b) => order[a.priority] - order[b.priority])
      .slice(0, 5)
      .map(toRec)

  return { days7: bucket(7), days30: bucket(30), days90: bucket(90) }
}
