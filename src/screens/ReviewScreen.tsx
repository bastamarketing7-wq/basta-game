/** شاشة المراجعة — تبويبات كاملة، ورصد يدوي لبنود المنصات، وإعادة تشغيل التحليل. */

import { useMemo, useState } from 'react'
import type { Route } from '../App'
import { CONFIDENCE_LABEL, STATUS_LABEL } from '../config/evaluationCriteria'
import { CHECK_STATES, PLATFORM_CHECKS } from '../config/platformChecks'
import { PACKAGES_UNAVAILABLE_MESSAGE } from '../config/packages'
import { runDiagnosis } from '../engine/pipeline'
import {
  CHALLENGE_LABEL,
  PLATFORM_LABEL,
  PRIORITY_LABEL,
  READINESS_LABEL,
  type PlatformId,
} from '../engine/types'
import { getClient, saveClient } from '../lib/storage'
import { Bar, Card, Empty, FindingList } from '../components/ui'

const TABS = [
  { id: 'survey', label: 'الاستبيان' },
  { id: 'digital', label: 'الظهور الرقمي' },
  { id: 'experience', label: 'تجربة العميل' },
  { id: 'swot', label: 'القوة والضعف' },
  { id: 'recs', label: 'التوصيات' },
  { id: 'package', label: 'الباقة' },
  { id: 'evidence', label: 'سجل الأدلة' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ReviewScreen({ id, go }: { id: string; go: (r: Route) => void }) {
  const [tab, setTab] = useState<TabId>('survey')
  const [tick, setTick] = useState(0)
  const [busy, setBusy] = useState(false)
  const client = useMemo(() => getClient(id), [id, tick])

  if (!client) return <Empty title="لم يُعثر على ملف العميل" />
  const a = client.analysis
  if (!a)
    return (
      <Empty
        title="لم يُشغَّل التحليل بعد"
        text="ارجع إلى ملف العميل واضغط بدء التشخيص."
        action={
          <button className="btn btn-primary" onClick={() => go({ name: 'client', id })}>
            فتح الملف
          </button>
        }
      />
    )

  const setCheck = (platform: PlatformId, key: string, value: string) => {
    const updated = { ...client, platformChecks: { ...client.platformChecks, [`${platform}.${key}`]: value } }
    saveClient(updated)
    setTick((t) => t + 1)
  }

  const rerun = async () => {
    setBusy(true)
    const fresh = getClient(id)!
    const { result } = await runDiagnosis(fresh, () => {})
    saveClient({ ...fresh, analysis: result, status: 'review' })
    setBusy(false)
    setTick((t) => t + 1)
  }

  const q = a.questionnaire
  const d = a.digital

  return (
    <>
      <div className="page-head">
        <h1>مراجعة نتائج التشخيص</h1>
        <p>
          {client.profile.businessName} — راجع النتائج وعدّلها قبل التصدير. الرصد اليدوي لبنود المنصات يرفع دقة
          التقييم ومستوى الثقة.
        </p>
      </div>

      <div className="tabs no-print">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ---------------- الاستبيان ---------------- */}
      {tab === 'survey' && (
        <>
          <Card title="زبدة العميل">
            {q.essenceAvailable ? <p>{q.essence}</p> : <div className="notice accent">{q.essence}</div>}
          </Card>

          <Card title="الأهداف">
            <FindingList items={q.goals} empty="لم تُحدد أهداف في الاستبيان." />
          </Card>

          <Card title="التحديات">
            {q.challenges.length ? (
              q.challenges.map((c) => (
                <div className="finding" key={c.id}>
                  <div className="txt">{c.text}</div>
                  <div className="meta">
                    <span className="badge badge-blue">{CHALLENGE_LABEL[c.category]}</span>
                    <span className="badge">المصدر: {c.source.label}</span>
                    <span className="badge">الثقة: {CONFIDENCE_LABEL[c.confidence]}</span>
                  </div>
                  <div className="ev">الدليل: {c.evidence}</div>
                </div>
              ))
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>
                لا توجد تحديات مستخرجة من الإجابات المتوفرة.
              </p>
            )}
          </Card>

          <div className="grid grid-2">
            <Card title="نقاط القوة">
              <FindingList items={q.strengths} empty="لم تُذكر نقاط قوة في الإجابات." />
            </Card>
            <Card title="نقاط الضعف">
              <FindingList items={q.weaknesses} empty="لا توجد نقاط ضعف مستخرجة." />
            </Card>
          </div>

          <Card title="الفرص">
            <FindingList items={q.opportunities} empty="لا توجد فرص قابلة للاستخراج من البيانات الحالية." />
          </Card>

          <Card title="مستوى الجاهزية">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>البند</th>
                    <th>الحالة</th>
                    <th>الأساس</th>
                  </tr>
                </thead>
                <tbody>
                  {q.readiness.map((r) => (
                    <tr key={r.key}>
                      <td style={{ fontWeight: 700 }}>{r.label}</td>
                      <td>
                        <span
                          className={`badge ${
                            r.state === 'ready' ? 'badge-good' : r.state === 'partial' ? 'badge-warn' : 'badge-bad'
                          }`}
                        >
                          {READINESS_LABEL[r.state]}
                        </span>
                      </td>
                      <td className="muted">{r.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="مستوى الجدية">
            <p style={{ marginBottom: 14 }}>{q.seriousness.summary}</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>المؤشر</th>
                    <th>الحالة</th>
                    <th>الأساس</th>
                  </tr>
                </thead>
                <tbody>
                  {q.seriousness.items.map((s) => (
                    <tr key={s.label}>
                      <td style={{ fontWeight: 700 }}>{s.label}</td>
                      <td>
                        <span
                          className={`badge ${s.met === null ? '' : s.met ? 'badge-good' : 'badge-bad'}`}
                        >
                          {s.met === null ? 'غير متوفر' : s.met ? 'متحقق' : 'غير متحقق'}
                        </span>
                      </td>
                      <td className="muted">{s.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ---------------- الظهور الرقمي ---------------- */}
      {tab === 'digital' && (
        <>
          <Card title="التقييم العام">
            <div className="grid grid-3" style={{ marginBottom: 18 }}>
              <div className="kpi">
                <div className="label">الدرجة من 100</div>
                <div className="value accent">{d.score.total ?? 'غير متوفرة'}</div>
              </div>
              <div className="kpi">
                <div className="label">مستوى الثقة</div>
                <div className="value" style={{ fontSize: 26 }}>
                  {CONFIDENCE_LABEL[d.score.confidence]}
                </div>
              </div>
              <div className="kpi">
                <div className="label">الوزن المغطى</div>
                <div className="value" style={{ fontSize: 26 }}>
                  {d.score.coverage} / 100
                </div>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>المعيار</th>
                    <th style={{ width: 90 }}>الوزن</th>
                    <th style={{ width: 180 }}>النتيجة</th>
                    <th>الحالة</th>
                    <th>سبب الدرجة</th>
                  </tr>
                </thead>
                <tbody>
                  {d.score.items.map((i) => (
                    <tr key={i.id}>
                      <td style={{ fontWeight: 700 }}>{i.label}</td>
                      <td>{i.weight}</td>
                      <td>
                        {i.percent === null ? (
                          <span className="badge">غير متوفر</span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Bar percent={i.percent} status={i.status} />
                            <b style={{ fontSize: 13 }}>{i.percent}٪</b>
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            i.status === 'good'
                              ? 'badge-good'
                              : i.status === 'needs_improvement'
                                ? 'badge-warn'
                                : i.status === 'weak'
                                  ? 'badge-bad'
                                  : ''
                          }`}
                        >
                          {STATUS_LABEL[i.status]}
                        </span>
                      </td>
                      <td className="muted" style={{ fontSize: 13 }}>
                        {i.basis}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="مقارنة المنصات">
            <div className="grid grid-2">
              {(
                [
                  ['الأقوى', d.comparison.strongest],
                  ['الأضعف', d.comparison.weakest],
                  ['الأعلى إمكانية', d.comparison.highestPotential],
                  ['الأولى بالمعالجة', d.comparison.priority],
                  ['أكبر فجوة', d.comparison.biggestGap],
                  ['الترابط بين المنصات', d.comparison.interoperability],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
                    {k}
                  </div>
                  <div style={{ fontSize: 14 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* الرصد اليدوي */}
          {d.platforms.map((p) => (
            <Card key={p.platform} title={PLATFORM_LABEL[p.platform]}>
              {p.url && (
                <p className="muted" style={{ fontSize: 13, marginBottom: 10, direction: 'ltr', textAlign: 'left' }}>
                  {p.url}
                </p>
              )}
              {p.statusNote && <div className="notice accent" style={{ marginBottom: 14 }}>{p.statusNote}</div>}

              <div className="grid grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>الوضع الحالي</div>
                  <div style={{ fontSize: 14 }}>{p.currentState}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>الإجراء المقترح</div>
                  <div style={{ fontSize: 14 }}>{p.proposedAction}</div>
                </div>
              </div>

              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  رصد بنود المنصة يدويًا ({PLATFORM_CHECKS[p.platform].length} بندًا)
                </summary>
                <div className="grid grid-3" style={{ marginTop: 12 }}>
                  {PLATFORM_CHECKS[p.platform].map((c) => (
                    <div className="field" key={c.key}>
                      <label htmlFor={`${p.platform}_${c.key}`}>{c.label}</label>
                      <select
                        id={`${p.platform}_${c.key}`}
                        value={client.platformChecks[`${p.platform}.${c.key}`] ?? ''}
                        onChange={(e) => setCheck(p.platform, c.key, e.target.value)}
                      >
                        {CHECK_STATES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </details>
            </Card>
          ))}

          <Card title="الكلمات المفتاحية المقترحة">
            {d.keywords.groups.length ? (
              <>
                <div className="grid grid-2">
                  {d.keywords.groups.map((g) => (
                    <div key={g.id}>
                      <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 8 }}>{g.label}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {g.words.map((w) => (
                          <span className="badge" key={w}>
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="notice" style={{ marginTop: 16 }}>
                  {d.keywords.note}
                </div>
              </>
            ) : (
              <div className="notice accent">{d.keywords.note}</div>
            )}
          </Card>
        </>
      )}

      {/* ---------------- تجربة العميل ---------------- */}
      {tab === 'experience' && (
        <>
          <Card title="مصدر القراءة">
            <div className="btn-row" style={{ marginBottom: 12 }}>
              <span className={`badge ${a.experience.readingType === 'field' ? 'badge-good' : 'badge-warn'}`}>
                {a.experience.readingTypeLabel}
              </span>
              <span className="badge">مستوى الثقة: {CONFIDENCE_LABEL[a.experience.confidence]}</span>
            </div>
            {a.experience.readingType === 'digital' && (
              <div className="notice accent">
                لم تُوثّق تجربة فعلية. لا تُنسب أي ملاحظة إلى متسوق سري ما لم تُضف ملاحظات زيارة أو اتصال أو طلب في
                ملف العميل.
              </div>
            )}
          </Card>

          <div className="grid grid-2">
            <Card title="عناصر الرضا">
              <FindingList items={a.experience.satisfaction} empty="لا توجد عناصر رضا مرصودة." />
            </Card>
            <Card title="الاحتكاكات">
              <FindingList items={a.experience.frictions} empty="لا توجد احتكاكات مرصودة." />
            </Card>
            <Card title="الشكاوى المتكررة">
              <FindingList items={a.experience.repeatedComplaints} empty="لا توجد شكاوى متكررة مرصودة." />
            </Card>
            <Card title="نقاط فقد العملاء">
              <FindingList items={a.experience.lossPoints} empty="لا توجد نقاط فقد مرصودة." />
            </Card>
          </div>

          <Card title="رحلة العميل">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 220 }}>الخطوة</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {a.experience.journey.map((j) => (
                    <tr key={j.step}>
                      <td style={{ fontWeight: 700 }}>{j.step}</td>
                      <td className={j.classification === 'unavailable' ? 'muted' : ''}>{j.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ---------------- SWOT ---------------- */}
      {tab === 'swot' && (
        <div className="grid grid-2">
          <Card title="نقاط القوة">
            <FindingList items={a.swot.strengths} empty="لا توجد نقاط قوة موثقة." />
          </Card>
          <Card title="نقاط الضعف">
            <FindingList items={a.swot.weaknesses} empty="لا توجد نقاط ضعف موثقة." />
          </Card>
          <Card title="الفرص">
            {a.swot.opportunities.length ? (
              a.swot.opportunities.map((o) => (
                <div className="finding" key={o.id}>
                  <div className="txt">{o.text}</div>
                  <div className="meta">
                    <span className="badge badge-blue">الأثر: {o.impact}</span>
                    <span className="badge">السرعة: {o.speed}</span>
                    <span className="badge">التكلفة: {o.cost}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted" style={{ fontSize: 13 }}>لا توجد فرص مرصودة.</p>
            )}
          </Card>
          <Card title="المخاطر">
            <FindingList items={a.swot.risks} empty="لا توجد مخاطر واضحة وذات أثر." />
          </Card>
        </div>
      )}

      {/* ---------------- التوصيات ---------------- */}
      {tab === 'recs' && (
        <>
          {(
            [
              ['إجراءات عاجلة خلال 7 أيام', a.recommendations.days7],
              ['إجراءات خلال 30 يومًا', a.recommendations.days30],
              ['إجراءات خلال 90 يومًا', a.recommendations.days90],
            ] as const
          ).map(([title, list]) => (
            <Card title={title} key={title}>
              {list.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ماذا</th>
                        <th>لماذا</th>
                        <th>أين</th>
                        <th>الأولوية</th>
                        <th>الأثر المتوقع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 700 }}>
                            {r.what}
                            {r.internalOnly && (
                              <div style={{ marginTop: 6 }}>
                                <span className="badge badge-warn">إجراء داخلي — لا يظهر في تقرير العميل</span>
                              </div>
                            )}
                          </td>
                          <td className="muted">{r.why}</td>
                          <td>{r.where}</td>
                          <td>
                            <span
                              className={`badge ${
                                r.priority === 'urgent'
                                  ? 'badge-bad'
                                  : r.priority === 'high'
                                    ? 'badge-warn'
                                    : 'badge-blue'
                              }`}
                            >
                              {PRIORITY_LABEL[r.priority]}
                            </span>
                          </td>
                          <td className="muted">{r.expectedImpact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 13 }}>لا توجد إجراءات لهذا الأفق الزمني.</p>
              )}
            </Card>
          ))}
        </>
      )}

      {/* ---------------- الباقة ---------------- */}
      {tab === 'package' && (
        <Card title="ترشيح الباقة">
          {a.packageRecommendation.available && a.packageRecommendation.main ? (
            <>
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>{a.packageRecommendation.main.name}</h3>
              <p style={{ marginBottom: 12 }}>{a.packageRecommendation.main.why}</p>
              <ul>
                {a.packageRecommendation.main.treats.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              {a.packageRecommendation.main.adBudgetNote && (
                <div className="notice" style={{ marginTop: 14 }}>
                  {a.packageRecommendation.main.adBudgetNote}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="notice accent">{a.packageRecommendation.message ?? PACKAGES_UNAVAILABLE_MESSAGE}</div>
              <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                تُضاف الباقات المعتمدة من ملف الإعدادات <code>src/config/packages.ts</code> ليعمل الترشيح تلقائيًا.
              </p>
            </>
          )}
        </Card>
      )}

      {/* ---------------- سجل الأدلة ---------------- */}
      {tab === 'evidence' && (
        <Card title="نموذج المراجعة الداخلي — مصدر كل معلومة">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>النص</th>
                  <th>التصنيف</th>
                  <th>المصدر</th>
                  <th>الثقة</th>
                  <th>الظهور</th>
                </tr>
              </thead>
              <tbody>
                {a.evidenceLog.map((f) => (
                  <tr key={f.id}>
                    <td>{f.text}</td>
                    <td>
                      <span className="badge">{f.classification}</span>
                    </td>
                    <td className="muted">{f.source.label}</td>
                    <td>{CONFIDENCE_LABEL[f.confidence]}</td>
                    <td>
                      <span className={`badge ${f.visibleToClient ? 'badge-good' : 'badge-warn'}`}>
                        {f.visibleToClient ? 'يظهر للعميل' : 'داخلي'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div
        className="card no-print"
        style={{ position: 'sticky', bottom: 16, marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}
      >
        <button className="btn" onClick={rerun} disabled={busy}>
          {busy ? 'جارٍ إعادة التحليل…' : 'إعادة تشغيل التحليل'}
        </button>
        <button className="btn btn-primary" onClick={() => go({ name: 'report', id })}>
          فتح التقرير
        </button>
        <button className="btn" onClick={() => go({ name: 'client', id })}>
          تعديل بيانات العميل
        </button>
      </div>
    </>
  )
}
