/** شاشة التحليل — تعرض المراحل الفعلية ولا تعلّم مرحلة كمكتملة قبل تنفيذها. */

import { useEffect, useRef, useState } from 'react'
import type { Route } from '../App'
import { STAGES, runDiagnosis, type StageId, type StageState } from '../engine/pipeline'
import { getClient, saveClient } from '../lib/storage'
import { Card } from '../components/ui'

type StageMap = Record<StageId, { state: StageState; note?: string }>

const initial = (): StageMap =>
  Object.fromEntries(STAGES.map((s) => [s.id, { state: 'pending' as StageState }])) as StageMap

export default function AnalyzeScreen({ id, go }: { id: string; go: (r: Route) => void }) {
  const [stages, setStages] = useState<StageMap>(initial)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const client = getClient(id)
    if (!client) {
      setError('لم يُعثر على ملف العميل.')
      return
    }

    void (async () => {
      try {
        const { result, parsedAnswers } = await runDiagnosis(client, (u) =>
          setStages((prev) => ({ ...prev, [u.id]: { state: u.state, note: u.note } })),
        )
        const updated = getClient(id) ?? client
        saveClient({
          ...updated,
          status: 'review',
          analysis: result,
          survey: parsedAnswers ? { ...updated.survey, answers: parsedAnswers } : updated.survey,
        })
        setDone(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'تعذر إكمال التحليل.')
      }
    })()
  }, [id])

  const doneCount = Object.values(stages).filter((s) => s.state === 'done').length
  const progress = Math.round((doneCount / STAGES.length) * 100)

  return (
    <>
      <div className="page-head">
        <h1>جارٍ التشخيص</h1>
        <p>يعرض النظام المراحل كما تُنفَّذ فعليًا. المرحلة التي لا تتوفر لها بيانات تُعلَّم كمتخطاة مع بيان السبب.</p>
      </div>

      <Card title={`مراحل التحليل — ${progress}٪`}>
        <div className="bar" style={{ marginBottom: 18 }}>
          <span style={{ width: `${progress}%` }} />
        </div>

        {STAGES.map((s, i) => {
          const st = stages[s.id]
          return (
            <div className={`stage ${st.state}`} key={s.id}>
              <div className="stage-dot">
                {st.state === 'done' ? '✓' : st.state === 'skipped' ? '!' : i + 1}
              </div>
              <div className="stage-body">
                <strong>{s.label}</strong>
                <p>
                  {st.state === 'pending' && 'بانتظار التنفيذ'}
                  {st.state === 'running' && 'جارٍ التنفيذ…'}
                  {(st.state === 'done' || st.state === 'skipped') && (st.note ?? '—')}
                </p>
              </div>
            </div>
          )
        })}

        {error && (
          <div className="notice accent" style={{ marginTop: 16 }}>
            {error}
          </div>
        )}

        <div className="btn-row" style={{ marginTop: 20 }}>
          <button className="btn btn-primary" disabled={!done} onClick={() => go({ name: 'review', id })}>
            فتح شاشة المراجعة
          </button>
          <button className="btn" onClick={() => go({ name: 'client', id })}>
            العودة للملف
          </button>
        </div>
      </Card>
    </>
  )
}
