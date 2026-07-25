/**
 * EvidenceValidator — الحارس الذي يمنع تأليف المعلومات.
 * أي استنتاج لا يملك دليلًا نصيًا فعليًا يُرفض أو يُحوّل إلى «بيانات غير متوفرة».
 */

import type { Confidence } from '../config/evaluationCriteria'
import { EMPTY_MARKERS } from '../config/surveyTemplate'
import type { Classification, EvidenceSource, Finding } from './types'

let counter = 0
const nextId = () => `f_${++counter}_${Date.now().toString(36)}`

/** هل القيمة تعتبر فارغة أو غير معبأة. */
export function isEmptyValue(v: string | undefined | null): boolean {
  if (!v) return true
  const s = v.trim()
  if (!s) return true
  return EMPTY_MARKERS.some((m) => s === m || s.includes(m))
}

/** إنشاء استنتاج موثّق. يعيد null إذا لم يوجد دليل فعلي. */
export function makeFinding(input: {
  text: string
  classification: Classification
  source: EvidenceSource
  confidence: Confidence
  evidence: string
  visibleToClient?: boolean
}): Finding | null {
  if (!input.text.trim()) return null
  // الاستنتاج المؤكد أو الملاحظ أو التحليلي يجب أن يستند إلى دليل
  if (input.classification !== 'unavailable' && isEmptyValue(input.evidence)) return null
  return {
    id: nextId(),
    text: input.text.trim(),
    classification: input.classification,
    source: input.source,
    confidence: input.confidence,
    evidence: input.evidence.trim(),
    visibleToClient: input.visibleToClient ?? true,
  }
}

/** استنتاج «غير متوفر» صريح — يُستخدم بدل التخمين. */
export function unavailableFinding(text: string, source: EvidenceSource): Finding {
  return {
    id: nextId(),
    text,
    classification: 'unavailable',
    source,
    confidence: 'low',
    evidence: 'لا توجد بيانات مرفقة لهذا البند.',
    visibleToClient: true,
  }
}

/** تصفية القائمة من القيم الفارغة وتحديد سقف العدد. */
export function limit<T>(items: Array<T | null>, max: number): T[] {
  return items.filter((x): x is T => x !== null).slice(0, max)
}

/** الرسالة الموحدة عند تعذر التحقق من منصة. */
export const CANNOT_VERIFY = 'لا يمكن التحقق من هذه المنصة بشكل مباشر.'

/** الرسالة الموحدة عند الحاجة لإدخال يدوي أو ربط API. */
export const NEEDS_MANUAL = 'يحتاج إدخالًا يدويًا أو ربط API.'

/** نص موحّد لعدم توفر البيانات. */
export const NO_DATA = 'البيانات غير متوفرة حاليًا.'
