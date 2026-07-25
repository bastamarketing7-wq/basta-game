/**
 * PackageRecommendationEngine — يرشح باقة واحدة فقط من الملف المعتمد.
 * لا يؤلف اسم باقة ولا سعرًا ولا مدة ولا ضمانًا ولا كمية محتوى.
 * عند عدم توفر قائمة معتمدة تُعرض الرسالة الإلزامية ويتوقف الترشيح.
 */

import { PACKAGES, PACKAGES_UNAVAILABLE_MESSAGE, hasApprovedPackages } from '../config/packages'
import type { PackageRecommendation, RecommendationPlan, SwotAnalysis } from './types'

/** تطبيع للمطابقة النصية بين مشكلة وبند تعالجه الباقة. */
function norm(s: string): string {
  return s.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
}

function scorePackage(solves: string[], problems: string[]): number {
  let score = 0
  for (const s of solves) {
    const ns = norm(s)
    if (!ns) continue
    for (const p of problems) {
      const np = norm(p)
      if (np.includes(ns) || ns.split(' ').some((w) => w.length > 3 && np.includes(w))) {
        score++
        break
      }
    }
  }
  return score
}

export function recommendPackage(
  swot: SwotAnalysis,
  plan: RecommendationPlan,
): PackageRecommendation {
  if (!hasApprovedPackages()) {
    return { available: false, message: PACKAGES_UNAVAILABLE_MESSAGE }
  }

  // المشكلات ذات الأولوية: الضعف المرصود + الإجراءات العاجلة
  const problems = [
    ...swot.weaknesses.map((w) => w.text),
    ...plan.days7.map((r) => r.linkedTo),
    ...swot.risks.map((r) => r.text),
  ]

  const ranked = PACKAGES.map((p) => ({ p, score: scorePackage(p.solves, problems) })).sort(
    (a, b) => b.score - a.score,
  )

  const top = ranked[0]
  // لا تُرشح باقة بلا سبب مرتبط بمشكلة مرصودة
  if (!top || top.score === 0) {
    return {
      available: false,
      message:
        'لا يمكن ترشيح باقة لعدم وجود ارتباط واضح بين الباقات المعتمدة والمشكلات المرصودة. يلزم استكمال التحليل.',
    }
  }

  const matched = top.p.solves.filter((s) =>
    problems.some((p) => norm(p).includes(norm(s)) || norm(s).split(' ').some((w) => w.length > 3 && norm(p).includes(w))),
  )

  const second = ranked[1]

  return {
    available: true,
    main: {
      id: top.p.id,
      name: top.p.name,
      price: top.p.price,
      duration: top.p.duration,
      includes: top.p.includes,
      why: `الترشيح مبني على معالجة ${matched.length} من المشكلات ذات الأولوية المرصودة في التحليل.`,
      treats: matched,
      adBudgetNote: top.p.adBudgetNote,
    },
    // بديل واحد فقط وعند وجود ارتباط فعلي
    alternative:
      second && second.score > 0
        ? {
            id: second.p.id,
            name: second.p.name,
            why: 'خيار بديل يعالج جزءًا من المشكلات نفسها بنطاق أضيق.',
          }
        : undefined,
  }
}
