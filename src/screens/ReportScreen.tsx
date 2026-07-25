/** شاشة التقرير — معاينة السبع صفحات، تعديل النصوص، إخفاء الأقسام، طباعة وتصدير PDF. */

import { useMemo, useState } from 'react'
import type { Route } from '../App'
import { APP, IDENTITY } from '../config/identity'
import { generateReport, type ReportContent } from '../engine/ReportGenerator'
import { getClient, saveClient } from '../lib/storage'
import ReportPages from '../components/ReportPages'
import { Card, Empty, TextArea } from '../components/ui'

/** الحقول النصية القابلة للتعديل قبل التصدير. */
const EDITABLE: Array<{ key: string; label: string; get: (c: ReportContent) => string }> = [
  { key: 'p2.essence', label: 'زبدة العميل', get: (c) => c.page2.essence },
  { key: 'p2.executiveSummary', label: 'الملخص التنفيذي', get: (c) => c.page2.executiveSummary },
  { key: 'p2.mainGoal', label: 'الهدف الرئيسي', get: (c) => c.page2.mainGoal },
  { key: 'p2.topChallenge', label: 'أهم تحدٍ', get: (c) => c.page2.topChallenge },
  { key: 'p2.topOpportunity', label: 'أهم فرصة', get: (c) => c.page2.topOpportunity },
  { key: 'p3.note', label: 'ملاحظة الظهور الرقمي', get: (c) => c.page3.note },
  { key: 'p7.approach', label: 'المنهج المقترح', get: (c) => c.page7.approach },
  { key: 'p7.nextStep', label: 'الخطوة التالية', get: (c) => c.page7.nextStep },
]

/** تطبيق تعديلات الموظف على محتوى التقرير. */
function applyOverrides(c: ReportContent, o: Record<string, string>): ReportContent {
  const g = (k: string, fallback: string) => (o[k]?.trim() ? o[k] : fallback)
  return {
    ...c,
    page2: {
      ...c.page2,
      essence: g('p2.essence', c.page2.essence),
      executiveSummary: g('p2.executiveSummary', c.page2.executiveSummary),
      mainGoal: g('p2.mainGoal', c.page2.mainGoal),
      topChallenge: g('p2.topChallenge', c.page2.topChallenge),
      topOpportunity: g('p2.topOpportunity', c.page2.topOpportunity),
    },
    page3: { ...c.page3, note: g('p3.note', c.page3.note) },
    page7: {
      ...c.page7,
      approach: g('p7.approach', c.page7.approach),
      nextStep: g('p7.nextStep', c.page7.nextStep),
    },
  }
}

export default function ReportScreen({ id, go }: { id: string; go: (r: Route) => void }) {
  const [tick, setTick] = useState(0)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState('')
  const client = useMemo(() => getClient(id), [id, tick])

  const [overrides, setOverrides] = useState<Record<string, string>>(() => getClient(id)?.reportOverrides ?? {})
  const [hidden, setHidden] = useState<string[]>(() => getClient(id)?.hiddenSections ?? [])

  const base = useMemo(() => {
    if (!client?.analysis) return null
    return generateReport(client, client.analysis, {
      tagline: IDENTITY.tagline,
      reportTitle: APP.reportTitle,
      byline: APP.reportFooterNote,
    })
  }, [client])

  if (!client) return <Empty title="لم يُعثر على ملف العميل" />
  if (!base)
    return (
      <Empty
        title="لا يوجد تحليل بعد"
        text="شغّل التشخيص أولًا لإنشاء التقرير."
        action={
          <button className="btn btn-primary" onClick={() => go({ name: 'client', id })}>
            فتح الملف
          </button>
        }
      />
    )

  const content = applyOverrides(base, overrides)

  const persist = (status?: 'completed') => {
    saveClient({
      ...client,
      reportOverrides: overrides,
      hiddenSections: hidden,
      ...(status ? { status } : {}),
    })
    setSaved(status ? 'حُفظت النسخة النهائية.' : 'حُدِّث التقرير.')
    setTimeout(() => setSaved(''), 3500)
    setTick((t) => t + 1)
  }

  const toggleHidden = (k: string) =>
    setHidden((h) => (h.includes(k) ? h.filter((x) => x !== k) : [...h, k]))

  return (
    <>
      <div className="page-head no-print">
        <h1>التقرير — 7 صفحات</h1>
        <p>
          {client.profile.businessName} — عدّل النصوص عند الحاجة ثم صدّر PDF عبر الطباعة واختيار «حفظ كـ PDF» بحجم
          A4 وهوامش صفرية.
        </p>
      </div>

      <div
        className="card no-print"
        style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <button className="btn" onClick={() => setEditing((e) => !e)}>
          {editing ? 'إغلاق التعديل' : 'تعديل نصوص التقرير'}
        </button>
        <button className="btn" onClick={() => toggleHidden('package')}>
          {hidden.includes('package') ? 'إظهار قسم الباقة' : 'إخفاء قسم الباقة'}
        </button>
        <button className="btn" onClick={() => persist()}>
          تحديث التقرير
        </button>
        <button className="btn btn-accent" onClick={() => window.print()}>
          طباعة / تصدير PDF
        </button>
        <button className="btn btn-primary" onClick={() => persist('completed')}>
          حفظ نسخة نهائية
        </button>
        <button className="btn" onClick={() => go({ name: 'review', id })}>
          العودة للمراجعة
        </button>
        {saved && <span className="badge badge-good">{saved}</span>}
      </div>

      {editing && (
        <div className="no-print">
          <Card title="تعديل نصوص التقرير">
            <div className="grid grid-2">
              {EDITABLE.map((f) => (
                <TextArea
                  key={f.key}
                  label={f.label}
                  rows={3}
                  value={overrides[f.key] ?? f.get(base)}
                  onChange={(v) => setOverrides((o) => ({ ...o, [f.key]: v }))}
                  hint="الحد الأقصى للفقرة 60 كلمة."
                />
              ))}
            </div>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button className="btn btn-primary" onClick={() => persist()}>
                تطبيق وحفظ
              </button>
              <button
                className="btn"
                onClick={() => {
                  setOverrides({})
                  setSaved('أُعيدت النصوص الأصلية.')
                  setTimeout(() => setSaved(''), 3000)
                }}
              >
                استعادة النص الأصلي
              </button>
            </div>
          </Card>
        </div>
      )}

      <ReportPages c={content} clientName={client.profile.businessName || 'غير محدد'} hidden={hidden} />
    </>
  )
}
