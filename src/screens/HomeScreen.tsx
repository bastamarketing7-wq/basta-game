/** الشاشة الرئيسية — المؤشرات وقائمة آخر العملاء. */

import { useMemo, useState } from 'react'
import type { Route } from '../App'
import { IDENTITY } from '../config/identity'
import { STATUS_LABEL, type ClientRecord } from '../lib/clientTypes'
import { deleteClient, listClients, stats } from '../lib/storage'
import { Card, Empty } from '../components/ui'

export default function HomeScreen({ go }: { go: (r: Route) => void }) {
  const [tick, setTick] = useState(0)
  const clients = useMemo(() => listClients(), [tick])
  const s = useMemo(() => stats(), [tick])

  const remove = (c: ClientRecord) => {
    if (!confirm(`حذف ملف «${c.profile.businessName || 'بدون اسم'}» نهائيًا؟`)) return
    deleteClient(c.id)
    setTick((t) => t + 1)
  }

  const badgeClass = (st: ClientRecord['status']) =>
    st === 'completed' ? 'badge-good' : st === 'review' ? 'badge-warn' : st === 'analyzing' ? 'badge-blue' : ''

  return (
    <>
      <div className="page-head">
        <h1>{IDENTITY.tagline}</h1>
        <p>
          محرك التشخيص الداخلي — يحوّل استبيان العميل وروابطه وملاحظات الفريق إلى تقرير تحليلي من سبع صفحات جاهز
          للتسليم.
        </p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 22 }}>
        <div className="kpi">
          <div className="label">عدد العملاء</div>
          <div className="value accent">{s.total}</div>
        </div>
        <div className="kpi">
          <div className="label">تقارير مكتملة</div>
          <div className="value">{s.completed}</div>
        </div>
        <div className="kpi">
          <div className="label">تقارير قيد المراجعة</div>
          <div className="value">{s.inReview}</div>
        </div>
        <div className="kpi">
          <div className="label">مسودات</div>
          <div className="value">{s.drafts}</div>
        </div>
      </div>

      <Card
        title="آخر العملاء"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => go({ name: 'client' })}>
            تسجيل عميل جديد
          </button>
        }
      >
        {clients.length === 0 ? (
          <Empty
            title="لا يوجد عملاء بعد"
            text="ابدأ بتسجيل عميل جديد ورفع الاستبيان لتشغيل التشخيص."
            action={
              <button className="btn btn-primary" onClick={() => go({ name: 'client' })}>
                تسجيل عميل جديد
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>النشاط</th>
                  <th>القطاع</th>
                  <th>المدينة</th>
                  <th>الحالة</th>
                  <th>آخر تحديث</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 700 }}>{c.profile.businessName || 'بدون اسم'}</td>
                    <td>{c.profile.sector || '—'}</td>
                    <td>{c.profile.city || '—'}</td>
                    <td>
                      <span className={`badge ${badgeClass(c.status)}`}>{STATUS_LABEL[c.status]}</span>
                    </td>
                    <td className="muted" style={{ fontSize: 13 }}>
                      {new Date(c.updatedAt).toLocaleDateString('ar-SA-u-ca-gregory')}
                    </td>
                    <td>
                      <div className="btn-row">
                        <button className="btn btn-sm" onClick={() => go({ name: 'client', id: c.id })}>
                          الملف
                        </button>
                        {c.analysis && (
                          <>
                            <button className="btn btn-sm" onClick={() => go({ name: 'review', id: c.id })}>
                              المراجعة
                            </button>
                            <button className="btn btn-sm btn-primary" onClick={() => go({ name: 'report', id: c.id })}>
                              التقرير
                            </button>
                          </>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => remove(c)}>
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
