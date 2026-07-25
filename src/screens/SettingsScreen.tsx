/** شاشة الإعدادات — عرض ملفات الإعداد المعتمدة ومصدر تعديلها. */

import { CRITERIA } from '../config/evaluationCriteria'
import { APP, COLORS, IDENTITY } from '../config/identity'
import { PACKAGES, PACKAGES_UNAVAILABLE_MESSAGE } from '../config/packages'
import { SURVEY_TEMPLATES, flatFields } from '../config/surveyTemplate'
import { Card } from '../components/ui'

export default function SettingsScreen() {
  const totalWeight = CRITERIA.reduce((s, c) => s + c.weight, 0)

  return (
    <>
      <div className="page-head">
        <h1>الإعدادات</h1>
        <p>
          {APP.nameEn} — الهوية والباقات ومعايير التقييم وقوالب الاستبيان تُدار من ملفات إعداد منفصلة داخل
          <code> src/config/</code>.
        </p>
      </div>

      <Card title="بيانات الشركة">
        <div className="table-wrap">
          <table>
            <tbody>
              {(
                [
                  ['الاسم', IDENTITY.nameAr],
                  ['الاسم بالإنجليزية', IDENTITY.nameEn],
                  ['الشعار النصي', IDENTITY.tagline],
                  ['الموقع', IDENTITY.website],
                  ['البريد', IDENTITY.email],
                  ['الحساب الرسمي', IDENTITY.username],
                  ['Google Business', IDENTITY.googleBusiness],
                  ['النطاق الجغرافي', IDENTITY.regions.join('، ')],
                ] as const
              ).map(([k, v]) => (
                <tr key={k}>
                  <td style={{ fontWeight: 700, width: 200 }}>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="notice" style={{ marginTop: 14 }}>
          تُعدَّل هذه القيم من <code>src/config/identity.ts</code>. الشعار والخطوط الرسمية تُستخدم كما هي دون
          إعادة رسم أو تعديل.
        </div>
      </Card>

      <Card title="الألوان الرسمية">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {(
            [
              ['الأزرق', COLORS.blue],
              ['البرتقالي', COLORS.orange],
              ['الأبيض', COLORS.white],
            ] as const
          ).map(([name, hex]) => (
            <div key={hex} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 92,
                  height: 62,
                  background: hex,
                  border: '1px solid var(--line)',
                  borderRadius: 10,
                }}
              />
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', direction: 'ltr' }}>{hex}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="الباقات">
        {PACKAGES.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>الباقة</th>
                  <th>السعر</th>
                  <th>المدة</th>
                  <th>تعالج</th>
                </tr>
              </thead>
              <tbody>
                {PACKAGES.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700 }}>{p.name}</td>
                    <td>{p.price ?? '—'}</td>
                    <td>{p.duration ?? '—'}</td>
                    <td className="muted">{p.solves.join('، ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <div className="notice accent">{PACKAGES_UNAVAILABLE_MESSAGE}</div>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              لم تُرفق قائمة الباقات المعتمدة ضمن ملفات المشروع. تُضاف من <code>src/config/packages.ts</code>
              بأسمائها وأسعارها ومددها كما هي معتمدة رسميًا، ولا يُؤلَّف أي منها.
            </p>
          </>
        )}
      </Card>

      <Card title={`معايير التقييم — المجموع ${totalWeight}`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>المعيار</th>
                <th style={{ width: 80 }}>الوزن</th>
                <th>التفسير</th>
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700 }}>{c.label}</td>
                  <td>{c.weight}</td>
                  <td className="muted">{c.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="notice" style={{ marginTop: 14 }}>
          تُعدَّل الأوزان والعتبات من <code>src/config/evaluationCriteria.ts</code>. البند بلا بيانات لا يُمنح
          درجة، ويُعاد ضبط المقياس على البنود المتوفرة فقط.
        </div>
      </Card>

      <Card title="قوالب الاستبيان">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>القالب</th>
                <th>الخطوات</th>
                <th>عدد الحقول</th>
              </tr>
            </thead>
            <tbody>
              {SURVEY_TEMPLATES.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 700 }}>{t.name}</td>
                  <td>{t.steps.length}</td>
                  <td>{flatFields(t).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="notice" style={{ marginTop: 14 }}>
          يقبل النظام أي استبيان جديد: أضف قالبًا إلى <code>src/config/surveyTemplate.ts</code> ليظهر تلقائيًا في
          شاشة إنشاء العميل. القالب بنية فقط ولا يحتوي بيانات عملاء.
        </div>
      </Card>
    </>
  )
}
