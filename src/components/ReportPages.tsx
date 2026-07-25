/**
 * صفحات التقرير السبع — طبقة عرض فقط.
 * العدد ثابت: 7 صفحات لا أكثر. الأقسام المخفية لا تضيف صفحات.
 */

import { IDENTITY, LOGO } from '../config/identity'
import type { ReportContent } from '../engine/ReportGenerator'

const NA = 'البيانات غير متوفرة حاليًا.'

function Head({ title, client }: { title: string; client: string }) {
  return (
    <div className="rhead">
      <img src={LOGO.full} alt={IDENTITY.nameAr} />
      <div className="t">
        {title}
        <br />
        {client}
      </div>
    </div>
  )
}

function Foot({ page }: { page: number }) {
  return (
    <div className="rfoot">
      <span>{IDENTITY.nameAr}</span>
      <span>{IDENTITY.tagline}</span>
      <span>{page} / 7</span>
    </div>
  )
}

function Val({ children }: { children?: string }) {
  const v = (children ?? '').trim()
  return v ? <>{v}</> : <span className="rna">{NA}</span>
}

export default function ReportPages({
  c,
  clientName,
  hidden,
}: {
  c: ReportContent
  clientName: string
  hidden: string[]
}) {
  const show = (k: string) => !hidden.includes(k)

  return (
    <div className="report">
      {/* ---------- 1: الغلاف ---------- */}
      <section className="rpage rcover">
        <div className="logo-box">
          <img src={LOGO.full} alt={`${IDENTITY.nameAr} — ${IDENTITY.tagline}`} />
        </div>
        <h1>{c.page1.reportTitle}</h1>
        <div className="meta">
          <span>
            العميل: <b>{c.page1.clientName}</b>
          </span>
          <span>القطاع: {c.page1.sector}</span>
          <span>المدينة: {c.page1.city}</span>
          <span>تاريخ الإصدار: {c.page1.issueDate}</span>
        </div>
        <div className="byline">{c.page1.byline}</div>
        <div className="rule" />
        <div className="tag">{c.page1.tagline}</div>
        <div className="contact">
          {IDENTITY.website} · {IDENTITY.email} · {IDENTITY.whatsapp}
        </div>
      </section>

      {/* ---------- 2: زبدة العميل ---------- */}
      <section className="rpage">
        <Head title="زبدة العميل" client={clientName} />
        <h2>زبدة العميل</h2>
        <p className="rlead" style={{ marginBottom: '7mm' }}>
          <Val>{c.page2.essence}</Val>
        </p>

        <div className="rgrid rgrid-2" style={{ marginBottom: '5mm' }}>
          <div className="rbox">
            <div className="lbl">الهدف الرئيسي</div>
            <div className="val">
              <Val>{c.page2.mainGoal}</Val>
            </div>
          </div>
          <div className="rbox">
            <div className="lbl">أهم تحدٍ</div>
            <div className="val">
              <Val>{c.page2.topChallenge}</Val>
            </div>
          </div>
          <div className="rbox">
            <div className="lbl">أهم فرصة</div>
            <div className="val">
              <Val>{c.page2.topOpportunity}</Val>
            </div>
          </div>
          <div className="rbox">
            <div className="lbl">مستوى الجاهزية</div>
            <div className="val">
              <Val>{c.page2.readinessLevel}</Val>
            </div>
          </div>
        </div>

        <h3>الملخص التنفيذي</h3>
        <p>
          <Val>{c.page2.executiveSummary}</Val>
        </p>
        <Foot page={2} />
      </section>

      {/* ---------- 3: صورة الظهور الرقمي ---------- */}
      <section className="rpage">
        <Head title="صورة الظهور الرقمي" client={clientName} />
        <h2>صورة الظهور الرقمي</h2>

        <div className="rscore" style={{ marginBottom: '6mm' }}>
          <div className="num">
            {c.page3.overallScore ?? '—'}
            {c.page3.overallScore !== null && <small> / 100</small>}
          </div>
          <div className="side">
            <div style={{ fontSize: 13, fontWeight: 900 }}>{c.page3.scoreLabel}</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>مستوى الثقة في النتيجة: {c.page3.confidence}</div>
          </div>
        </div>

        <div style={{ marginBottom: '5mm' }}>
          {c.page3.items.map((i) => (
            <div className="rmeter" key={i.label}>
              <span className="nm">{i.label}</span>
              <span className="st">{i.percent === null ? 'غير متوفر' : `${i.percent}٪ — ${i.statusLabel}`}</span>
              <span
                className={`track ${
                  i.percent === null
                    ? 'na'
                    : i.status === 'good'
                      ? 'good'
                      : i.status === 'needs_improvement'
                        ? 'warn'
                        : 'bad'
                }`}
              >
                <span style={{ width: `${i.percent ?? 100}%` }} />
              </span>
            </div>
          ))}
        </div>

        <div className="rgrid rgrid-3">
          <div className="rbox">
            <div className="lbl">المنصة الأقوى</div>
            <div className="val">
              <Val>{c.page3.strongest}</Val>
            </div>
          </div>
          <div className="rbox">
            <div className="lbl">المنصة الأضعف</div>
            <div className="val">
              <Val>{c.page3.weakest}</Val>
            </div>
          </div>
          <div className="rbox">
            <div className="lbl">الأولى بالمعالجة</div>
            <div className="val">
              <Val>{c.page3.priority}</Val>
            </div>
          </div>
        </div>

        <p style={{ marginTop: '5mm', fontSize: 11.5, color: 'var(--muted)' }}>
          <Val>{c.page3.note}</Val>
        </p>
        <Foot page={3} />
      </section>

      {/* ---------- 4: تحليل المنصات ---------- */}
      <section className="rpage">
        <Head title="تحليل المنصات" client={clientName} />
        <h2>تحليل المنصات</h2>
        {c.page4.cards.length ? (
          <div className="rgrid rgrid-2">
            {c.page4.cards.slice(0, 6).map((card) => (
              <div className="rcard" key={card.platform}>
                <h4>{card.platform}</h4>
                <div className="row">
                  <b>الوضع الحالي: </b>
                  {card.currentState}
                </div>
                <div className="row">
                  <b>أقوى نقطة: </b>
                  {card.strongestPoint}
                </div>
                <div className="row">
                  <b>أهم فجوة: </b>
                  {card.biggestGap}
                </div>
                <div className="row">
                  <b>الإجراء المقترح: </b>
                  {card.proposedAction}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rna">{c.page4.note ?? NA}</p>
        )}
        {c.page4.cards.length > 6 && (
          <p style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: '4mm' }}>
            عُرضت أبرز ست منصات. بقية المنصات متاحة في شاشة المراجعة داخل النظام.
          </p>
        )}
        <Foot page={4} />
      </section>

      {/* ---------- 5: قراءة تجربة العميل ---------- */}
      <section className="rpage">
        <Head title="قراءة تجربة العميل" client={clientName} />
        <h2>قراءة تجربة العميل</h2>

        <div className="rbox" style={{ marginBottom: '5mm' }}>
          <div className="lbl">مصدر القراءة</div>
          <div className="val">
            {c.page5.readingSource} — <b>{c.page5.readingKind}</b> — مستوى الثقة: {c.page5.confidence}
          </div>
        </div>

        <div className="rgrid rgrid-2">
          <div>
            <h3>عناصر الرضا</h3>
            {c.page5.satisfaction.length ? (
              <ul className="rlist">
                {c.page5.satisfaction.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="rna">{NA}</p>
            )}
          </div>
          <div>
            <h3>الاحتكاكات</h3>
            {c.page5.frictions.length ? (
              <ul className="rlist">
                {c.page5.frictions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="rna">{NA}</p>
            )}
          </div>
          <div>
            <h3>ملاحظات متكررة</h3>
            {c.page5.complaints.length ? (
              <ul className="rlist">
                {c.page5.complaints.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="rna">{NA}</p>
            )}
          </div>
          <div>
            <h3>نقاط فقد العملاء</h3>
            {c.page5.lossPoints.length ? (
              <ul className="rlist">
                {c.page5.lossPoints.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="rna">{NA}</p>
            )}
          </div>
        </div>
        <Foot page={5} />
      </section>

      {/* ---------- 6: الأولويات والتوصيات ---------- */}
      <section className="rpage">
        <Head title="الأولويات والتوصيات" client={clientName} />
        <h2>الأولويات والتوصيات</h2>

        <div className="rgrid rgrid-3" style={{ marginBottom: '5mm' }}>
          <div className="rbox">
            <div className="lbl">أبرز نقاط القوة</div>
            {c.page6.strengths.length ? (
              <ul className="rlist">
                {c.page6.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="rna">{NA}</p>
            )}
          </div>
          <div className="rbox">
            <div className="lbl">أبرز نقاط الضعف</div>
            {c.page6.weaknesses.length ? (
              <ul className="rlist">
                {c.page6.weaknesses.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="rna">{NA}</p>
            )}
          </div>
          <div className="rbox">
            <div className="lbl">أبرز الفرص</div>
            {c.page6.opportunities.length ? (
              <ul className="rlist">
                {c.page6.opportunities.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="rna">{NA}</p>
            )}
          </div>
        </div>

        <div className="rgrid rgrid-3">
          {(
            [
              ['خطة 7 أيام', c.page6.days7],
              ['خطة 30 يومًا', c.page6.days30],
              ['خطة 90 يومًا', c.page6.days90],
            ] as const
          ).map(([title, list]) => (
            <div className="rplan" key={title}>
              <div className="hd">{title}</div>
              {list.length ? (
                <ol>
                  {list.map((r, i) => (
                    <li key={i}>
                      {r.what} <span className="rtag">{r.priority}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rna">{NA}</p>
              )}
            </div>
          ))}
        </div>
        <Foot page={6} />
      </section>

      {/* ---------- 7: الترشيح والخاتمة ---------- */}
      <section className="rpage">
        <Head title="الترشيح والخطوة التالية" client={clientName} />
        <h2>الترشيح والخطوة التالية</h2>

        <h3>المنهج المقترح</h3>
        <p style={{ marginBottom: '6mm' }}>
          <Val>{c.page7.approach}</Val>
        </p>

        {show('package') && (
          <>
            <h3>الباقة المناسبة</h3>
            {c.page7.packageAvailable ? (
              <div className="rbox" style={{ marginBottom: '6mm' }}>
                <div className="lbl">{c.page7.packageName}</div>
                <div className="val">{c.page7.packageWhy}</div>
                {c.page7.packageDetails?.length ? (
                  <ul className="rlist" style={{ marginTop: '3mm' }}>
                    {c.page7.packageDetails.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                ) : null}
                {c.page7.alternative && (
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: '3mm' }}>
                    خيار بديل: {c.page7.alternative}
                  </p>
                )}
              </div>
            ) : (
              <p className="rlead" style={{ marginBottom: '6mm' }}>
                {c.page7.packageMessage}
              </p>
            )}
          </>
        )}

        <h3>الخطوة التالية</h3>
        <p style={{ marginBottom: '6mm' }}>
          <Val>{c.page7.nextStep}</Val>
        </p>

        <div className="rfinal" style={{ marginTop: 'auto' }}>
          <img src={LOGO.badge} alt={IDENTITY.nameAr} style={{ height: 56 }} />
          <div className="tagline">{c.page7.tagline}</div>
          <div className="rcontact">
            <span>{IDENTITY.website}</span>
            <span>{IDENTITY.email}</span>
            <span dir="ltr">{IDENTITY.whatsapp}</span>
            <span>{IDENTITY.locationLabel}</span>
          </div>
        </div>
        <Foot page={7} />
      </section>
    </div>
  )
}
