/**
 * أنواع البيانات المشتركة لمحرك التشخيص.
 * كل استنتاج يمر عبر Finding حتى يبقى مصدره ومستوى الثقة فيه واضحًا.
 */

import type { Confidence, CriterionStatus } from '../config/evaluationCriteria'

/** تصنيف المعلومة. إلزامي للتفريق بين المؤكد والملاحظ والاستنتاجي وغير المتوفر. */
export type Classification = 'confirmed' | 'observation' | 'analytical' | 'unavailable'

export const CLASSIFICATION_LABEL: Record<Classification, string> = {
  confirmed: 'بيانات مؤكدة',
  observation: 'ملاحظة ظاهرة',
  analytical: 'استنتاج تحليلي',
  unavailable: 'بيانات غير متوفرة',
}

/** مصدر المعلومة كما يظهر في نموذج المراجعة الداخلي. */
export interface EvidenceSource {
  /** من أين جاءت المعلومة: الاستبيان، ملاحظات الفريق، ملف مرفوع، رابط، أو المنصة */
  kind: 'survey' | 'team_notes' | 'uploaded_file' | 'link' | 'platform' | 'system'
  /** وصف قصير للمصدر — مثلًا اسم الحقل أو اسم الملف */
  label: string
  /** تاريخ الاطلاع إن وُجد */
  checkedAt?: string
}

/** وحدة الاستنتاج الأساسية. */
export interface Finding {
  id: string
  text: string
  classification: Classification
  source: EvidenceSource
  confidence: Confidence
  /** الدليل الحرفي الذي بُني عليه الاستنتاج */
  evidence: string
  /** هل يظهر للعميل في التقرير أم للمراجعة الداخلية فقط */
  visibleToClient: boolean
}

/** حالة الجاهزية. */
export type ReadinessState = 'ready' | 'partial' | 'needs_prep' | 'insufficient'

export const READINESS_LABEL: Record<ReadinessState, string> = {
  ready: 'جاهز',
  partial: 'جاهز جزئيًا',
  needs_prep: 'يحتاج تجهيزًا أولًا',
  insufficient: 'المعلومات غير كافية',
}

export interface ReadinessItem {
  key: string
  label: string
  state: ReadinessState
  basis: string
}

/** نتيجة تحليل الاستبيان. */
export interface QuestionnaireAnalysis {
  essence: string
  essenceAvailable: boolean
  goals: Finding[]
  challenges: Array<Finding & { category: ChallengeCategory }>
  strengths: Finding[]
  weaknesses: Finding[]
  opportunities: Finding[]
  readiness: ReadinessItem[]
  seriousness: {
    items: Array<{ label: string; met: boolean | null; basis: string }>
    summary: string
  }
}

export type ChallengeCategory = 'marketing' | 'operations' | 'sales' | 'experience' | 'digital'

export const CHALLENGE_LABEL: Record<ChallengeCategory, string> = {
  marketing: 'تحدٍ تسويقي',
  operations: 'تحدٍ تشغيلي',
  sales: 'تحدٍ في المبيعات',
  experience: 'تحدٍ في تجربة العميل',
  digital: 'تحدٍ في الهوية والظهور الرقمي',
}

/** المنصات المدعومة. */
export type PlatformId =
  | 'google'
  | 'instagram'
  | 'tiktok'
  | 'snapchat'
  | 'website'
  | 'x'
  | 'linkedin'
  | 'store'

export const PLATFORM_LABEL: Record<PlatformId, string> = {
  google: 'Google Business و Google Maps',
  instagram: 'انستقرام',
  tiktok: 'تيك توك',
  snapchat: 'سناب شات',
  website: 'الموقع الإلكتروني',
  x: 'منصة X',
  linkedin: 'لينكدإن',
  store: 'المتجر الإلكتروني',
}

/** حالة توفر بيانات المنصة. */
export type PlatformDataState =
  /** لم يُضف رابط ولا ملفات */
  | 'not_provided'
  /** أُضيف رابط لكن لا يمكن التحقق منه آليًا */
  | 'link_only'
  /** توجد أدلة مرفوعة (لقطات أو تقارير) */
  | 'evidence_provided'

/** بند تحقق واحد داخل منصة. */
export interface CheckItem {
  key: string
  label: string
  /** ما رصده الموظف أو الملف. فارغ = غير متوفر */
  value: string
  classification: Classification
}

/** تحليل منصة واحدة. */
export interface PlatformAnalysis {
  platform: PlatformId
  state: PlatformDataState
  url?: string
  /** رسالة الحالة عند تعذر التحقق */
  statusNote?: string
  checks: CheckItem[]
  currentState: string
  strongestPoint: string
  biggestGap: string
  proposedAction: string
  findings: Finding[]
  /** درجة البند إن توفرت بيانات، وإلا null */
  scores: Record<string, number | null>
}

/** نتيجة نموذج التقييم. */
export interface ScoreResult {
  /** الدرجة من 100 بعد إعادة الضبط على البنود المتوفرة، أو null إن لا بيانات */
  total: number | null
  confidence: Confidence
  /** نسبة الوزن المغطى فعليًا */
  coverage: number
  items: Array<{
    id: string
    label: string
    weight: number
    /** النسبة المئوية للبند أو null */
    percent: number | null
    status: CriterionStatus
    explanation: string
    basis: string
  }>
}

/** مقارنة المنصات. */
export interface PlatformComparison {
  strongest: string
  weakest: string
  highestPotential: string
  priority: string
  biggestGap: string
  interoperability: string
  journey: string
}

export interface DigitalPresenceAnalysis {
  platforms: PlatformAnalysis[]
  score: ScoreResult
  comparison: PlatformComparison
  keywords: KeywordPlan
}

/** خطة الكلمات المفتاحية. */
export interface KeywordGroup {
  id: string
  label: string
  words: string[]
}

export interface KeywordPlan {
  basis: {
    activityType: string
    services: string[]
    city: string
    serviceAreas: string[]
  }
  groups: KeywordGroup[]
  note: string
}

/** تجربة العميل. */
export interface CustomerExperienceAnalysis {
  /** هل التنفيذ رقمي فقط أم يوجد متسوق سري موثق */
  readingType: 'digital' | 'field'
  readingTypeLabel: string
  confidence: Confidence
  satisfaction: Finding[]
  frictions: Finding[]
  repeatedComplaints: Finding[]
  lossPoints: Finding[]
  quickWins: Finding[]
  journey: Array<{ step: string; state: string; classification: Classification }>
}

/** SWOT التنفيذي. */
export interface SwotAnalysis {
  strengths: Finding[]
  weaknesses: Finding[]
  opportunities: Array<Finding & { impact: string; ease: string; speed: string; cost: string }>
  risks: Finding[]
}

/** التوصيات. */
export type Priority = 'urgent' | 'high' | 'medium' | 'low'

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'عاجلة',
  high: 'عالية',
  medium: 'متوسطة',
  low: 'منخفضة',
}

export interface Recommendation {
  id: string
  what: string
  why: string
  where: string
  priority: Priority
  expectedImpact: string
  /** المشكلة أو الفرصة التي ارتبطت بها التوصية */
  linkedTo: string
  /** إجراء داخلي يخص فريق بسطة ولا يظهر في تقرير العميل */
  internalOnly?: boolean
}

export interface RecommendationPlan {
  days7: Recommendation[]
  days30: Recommendation[]
  days90: Recommendation[]
}

/** ترشيح الباقة. */
export interface PackageRecommendation {
  available: boolean
  message?: string
  main?: {
    id: string
    name: string
    price?: string
    duration?: string
    includes: string[]
    why: string
    treats: string[]
    adBudgetNote?: string
  }
  alternative?: {
    id: string
    name: string
    why: string
  }
}

/** ناتج التحليل الكامل. */
export interface DiagnosisResult {
  questionnaire: QuestionnaireAnalysis
  digital: DigitalPresenceAnalysis
  experience: CustomerExperienceAnalysis
  swot: SwotAnalysis
  recommendations: RecommendationPlan
  packageRecommendation: PackageRecommendation
  /** كل الأدلة المستخدمة — نموذج المراجعة الداخلي */
  evidenceLog: Finding[]
  generatedAt: string
}
