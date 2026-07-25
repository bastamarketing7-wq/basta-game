/**
 * QuestionnaireParser — يحوّل نص الاستبيان الخام إلى إجابات منظمة.
 * لا يفسّر ولا يستنتج: مطابقة أسئلة القالب بالنص فقط.
 */

import { flatFields, getTemplate, type SurveyField } from '../config/surveyTemplate'
import type { SurveyAnswers } from '../lib/clientTypes'
import { isEmptyValue } from './EvidenceValidator'

export interface ParseReport {
  answers: SurveyAnswers
  /** الحقول التي عُثر عليها */
  matched: string[]
  /** الحقول التي لم يُعثر لها على قيمة */
  missing: string[]
}

/** تطبيع النص العربي لتسهيل المطابقة. */
function normalize(s: string): string {
  return s
    .replace(/[ـً-ْ]/g, '') // تطويل وتشكيل
    .replace(/[أإآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** هل يبدأ السطر بسؤال معروف؟ يعيد الحقل المطابق. */
function matchField(line: string, fields: SurveyField[]): SurveyField | undefined {
  const n = normalize(line)
  if (!n) return undefined
  let best: { f: SurveyField; len: number } | undefined
  for (const f of fields) {
    const candidates = [f.label, ...(f.aliases ?? [])].map(normalize)
    for (const c of candidates) {
      if (!c) continue
      if (n.startsWith(c) || n === c) {
        if (!best || c.length > best.len) best = { f, len: c.length }
      }
    }
  }
  return best?.f
}

/** إزالة نص السؤال من بداية السطر لاستخراج القيمة الملتصقة. */
function stripLabel(line: string, field: SurveyField): string {
  const all = [field.label, ...(field.aliases ?? [])].sort((a, b) => b.length - a.length)
  let out = line.trim()
  for (const label of all) {
    const n = normalize(out)
    const ln = normalize(label)
    if (ln && n.startsWith(ln)) {
      // القص بحسب عدد كلمات التسمية لتفادي فروق التطبيع
      const words = out.split(/\s+/)
      const labelWords = label.trim().split(/\s+/).length
      out = words.slice(labelWords).join(' ')
      break
    }
  }
  return out.replace(/^[:：\-—.\s]+/, '').trim()
}

/**
 * يستخرج الإجابات من النص.
 * القيمة قد تكون على نفس سطر السؤال أو في الأسطر التالية حتى السؤال التالي.
 */
export function parseQuestionnaire(rawText: string, templateId: string): ParseReport {
  const template = getTemplate(templateId)
  const fields = flatFields(template)
  const answers: SurveyAnswers = {}

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  let current: SurveyField | undefined
  let buffer: string[] = []

  const flush = () => {
    if (!current) return
    const value = buffer.join(' ').trim()
    if (!isEmptyValue(value) && !answers[current.key]) answers[current.key] = value
    buffer = []
  }

  for (const line of lines) {
    // بعض التصديرات تضع السؤال والقيمة مفصولين بنقطتين
    const colonSplit = line.split(/\s*[:：]\s*/)
    const head = colonSplit.length > 1 ? colonSplit[0] : line

    const field = matchField(head, fields)
    if (field) {
      flush()
      current = field
      const inline = colonSplit.length > 1 ? colonSplit.slice(1).join(' : ') : stripLabel(line, field)
      if (inline) buffer.push(inline)
      continue
    }
    if (current) buffer.push(line)
  }
  flush()

  const matched = Object.keys(answers)
  const missing = fields.map((f) => f.key).filter((k) => !matched.includes(k))
  return { answers, matched, missing }
}
