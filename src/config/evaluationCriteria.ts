/**
 * معايير تقييم الظهور الرقمي — ملف إعداد منفصل وقابل للتعديل.
 * المجموع 100 نقطة. لا يُمنح بند أي درجة عند عدم توفر بيانات، ويُعاد ضبط
 * المقياس تلقائيًا على البنود المتوفرة فقط.
 */

export interface Criterion {
  id: string
  label: string
  weight: number
  /** ما الذي يجعل هذا البند قويًا — يُعرض داخل النظام كتفسير للدرجة */
  explanation: string
}

export const CRITERIA: Criterion[] = [
  {
    id: 'completeness',
    label: 'اكتمال الحضور الرقمي',
    weight: 15,
    explanation: 'وجود الحسابات والمعلومات الأساسية كاملة وصحيحة على المنصات المستخدمة.',
  },
  {
    id: 'identity',
    label: 'وضوح الهوية والعرض',
    weight: 15,
    explanation: 'ثبات الاسم والشعار والألوان، ووضوح ما يقدمه النشاط من أول نظرة.',
  },
  {
    id: 'contentQuality',
    label: 'جودة المحتوى',
    weight: 15,
    explanation: 'جودة الصور والتصاميم والصياغة ومدى ارتباط المحتوى بالخدمة.',
  },
  {
    id: 'consistency',
    label: 'انتظام النشاط',
    weight: 10,
    explanation: 'انتظام النشر وحداثة آخر تحديث على المنصات.',
  },
  {
    id: 'engagement',
    label: 'التفاعل الظاهر',
    weight: 10,
    explanation: 'الإعجابات والتعليقات الظاهرة علنًا وجودة التفاعل معها.',
  },
  {
    id: 'reputation',
    label: 'السمعة والتقييمات',
    weight: 15,
    explanation: 'عدد التقييمات ومتوسطها وحداثتها والرد على الملاحظات.',
  },
  {
    id: 'conversion',
    label: 'تجربة التحويل والتواصل',
    weight: 10,
    explanation: 'سهولة الوصول لوسيلة تواصل واضحة وإتمام الطلب أو الحجز.',
  },
  {
    id: 'searchability',
    label: 'القابلية للبحث والكلمات المفتاحية',
    weight: 10,
    explanation: 'ظهور النشاط عند البحث باسمه وبالخدمات المحلية، ووجود كلمات مفتاحية في النصوص.',
  },
]

/** حالات البند. */
export type CriterionStatus = 'good' | 'needs_improvement' | 'weak' | 'unavailable'

/** عتبات تحويل النسبة إلى حالة. قابلة للتعديل. */
export const STATUS_THRESHOLDS = {
  good: 70,
  needsImprovement: 45,
} as const

export function statusFromPercent(percent: number | null): CriterionStatus {
  if (percent === null) return 'unavailable'
  if (percent >= STATUS_THRESHOLDS.good) return 'good'
  if (percent >= STATUS_THRESHOLDS.needsImprovement) return 'needs_improvement'
  return 'weak'
}

export const STATUS_LABEL: Record<CriterionStatus, string> = {
  good: 'جيد',
  needs_improvement: 'يحتاج تحسين',
  weak: 'ضعيف',
  unavailable: 'غير متوفر',
}

/** مستوى الثقة في النتيجة بحسب نسبة التغطية من الوزن الكلي. */
export type Confidence = 'high' | 'medium' | 'low'

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
}

export function confidenceFromCoverage(coveredWeight: number): Confidence {
  if (coveredWeight >= 70) return 'high'
  if (coveredWeight >= 40) return 'medium'
  return 'low'
}
