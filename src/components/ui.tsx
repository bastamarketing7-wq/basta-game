/** مكوّنات واجهة مشتركة — بسيطة وقابلة لإعادة الاستخدام. */

import type { ReactNode } from 'react'
import { CLASSIFICATION_LABEL, type Finding } from '../engine/types'
import { CONFIDENCE_LABEL } from '../config/evaluationCriteria'
import { LOGO, IDENTITY } from '../config/identity'

export function Card({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="card">
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h2 className="card-title">{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  required,
  error,
  ltr,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  hint?: string
  required?: boolean
  error?: string
  ltr?: boolean
}) {
  const id = `f_${label.replace(/\s/g, '_')}`
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {required && <span className="req">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        dir={ltr ? 'ltr' : undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error ? <span className="err">{error}</span> : hint ? <span className="hint">{hint}</span> : null}
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  rows?: number
}) {
  const id = `t_${label.replace(/\s/g, '_')}`
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function Select({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  hint?: string
}) {
  const id = `s_${label.replace(/\s/g, '_')}`
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="hint">{hint}</span>}
    </div>
  )
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

/** عرض استنتاج مع تصنيفه ومصدره ودليله. */
export function FindingRow({ f, showEvidence = true }: { f: Finding; showEvidence?: boolean }) {
  const cls =
    f.classification === 'confirmed'
      ? 'badge-good'
      : f.classification === 'observation'
        ? 'badge-blue'
        : f.classification === 'analytical'
          ? 'badge-warn'
          : 'badge'
  return (
    <div className="finding">
      <div className="txt">{f.text}</div>
      <div className="meta">
        <span className={`badge ${cls}`}>{CLASSIFICATION_LABEL[f.classification]}</span>
        <span className="badge">المصدر: {f.source.label}</span>
        <span className="badge">الثقة: {CONFIDENCE_LABEL[f.confidence]}</span>
        {!f.visibleToClient && <span className="badge badge-warn">مراجعة داخلية فقط</span>}
      </div>
      {showEvidence && f.evidence && <div className="ev">الدليل: {f.evidence}</div>}
    </div>
  )
}

export function FindingList({ items, empty }: { items: Finding[]; empty: string }) {
  if (!items.length) return <p className="muted" style={{ fontSize: 13 }}>{empty}</p>
  return (
    <div>
      {items.map((f) => (
        <FindingRow key={f.id} f={f} />
      ))}
    </div>
  )
}

/** شعار بسطة الرسمي — يُستخدم كما هو دون تعديل. */
export function BrandLogo({ height = 40 }: { height?: number }) {
  return <img src={LOGO.full} alt={`${IDENTITY.nameAr} — ${IDENTITY.tagline}`} style={{ height }} />
}

export function Bar({ percent, status }: { percent: number | null; status?: string }) {
  const cls = status === 'good' ? 'good' : status === 'needs_improvement' ? 'warn' : status === 'weak' ? 'bad' : ''
  return (
    <div className={`bar ${cls}`}>
      <span style={{ width: `${percent ?? 0}%` }} />
    </div>
  )
}
