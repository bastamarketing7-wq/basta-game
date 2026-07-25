/**
 * خط التحليل — يشغّل وحدات المحرك بالترتيب ويبلّغ عن تقدم كل مرحلة.
 * لا تُعلَّم مرحلة كمكتملة إلا بعد تنفيذها فعليًا.
 */

import type { ClientRecord } from '../lib/clientTypes'
import { analyzeCustomerExperience } from './CustomerExperienceAnalyzer'
import { analyzeDigitalPresence } from './DigitalPresenceAnalyzer'
import { parseQuestionnaire } from './QuestionnaireParser'
import { analyzeQuestionnaire } from './QuestionnaireAnalyzer'
import { buildRecommendations } from './RecommendationEngine'
import { recommendPackage } from './PackageRecommendationEngine'
import { analyzeSwot } from './SWOTAnalyzer'
import type { DiagnosisResult, Finding } from './types'

export type StageId =
  | 'parse'
  | 'validate'
  | 'client'
  | 'digital'
  | 'experience'
  | 'recommendations'
  | 'package'
  | 'report'

export interface Stage {
  id: StageId
  label: string
}

export const STAGES: Stage[] = [
  { id: 'parse', label: 'استخراج نتائج الاستبيان' },
  { id: 'validate', label: 'التحقق من البيانات' },
  { id: 'client', label: 'تحليل العميل' },
  { id: 'digital', label: 'تحليل الظهور الرقمي' },
  { id: 'experience', label: 'تحليل تجربة العميل' },
  { id: 'recommendations', label: 'صياغة التوصيات' },
  { id: 'package', label: 'اختيار الباقة' },
  { id: 'report', label: 'إنشاء التقرير' },
]

export type StageState = 'pending' | 'running' | 'done' | 'skipped'

export interface StageUpdate {
  id: StageId
  state: StageState
  /** ملاحظة تظهر بجانب المرحلة — مثلًا سبب التخطي */
  note?: string
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export interface RunOutput {
  result: DiagnosisResult
  /** الاستبيان بعد الاستخراج — يُحفظ في ملف العميل */
  parsedAnswers?: Record<string, string>
}

/**
 * يشغّل التحليل كاملًا.
 * onStage يُستدعى عند بدء وانتهاء كل مرحلة.
 */
export async function runDiagnosis(
  client: ClientRecord,
  onStage: (u: StageUpdate) => void,
): Promise<RunOutput> {
  const evidenceLog: Finding[] = []
  let working = client
  let parsedAnswers: Record<string, string> | undefined

  /* 1) استخراج الاستبيان */
  onStage({ id: 'parse', state: 'running' })
  await wait(120)
  if (working.survey.rawText.trim()) {
    const report = parseQuestionnaire(working.survey.rawText, working.survey.templateId)
    // الإدخال اليدوي له الأولوية على الاستخراج الآلي
    const merged = { ...report.answers }
    for (const [k, v] of Object.entries(working.survey.answers)) {
      if (working.survey.answerSources[k] === 'manual' && v.trim()) merged[k] = v
    }
    parsedAnswers = merged
    working = { ...working, survey: { ...working.survey, answers: merged } }
    onStage({
      id: 'parse',
      state: 'done',
      note: `استُخرج ${report.matched.length} حقلًا، وبقي ${report.missing.length} حقلًا غير معبأ.`,
    })
  } else if (Object.keys(working.survey.answers).length) {
    onStage({ id: 'parse', state: 'done', note: 'اعتُمدت الإجابات المدخلة يدويًا.' })
  } else {
    onStage({ id: 'parse', state: 'skipped', note: 'لا يوجد استبيان مرفوع أو ملصوق.' })
  }

  /* 2) التحقق من البيانات */
  onStage({ id: 'validate', state: 'running' })
  await wait(120)
  const answered = Object.keys(working.survey.answers).length
  const linkCount = Object.values(working.links).filter((v) => (v ?? '').trim()).length
  const checkCount = Object.values(working.platformChecks).filter((v) => v.trim()).length
  onStage({
    id: 'validate',
    state: 'done',
    note: `${answered} إجابة، ${linkCount} رابط، ${working.files.length} ملف، ${checkCount} بند مرصود.`,
  })

  /* 3) تحليل العميل */
  onStage({ id: 'client', state: 'running' })
  await wait(150)
  const questionnaire = analyzeQuestionnaire(working)
  evidenceLog.push(
    ...questionnaire.goals,
    ...questionnaire.challenges,
    ...questionnaire.strengths,
    ...questionnaire.weaknesses,
    ...questionnaire.opportunities,
  )
  onStage({
    id: 'client',
    state: questionnaire.essenceAvailable ? 'done' : 'skipped',
    note: questionnaire.essenceAvailable
      ? `${questionnaire.goals.length} أهداف، ${questionnaire.challenges.length} تحديات.`
      : 'بيانات الاستبيان غير كافية.',
  })

  /* 4) الظهور الرقمي */
  onStage({ id: 'digital', state: 'running' })
  await wait(180)
  const digital = analyzeDigitalPresence(working)
  evidenceLog.push(...digital.platforms.flatMap((p) => p.findings))
  onStage({
    id: 'digital',
    state: digital.platforms.length ? 'done' : 'skipped',
    note: digital.platforms.length
      ? `${digital.platforms.length} منصة، الدرجة ${digital.score.total ?? 'غير متوفرة'}.`
      : 'لم تُضف روابط أو أدلة منصات.',
  })

  /* 5) تجربة العميل */
  onStage({ id: 'experience', state: 'running' })
  await wait(150)
  const experience = analyzeCustomerExperience(working)
  evidenceLog.push(
    ...experience.satisfaction,
    ...experience.frictions,
    ...experience.repeatedComplaints,
    ...experience.lossPoints,
  )
  onStage({ id: 'experience', state: 'done', note: experience.readingTypeLabel })

  /* SWOT ثم التوصيات */
  const swot = analyzeSwot(questionnaire, digital, experience)

  onStage({ id: 'recommendations', state: 'running' })
  await wait(150)
  const recommendations = buildRecommendations(digital, experience, swot)
  const totalRecs =
    recommendations.days7.length + recommendations.days30.length + recommendations.days90.length
  onStage({
    id: 'recommendations',
    state: totalRecs ? 'done' : 'skipped',
    note: totalRecs ? `${totalRecs} توصية موزعة على ٧ و٣٠ و٩٠ يومًا.` : 'لا توجد مشكلات مرصودة لبناء توصيات.',
  })

  /* 6) الباقة */
  onStage({ id: 'package', state: 'running' })
  await wait(120)
  const packageRecommendation = recommendPackage(swot, recommendations)
  onStage({
    id: 'package',
    state: packageRecommendation.available ? 'done' : 'skipped',
    note: packageRecommendation.available ? packageRecommendation.main?.name : packageRecommendation.message,
  })

  /* 7) التقرير */
  onStage({ id: 'report', state: 'running' })
  await wait(120)
  const result: DiagnosisResult = {
    questionnaire,
    digital,
    experience,
    swot,
    recommendations,
    packageRecommendation,
    evidenceLog,
    generatedAt: new Date().toISOString(),
  }
  onStage({ id: 'report', state: 'done', note: 'تقرير من ٧ صفحات جاهز للمراجعة.' })

  return { result, parsedAnswers }
}
