/**
 * QuestionnaireAnalyzer — يحلل إجابات الاستبيان ولا يعيد كتابتها.
 * كل مخرج مرتبط بدليل من إجابة فعلية. عند غياب الإجابة لا يُستنتج شيء.
 */

import { flatFields, getTemplate } from '../config/surveyTemplate'
import type { ClientRecord } from '../lib/clientTypes'
import { isEmptyValue, limit, makeFinding } from './EvidenceValidator'
import type {
  ChallengeCategory,
  Finding,
  QuestionnaireAnalysis,
  ReadinessItem,
  ReadinessState,
} from './types'

const SURVEY_SRC = (label: string) => ({ kind: 'survey' as const, label })

/** يجمع قيمة حقل من الاستبيان أو من ملف العميل. */
function val(client: ClientRecord, key: string): string {
  const a = client.survey.answers[key]
  if (!isEmptyValue(a)) return a.trim()
  const p = (client.profile as unknown as Record<string, string>)[key]
  return isEmptyValue(p) ? '' : p.trim()
}

/** تسمية السؤال كما وردت في القالب — تُستخدم كمصدر. */
function labelOf(client: ClientRecord, key: string): string {
  const t = getTemplate(client.survey.templateId)
  return flatFields(t).find((f) => f.key === key)?.label ?? key
}

/** تقسيم إجابة متعددة الاختيارات إلى عناصر. */
function items(v: string): string[] {
  return v
    .split(/[،,\n•|]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
}

/** كلمات تدل على ضعف أو مشكلة. */
const WEAK_HINTS = ['ضعيف', 'ضعيفة', 'تحتاج تحسين', 'لم ينجح', 'لم يتم', 'مشاكل', 'مشكلة', 'صعوبة', 'قليل', 'متذبذب', 'انخفاض']
const NO_HINTS = ['لا', 'ما في', 'لا يوجد', 'ليس لدي']

const hasAny = (v: string, list: string[]) => list.some((w) => v.includes(w))

/* ------------------------------------------------------------------ */
/* الأهداف                                                             */
/* ------------------------------------------------------------------ */

function extractGoals(client: ClientRecord): Finding[] {
  const raw = val(client, 'goals')
  const timeframe = val(client, 'timeframe')
  const salesState = val(client, 'salesState')
  const out: Array<Finding | null> = []

  if (raw) {
    const list = items(raw)
    // الترتيب بالأولوية: هدف البيع أولًا إن كانت المبيعات ضعيفة، ثم بقية الأهداف بترتيب ورودها
    const salesWeak = hasAny(salesState, WEAK_HINTS)
    const ordered = salesWeak
      ? [...list].sort((a, b) => Number(b.includes('مبيعات')) - Number(a.includes('مبيعات')))
      : list

    for (const g of ordered.slice(0, 3)) {
      out.push(
        makeFinding({
          text: g,
          classification: 'confirmed',
          source: SURVEY_SRC(labelOf(client, 'goals')),
          confidence: 'high',
          evidence: raw,
        }),
      )
    }
  }

  // الإطار الزمني يُضاف كسياق للهدف وليس كهدف مستقل
  if (timeframe && out.length) {
    const first = out[0]
    if (first) first.text = `${first.text} — ضمن إطار زمني مطلوب: ${timeframe}`
  }

  return limit(out, 3)
}

/* ------------------------------------------------------------------ */
/* التحديات                                                            */
/* ------------------------------------------------------------------ */

function extractChallenges(client: ClientRecord): Array<Finding & { category: ChallengeCategory }> {
  const out: Array<(Finding & { category: ChallengeCategory }) | null> = []

  const push = (
    text: string,
    category: ChallengeCategory,
    key: string,
    evidence: string,
    cls: 'confirmed' | 'analytical' = 'analytical',
  ) => {
    const f = makeFinding({
      text,
      classification: cls,
      source: SURVEY_SRC(labelOf(client, key)),
      confidence: cls === 'confirmed' ? 'high' : 'medium',
      evidence,
    })
    out.push(f ? { ...f, category } : null)
  }

  // 1) مشكلة معلنة صراحة
  const problems = val(client, 'mainProblems')
  if (problems) {
    push(`مشكلة معلنة من العميل: ${problems}`, 'marketing', 'mainProblems', problems, 'confirmed')
  }

  // 2) ضعف المبيعات
  const sales = val(client, 'salesState')
  if (sales && hasAny(sales, WEAK_HINTS)) {
    push('المبيعات الحالية دون المستوى المطلوب بحسب توصيف صاحب النشاط.', 'sales', 'salesState', sales, 'confirmed')
  }

  // 3) غياب الحضور الرقمي
  const digitalKeys = ['instagram', 'tiktok', 'snapchat', 'website']
  const missingDigital = digitalKeys.filter((k) => !val(client, k) && !client.links[k as never])
  if (missingDigital.length >= 2) {
    const names = missingDigital.map((k) => labelOf(client, k)).join('، ')
    push(
      `لا توجد قنوات رقمية مفعّلة أو موثّقة في: ${names}. الاعتماد الحالي محدود القنوات.`,
      'digital',
      'instagram',
      `حقول لم تُعبّأ: ${names}`,
    )
  }

  // 4) حملة سابقة لم تحقق نتيجة
  const learnings = val(client, 'campaignLearnings')
  if (learnings && hasAny(learnings, WEAK_HINTS)) {
    push(
      'حملات مدفوعة سابقة لم تحقق النتيجة المطلوبة، ما يشير إلى فجوة في الاستهداف أو الرسالة أو وجهة التحويل.',
      'marketing',
      'campaignLearnings',
      learnings,
    )
  }

  // 5) غياب فريق محتوى داخلي مع حاجة نشر متكررة
  const team = val(client, 'internalTeam')
  const posts = val(client, 'postsPerWeek')
  if (team && hasAny(team, NO_HINTS) && posts) {
    push(
      `الحاجة إلى ${posts} أسبوعيًا مع عدم وجود فريق داخلي لإنتاج المحتوى يمثل عبئًا تشغيليًا على الانتظام.`,
      'operations',
      'internalTeam',
      `${team} — ${posts}`,
    )
  }

  // 6) ميزانية غير محددة مع إطار زمني قصير
  const budget = val(client, 'budget')
  const timeframe = val(client, 'timeframe')
  if (budget && budget.includes('لم أحدد') && timeframe) {
    push(
      `طلب نتائج خلال ${timeframe} مقابل ميزانية غير محددة يخلق فجوة بين التوقع والقدرة على التنفيذ.`,
      'marketing',
      'budget',
      `${budget} — ${timeframe}`,
    )
  }

  // 7) غياب بيانات المنافسين
  const competitors = val(client, 'competitors')
  if (!competitors && val(client, 'competitorStrengths')) {
    push(
      'ذُكرت نقاط قوة المنافسين دون تحديد المنافسين أنفسهم، ما يضعف دقة المقارنة التنافسية.',
      'marketing',
      'competitors',
      `نقاط قوة المنافسين: ${val(client, 'competitorStrengths')}`,
    )
  }

  return limit(out, 5)
}

/* ------------------------------------------------------------------ */
/* القوة والضعف والفرص                                                 */
/* ------------------------------------------------------------------ */

function extractStrengths(client: ClientRecord): Finding[] {
  const out: Array<Finding | null> = []

  const diff = val(client, 'differentiator')
  if (diff) {
    out.push(
      makeFinding({
        text: `عامل تمايز معلن: ${diff}.`,
        classification: 'confirmed',
        source: SURVEY_SRC(labelOf(client, 'differentiator')),
        confidence: 'medium',
        evidence: diff,
      }),
    )
  }

  const best = val(client, 'bestSellers')
  if (best) {
    out.push(
      makeFinding({
        text: `وجود منتجات أو خدمات محددة الأفضل مبيعًا: ${best}. تصلح كنقطة انطلاق للمحتوى والعروض.`,
        classification: 'confirmed',
        source: SURVEY_SRC(labelOf(client, 'bestSellers')),
        confidence: 'medium',
        evidence: best,
      }),
    )
  }

  const ran = val(client, 'ranCampaigns')
  if (ran && ran.includes('نعم')) {
    out.push(
      makeFinding({
        text: 'سبق للنشاط تجربة الإعلانات المدفوعة، ما يعني وجود قابلية للاستثمار التسويقي وتجربة سابقة يمكن البناء عليها.',
        classification: 'analytical',
        source: SURVEY_SRC(labelOf(client, 'ranCampaigns')),
        confidence: 'medium',
        evidence: ran,
      }),
    )
  }

  const audience = [val(client, 'ageGroup'), val(client, 'gender'), val(client, 'geo')].filter(Boolean)
  if (audience.length >= 2) {
    out.push(
      makeFinding({
        text: `تحديد واضح للجمهور المستهدف: ${audience.join(' — ')}. يسهّل ضبط الاستهداف الإعلاني.`,
        classification: 'confirmed',
        source: SURVEY_SRC('الجمهور المستهدف'),
        confidence: 'medium',
        evidence: audience.join(' | '),
      }),
    )
  }

  const consent = val(client, 'consent')
  if (consent && consent.includes('موافق')) {
    out.push(
      makeFinding({
        text: 'موافقة صريحة على التواصل وإعداد التقرير التشخيصي، ما يعكس استعدادًا للبدء.',
        classification: 'confirmed',
        source: SURVEY_SRC(labelOf(client, 'consent')),
        confidence: 'high',
        evidence: consent,
        visibleToClient: false,
      }),
    )
  }

  return limit(out, 5)
}

function extractWeaknesses(client: ClientRecord): Finding[] {
  const out: Array<Finding | null> = []
  const t = getTemplate(client.survey.templateId)
  const fields = flatFields(t)

  // نقص البيانات الجوهرية
  const criticalKeys = ['description', 'bestSellers', 'pricing', 'competitors', 'interests', 'peakTimes']
  const empty = criticalKeys.filter((k) => !val(client, k))
  if (empty.length >= 2) {
    const names = empty.map((k) => fields.find((f) => f.key === k)?.label ?? k).join('، ')
    out.push(
      makeFinding({
        text: `حقول أساسية لم تُعبّأ في الاستبيان: ${names}. النقص يحد من دقة البناء التسويقي.`,
        classification: 'confirmed',
        source: SURVEY_SRC('حقول الاستبيان'),
        confidence: 'high',
        evidence: `عدد الحقول غير المعبأة: ${empty.length}`,
      }),
    )
  }

  // ميزانية غير محددة
  const budget = val(client, 'budget')
  if (budget && budget.includes('لم أحدد')) {
    out.push(
      makeFinding({
        text: 'الميزانية التسويقية غير محددة، ما يمنع بناء خطة تنفيذ قابلة للقياس.',
        classification: 'confirmed',
        source: SURVEY_SRC(labelOf(client, 'budget')),
        confidence: 'high',
        evidence: budget,
      }),
    )
  }

  // وصف مشكلة عام غير محدد
  const problems = val(client, 'mainProblems')
  if (problems && problems.length < 20) {
    out.push(
      makeFinding({
        text: 'توصيف المشكلة التسويقية جاء عامًا وغير محدد، ما يستدعي جلسة تحديد أولويات قبل التنفيذ.',
        classification: 'analytical',
        source: SURVEY_SRC(labelOf(client, 'mainProblems')),
        confidence: 'medium',
        evidence: problems,
      }),
    )
  }

  // نتائج حملة سابقة غير موثقة
  const last = val(client, 'lastCampaign')
  if (last && !/\d/.test(last)) {
    out.push(
      makeFinding({
        text: 'نتائج الحملة السابقة غير موثقة برقم أو مؤشر، ما يمنع الاستفادة منها كخط أساس للمقارنة.',
        classification: 'analytical',
        source: SURVEY_SRC(labelOf(client, 'lastCampaign')),
        confidence: 'medium',
        evidence: last,
      }),
    )
  }

  // تعارض: يطلب نتائج سريعة ونشاط جديد
  const age = val(client, 'businessAge')
  const timeframe = val(client, 'timeframe')
  if (age.includes('أقل من سنة') && timeframe.includes('شهر')) {
    out.push(
      makeFinding({
        text: `تعارض بين عمر النشاط (${age}) والإطار الزمني المطلوب (${timeframe}). بناء الوعي لنشاط جديد يحتاج مدى أطول من دورة الحملة الواحدة.`,
        classification: 'analytical',
        source: SURVEY_SRC('عمر النشاط والإطار الزمني'),
        confidence: 'medium',
        evidence: `${age} | ${timeframe}`,
      }),
    )
  }

  return limit(out, 5)
}

function extractOpportunities(client: ClientRecord): Finding[] {
  const out: Array<Finding | null> = []

  // منصة غير مفعّلة + نوع محتوى مطلوب
  const contentTypes = val(client, 'contentTypes')
  const hasTikTok = Boolean(val(client, 'tiktok') || client.links.tiktok)
  if (contentTypes.includes('ريلز') && !hasTikTok) {
    out.push(
      makeFinding({
        text: 'الحاجة معلنة لمحتوى الفيديو القصير دون وجود حساب تيك توك مفعّل. فتح القناة يوسّع مدى الوصول بنفس المحتوى المنتج.',
        classification: 'analytical',
        source: SURVEY_SRC(labelOf(client, 'contentTypes')),
        confidence: 'medium',
        evidence: contentTypes,
      }),
    )
  }

  // جمهور محدد جغرافيًا
  const geo = val(client, 'geo')
  const city = val(client, 'city') || client.profile.city
  if (geo || city) {
    out.push(
      makeFinding({
        text: `تركيز جغرافي محدد (${geo || city}) يتيح استهدافًا محليًا منخفض التكلفة وتحسين الظهور في نتائج البحث المحلي.`,
        classification: 'analytical',
        source: SURVEY_SRC('الموقع الجغرافي المستهدف'),
        confidence: 'medium',
        evidence: geo || city,
      }),
    )
  }

  // أفضل المنتجات كمحرك عروض
  const best = val(client, 'bestSellers')
  const peak = val(client, 'peakTimes')
  if (best && peak) {
    out.push(
      makeFinding({
        text: `ربط أفضل المنتجات مبيعًا بأوقات الذروة (${peak}) يتيح بناء عروض موقوتة بدل الحملات العامة.`,
        classification: 'analytical',
        source: SURVEY_SRC('المبيعات والعروض'),
        confidence: 'medium',
        evidence: `${best} | ${peak}`,
      }),
    )
  }

  // تمايز غير مستثمر في المحتوى
  const diff = val(client, 'differentiator')
  if (diff) {
    out.push(
      makeFinding({
        text: `تحويل عامل التمايز المعلن (${diff}) إلى رسالة ظاهرة في الحسابات والمواد التسويقية بدل بقائه معرفة داخلية.`,
        classification: 'analytical',
        source: SURVEY_SRC(labelOf(client, 'differentiator')),
        confidence: 'medium',
        evidence: diff,
      }),
    )
  }

  // نقاط قوة المنافسين كفرصة تموضع
  const compStrength = val(client, 'competitorStrengths')
  if (compStrength) {
    out.push(
      makeFinding({
        text: `نقاط قوة المنافسين المرصودة (${compStrength}) تحدد المعيار الذي يجب معادلته أو تجاوزه في العرض والتواصل.`,
        classification: 'analytical',
        source: SURVEY_SRC(labelOf(client, 'competitorStrengths')),
        confidence: 'medium',
        evidence: compStrength,
      }),
    )
  }

  return limit(out, 5)
}

/* ------------------------------------------------------------------ */
/* الجاهزية والجدية                                                    */
/* ------------------------------------------------------------------ */

function assessReadiness(client: ClientRecord): ReadinessItem[] {
  const mk = (key: string, label: string, state: ReadinessState, basis: string): ReadinessItem => ({
    key,
    label,
    state,
    basis,
  })

  const goals = val(client, 'goals')
  const budget = val(client, 'budget')
  const team = val(client, 'internalTeam')
  const desc = val(client, 'description')
  const timeframe = val(client, 'timeframe')
  const owner = val(client, 'ownerName') || client.profile.ownerName

  const answered = Object.keys(client.survey.answers).length
  const total = flatFields(getTemplate(client.survey.templateId)).length
  const fillRate = total ? answered / total : 0

  return [
    mk(
      'clearGoals',
      'وضوح الأهداف',
      !goals ? 'insufficient' : items(goals).length > 3 ? 'partial' : 'ready',
      goals ? `الأهداف المحددة: ${items(goals).length}` : 'لم تُحدد أهداف في الاستبيان.',
    ),
    mk(
      'budget',
      'توفر الميزانية',
      !budget ? 'insufficient' : budget.includes('لم أحدد') ? 'needs_prep' : 'ready',
      budget || 'لم تُحدد الميزانية.',
    ),
    mk(
      'teamSupport',
      'دعم الفريق',
      !team ? 'insufficient' : team.trim().startsWith('لا') ? 'needs_prep' : 'ready',
      team ? `فريق داخلي للمحتوى: ${team}` : 'لم يُحدد وجود فريق داخلي.',
    ),
    mk(
      'offering',
      'جودة المنتج أو الخدمة',
      desc ? 'partial' : 'insufficient',
      desc
        ? 'يوجد وصف للنشاط، والحكم على الجودة يحتاج تجربة فعلية أو تقييمات عملاء.'
        : 'لا يوجد وصف للنشاط في الاستبيان.',
    ),
    mk(
      'execution',
      'القدرة على التنفيذ',
      !budget || budget.includes('لم أحدد') ? 'needs_prep' : 'partial',
      'ترتبط بتحديد الميزانية ووجود جهة تنفيذ داخلية أو خارجية.',
    ),
    mk(
      'change',
      'الاستعداد للتغيير',
      val(client, 'consent').includes('موافق') ? 'ready' : 'insufficient',
      val(client, 'consent') || 'لم تُسجّل موافقة صريحة.',
    ),
    mk(
      'data',
      'توفر البيانات',
      fillRate >= 0.75 ? 'ready' : fillRate >= 0.4 ? 'partial' : 'needs_prep',
      `نسبة تعبئة الاستبيان: ${Math.round(fillRate * 100)}٪`,
    ),
    mk(
      'decisionMaker',
      'وجود صاحب قرار',
      owner ? 'ready' : 'insufficient',
      owner ? `صاحب القرار: ${owner}` : 'لم يُحدد صاحب القرار.',
    ),
    mk(
      'timeline',
      'وضوح الإطار الزمني',
      timeframe ? 'ready' : 'insufficient',
      timeframe || 'لم يُحدد إطار زمني.',
    ),
  ]
}

function assessSeriousness(client: ClientRecord) {
  const answered = Object.keys(client.survey.answers).length
  const total = flatFields(getTemplate(client.survey.templateId)).length
  const fillRate = total ? answered / total : 0

  const goals = val(client, 'goals')
  const budget = val(client, 'budget')
  const owner = val(client, 'ownerName') || client.profile.ownerName
  const timeframe = val(client, 'timeframe')
  const problems = val(client, 'mainProblems')

  const items_ = [
    {
      label: 'وضوح الإجابات',
      met: problems ? problems.length >= 20 : null,
      basis: problems ? `توصيف المشكلة: ${problems}` : 'لم يُذكر توصيف للمشكلة.',
    },
    {
      label: 'اكتمال البيانات',
      met: fillRate >= 0.6,
      basis: `نسبة التعبئة ${Math.round(fillRate * 100)}٪`,
    },
    {
      label: 'وجود أهداف قابلة للقياس',
      met: goals ? /مبيعات|عملاء|leads|مبيع/i.test(goals) : null,
      basis: goals || 'لم تُحدد أهداف.',
    },
    {
      label: 'توفر ميزانية',
      met: budget ? !budget.includes('لم أحدد') : null,
      basis: budget || 'لم تُحدد الميزانية.',
    },
    {
      label: 'وجود صاحب قرار',
      met: Boolean(owner),
      basis: owner || 'لم يُحدد صاحب القرار.',
    },
    {
      label: 'وجود مدة زمنية متوقعة',
      met: Boolean(timeframe),
      basis: timeframe || 'لم يُحدد إطار زمني.',
    },
  ]

  const known = items_.filter((i) => i.met !== null)
  const metCount = known.filter((i) => i.met).length
  let summary: string
  if (known.length < 3) {
    summary = 'المعلومات غير كافية لتقدير مستوى الجدية.'
  } else if (metCount >= known.length - 1) {
    summary = 'مؤشرات الجدية مكتملة في أغلب البنود، والملف جاهز للانتقال إلى مرحلة التنفيذ.'
  } else if (metCount >= Math.ceil(known.length / 2)) {
    summary = 'الجدية قائمة مع نقص في بند أو أكثر يحتاج استكمالًا قبل بدء التنفيذ.'
  } else {
    summary = 'مؤشرات الجدية ناقصة في أغلب البنود، ويُنصح باستكمال البيانات قبل الالتزام بخطة.'
  }

  return { items: items_, summary }
}

/* ------------------------------------------------------------------ */
/* زبدة العميل                                                         */
/* ------------------------------------------------------------------ */

function buildEssence(
  client: ClientRecord,
  goals: Finding[],
  challenges: Finding[],
  opportunities: Finding[],
  readiness: ReadinessItem[],
): { text: string; available: boolean } {
  const sector = val(client, 'sector') || client.profile.sector
  const age = val(client, 'businessAge')
  const sales = val(client, 'salesState')
  const city = client.profile.city || val(client, 'city')

  if (!sector && !goals.length && !challenges.length) {
    return { text: 'المعلومات غير كافية لكتابة زبدة العميل. يلزم استكمال بيانات الاستبيان.', available: false }
  }

  const parts: string[] = []

  const who = [sector, city && `في ${city}`, age && `وعمره ${age}`].filter(Boolean).join(' ')
  if (who) parts.push(`نشاط ${who}.`)
  if (sales) parts.push(`الوضع الحالي للمبيعات: ${sales}.`)
  if (goals[0]) parts.push(`الهدف الفعلي: ${goals[0].text.split('—')[0].trim()}.`)
  if (challenges[0]) parts.push(`المشكلة الأساسية: ${challenges[0].text.replace(/^مشكلة معلنة من العميل:\s*/, '')}.`)
  if (opportunities[0]) parts.push(`أبرز فرصة: ${opportunities[0].text}`)

  const readyCount = readiness.filter((r) => r.state === 'ready').length
  const level =
    readyCount >= readiness.length * 0.7
      ? 'جاهز للتطوير'
      : readyCount >= readiness.length * 0.4
        ? 'جاهز جزئيًا ويحتاج استكمال بيانات'
        : 'يحتاج تجهيزًا قبل التنفيذ'
  parts.push(`مستوى الجاهزية: ${level}.`)

  // القص عند 80 كلمة كحد أقصى
  let text = parts.join(' ')
  const words = text.split(/\s+/)
  if (words.length > 80) text = words.slice(0, 80).join(' ') + '.'
  return { text, available: true }
}

/* ------------------------------------------------------------------ */

export function analyzeQuestionnaire(client: ClientRecord): QuestionnaireAnalysis {
  const goals = extractGoals(client)
  const challenges = extractChallenges(client)
  const strengths = extractStrengths(client)
  const weaknesses = extractWeaknesses(client)
  const opportunities = extractOpportunities(client)
  const readiness = assessReadiness(client)
  const seriousness = assessSeriousness(client)
  const essence = buildEssence(client, goals, challenges, opportunities, readiness)

  return {
    essence: essence.text,
    essenceAvailable: essence.available,
    goals,
    challenges,
    strengths,
    weaknesses,
    opportunities,
    readiness,
    seriousness,
  }
}
