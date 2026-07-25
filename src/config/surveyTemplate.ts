/**
 * قالب الاستبيان — بنية فقط، بدون أي بيانات عميل.
 * البنية مبنية على شكل الاستبيان الذكي المعتمد لدى بسطة (٨ خطوات).
 * النظام يقبل أي استبيان جديد: أضف قالبًا آخر إلى SURVEY_TEMPLATES وسيظهر
 * تلقائيًا في شاشة إنشاء العميل ويعمل معه المحلل دون تعديل في الكود.
 */

export type FieldKind = 'text' | 'longtext' | 'choice' | 'multi' | 'number' | 'url' | 'email'

export interface SurveyField {
  /** مفتاح ثابت يُستخدم في التحليل */
  key: string
  /** نص السؤال كما يظهر للموظف */
  label: string
  kind: FieldKind
  /** مرادفات تُستخدم لمطابقة السؤال عند استخراج الإجابات من ملف مرفوع */
  aliases?: string[]
  /** التصنيف التحليلي للحقل — يوجّه المحلل دون تأليف نتائج */
  topic:
    | 'profile'
    | 'digital'
    | 'goals'
    | 'budget'
    | 'sales'
    | 'campaigns'
    | 'audience'
    | 'content'
    | 'challenges'
    | 'consent'
}

export interface SurveyStep {
  id: string
  title: string
  fields: SurveyField[]
}

export interface SurveyTemplate {
  id: string
  name: string
  steps: SurveyStep[]
}

/** القالب المعتمد الحالي: الاستبيان الذكي. */
const SMART_SURVEY: SurveyTemplate = {
  id: 'smart_survey_v1',
  name: 'الاستبيان الذكي',
  steps: [
    {
      id: 'step1',
      title: 'بيانات النشاط',
      fields: [
        { key: 'businessName', label: 'اسم النشاط التجاري', kind: 'text', topic: 'profile', aliases: ['اسم النشاط'] },
        { key: 'ownerName', label: 'اسم المسؤول / صاحب القرار', kind: 'text', topic: 'profile', aliases: ['المسؤول', 'صاحب القرار'] },
        { key: 'email', label: 'البريد الإلكتروني', kind: 'email', topic: 'profile', aliases: ['البريد'] },
        { key: 'phone', label: 'رقم الجوال', kind: 'text', topic: 'profile', aliases: ['الجوال', 'رقم التواصل'] },
        { key: 'sector', label: 'نوع النشاط التجاري', kind: 'text', topic: 'profile', aliases: ['القطاع', 'نوع النشاط'] },
        { key: 'description', label: 'وصف مختصر للنشاط', kind: 'longtext', topic: 'profile' },
        { key: 'businessAge', label: 'عمر النشاط', kind: 'text', topic: 'profile', aliases: ['مدة النشاط'] },
        { key: 'branches', label: 'عدد الفروع', kind: 'text', topic: 'profile' },
        { key: 'city', label: 'المدينة', kind: 'text', topic: 'profile' },
      ],
    },
    {
      id: 'step2',
      title: 'الحضور الرقمي',
      fields: [
        { key: 'instagram', label: 'رابط حساب انستقرام', kind: 'url', topic: 'digital', aliases: ['انستقرام', 'instagram'] },
        { key: 'instagramFollowers', label: 'عدد المتابعين على انستقرام', kind: 'text', topic: 'digital' },
        { key: 'tiktok', label: 'رابط حساب تيك توك', kind: 'url', topic: 'digital', aliases: ['تيك توك', 'tiktok'] },
        { key: 'snapchat', label: 'رابط حساب سناب شات', kind: 'url', topic: 'digital', aliases: ['سناب', 'snapchat'] },
        { key: 'website', label: 'الموقع الإلكتروني', kind: 'url', topic: 'digital', aliases: ['الموقع'] },
        { key: 'otherPlatforms', label: 'منصات أخرى', kind: 'longtext', topic: 'digital' },
      ],
    },
    {
      id: 'step3',
      title: 'الميزانية والأهداف',
      fields: [
        { key: 'budget', label: 'الميزانية التسويقية الشهرية التقريبية', kind: 'text', topic: 'budget', aliases: ['الميزانية'] },
        { key: 'goals', label: 'أهدافك التسويقية الرئيسية', kind: 'multi', topic: 'goals', aliases: ['الأهداف'] },
        { key: 'timeframe', label: 'الإطار الزمني المطلوب للنتائج', kind: 'text', topic: 'goals', aliases: ['المدة الزمنية'] },
      ],
    },
    {
      id: 'step4',
      title: 'المبيعات والعروض',
      fields: [
        { key: 'salesState', label: 'كيف تصف حالة مبيعاتك الحالية؟', kind: 'text', topic: 'sales' },
        { key: 'monthlySales', label: 'متوسط المبيعات الشهرية', kind: 'text', topic: 'sales' },
        { key: 'peakTimes', label: 'أوقات الذروة لنشاطك', kind: 'text', topic: 'sales' },
        { key: 'bestSellers', label: 'أفضل منتجاتك / خدماتك مبيعًا', kind: 'longtext', topic: 'sales' },
        { key: 'pricing', label: 'قائمة الأسعار / العروض الحالية', kind: 'longtext', topic: 'sales' },
      ],
    },
    {
      id: 'step5',
      title: 'الحملات السابقة',
      fields: [
        { key: 'ranCampaigns', label: 'هل سبق أن أطلقت حملات تسويقية مدفوعة؟', kind: 'choice', topic: 'campaigns' },
        { key: 'campaignPlatforms', label: 'على أي منصات أطلقت حملاتك؟', kind: 'multi', topic: 'campaigns' },
        { key: 'lastCampaign', label: 'متى كانت آخر حملة وما نتائجها التقريبية؟', kind: 'longtext', topic: 'campaigns' },
        { key: 'campaignLearnings', label: 'ما الذي نجح وما الذي لم ينجح؟', kind: 'longtext', topic: 'campaigns' },
      ],
    },
    {
      id: 'step6',
      title: 'الجمهور المستهدف',
      fields: [
        { key: 'ageGroup', label: 'الفئة العمرية الأساسية', kind: 'text', topic: 'audience' },
        { key: 'gender', label: 'الجنس المستهدف', kind: 'text', topic: 'audience' },
        { key: 'interests', label: 'اهتمامات جمهورك', kind: 'longtext', topic: 'audience' },
        { key: 'geo', label: 'الموقع الجغرافي المستهدف', kind: 'text', topic: 'audience' },
        { key: 'economicLevel', label: 'المستوى الاقتصادي للجمهور', kind: 'text', topic: 'audience' },
      ],
    },
    {
      id: 'step7',
      title: 'احتياج المحتوى',
      fields: [
        { key: 'contentTypes', label: 'ما أنواع المحتوى التي تحتاجها؟', kind: 'multi', topic: 'content' },
        { key: 'postsPerWeek', label: 'كم منشور تحتاج أسبوعيًا؟', kind: 'text', topic: 'content' },
        { key: 'internalTeam', label: 'هل لديك فريق داخلي لإنتاج المحتوى؟', kind: 'choice', topic: 'content' },
      ],
    },
    {
      id: 'step8',
      title: 'المشاكل والموافقة',
      fields: [
        { key: 'competitors', label: 'اذكر 3-5 منافسين رئيسيين', kind: 'longtext', topic: 'challenges' },
        { key: 'competitorStrengths', label: 'ما نقاط قوة منافسيك؟', kind: 'longtext', topic: 'challenges' },
        { key: 'differentiator', label: 'ما الذي يميزك عن منافسيك؟', kind: 'longtext', topic: 'challenges' },
        { key: 'mainProblems', label: 'أبرز المشاكل والتحديات التسويقية', kind: 'longtext', topic: 'challenges' },
        { key: 'workedWithAgency', label: 'هل تعاملت مع وكالة أو مسوقين من قبل؟', kind: 'choice', topic: 'challenges' },
        { key: 'extraInfo', label: 'معلومات إضافية', kind: 'longtext', topic: 'challenges' },
        { key: 'consent', label: 'أوافق على التواصل وإعداد التقرير التشخيصي', kind: 'choice', topic: 'consent' },
      ],
    },
  ],
}

export const SURVEY_TEMPLATES: SurveyTemplate[] = [SMART_SURVEY]

export const DEFAULT_TEMPLATE_ID = SMART_SURVEY.id

export function getTemplate(id: string): SurveyTemplate {
  return SURVEY_TEMPLATES.find((t) => t.id === id) ?? SMART_SURVEY
}

/** كل الحقول في قالب واحد كقائمة مسطحة. */
export function flatFields(t: SurveyTemplate): SurveyField[] {
  return t.steps.flatMap((s) => s.fields)
}

/** العبارات التي تعني أن الحقل لم يُعبّأ في ملفات الاستبيان المصدَّرة. */
export const EMPTY_MARKERS = ['لم يتم تعبئة هذا الحقل', '—', '--', 'لا يوجد', 'غير محدد']
