/** نموذج بيانات العميل داخل النظام. */

import type { DiagnosisResult } from '../engine/types'
import type { PlatformId } from '../engine/types'

export interface ClientProfile {
  businessName: string
  ownerName: string
  sector: string
  city: string
  phone: string
  email: string
  businessAge: string
  branches: string
  description: string
  diagnosisPurpose: string
}

export const EMPTY_PROFILE: ClientProfile = {
  businessName: '',
  ownerName: '',
  sector: '',
  city: '',
  phone: '',
  email: '',
  businessAge: '',
  branches: '',
  description: '',
  diagnosisPurpose: '',
}

/** روابط المنصات. */
export type ClientLinks = Partial<Record<PlatformId, string>> & { extra?: string }

/** ملف مرفوع — يُخزَّن اسمه ونوعه ونصه المستخرج فقط. */
export interface StoredFile {
  id: string
  name: string
  size: number
  kind: FileKind
  /** النص المستخرج إن كان الملف نصيًا */
  extractedText?: string
  /** صورة مصغّرة كـ dataURL للقطات الشاشة */
  dataUrl?: string
  addedAt: string
}

export type FileKind =
  | 'survey'
  | 'instagram_insights'
  | 'tiktok_analytics'
  | 'google_business'
  | 'google_analytics'
  | 'search_console'
  | 'screenshot_chat'
  | 'screenshot_order'
  | 'other'

export const FILE_KIND_LABEL: Record<FileKind, string> = {
  survey: 'ملف الاستبيان',
  instagram_insights: 'Instagram Insights',
  tiktok_analytics: 'TikTok Analytics',
  google_business: 'تقرير Google Business',
  google_analytics: 'تقرير Google Analytics',
  search_console: 'تقرير Search Console',
  screenshot_chat: 'لقطة محادثة أو رد',
  screenshot_order: 'لقطة عملية طلب أو تواصل',
  other: 'ملف إضافي',
}

/** ملاحظات فريق بسطة. */
export interface TeamNotes {
  general: string
  communication: string
  visit: string
  mysteryShopper: string
  offPlatform: string
}

export const EMPTY_NOTES: TeamNotes = {
  general: '',
  communication: '',
  visit: '',
  mysteryShopper: '',
  offPlatform: '',
}

/** إجابات الاستبيان بعد الاستخراج: مفتاح الحقل ← القيمة. */
export type SurveyAnswers = Record<string, string>

export interface SurveyData {
  templateId: string
  /** النص الخام الملصوق أو المستخرج من الملف */
  rawText: string
  /** الإجابات بعد التنظيم */
  answers: SurveyAnswers
  /** مصدر كل إجابة: استخراج آلي أو إدخال يدوي */
  answerSources: Record<string, 'extracted' | 'manual'>
}

export type ClientStatus = 'draft' | 'analyzing' | 'review' | 'completed'

export const STATUS_LABEL: Record<ClientStatus, string> = {
  draft: 'مسودة',
  analyzing: 'قيد التحليل',
  review: 'قيد المراجعة',
  completed: 'مكتمل',
}

/** تعديلات الموظف على نصوص التقرير قبل التصدير. */
export type ReportOverrides = Record<string, string>

/** الأقسام المخفية في التقرير. */
export type HiddenSections = string[]

export interface ClientRecord {
  id: string
  createdAt: string
  updatedAt: string
  status: ClientStatus
  profile: ClientProfile
  survey: SurveyData
  links: ClientLinks
  files: StoredFile[]
  notes: TeamNotes
  /** ملاحظات المنصات المرصودة يدويًا: platform.checkKey ← القيمة */
  platformChecks: Record<string, string>
  analysis?: DiagnosisResult
  reportOverrides: ReportOverrides
  hiddenSections: HiddenSections
}
