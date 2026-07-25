/** شاشة إنشاء العميل — بيانات النشاط، الاستبيان، الروابط، الملفات، ملاحظات الفريق. */

import { useMemo, useRef, useState } from 'react'
import type { Route } from '../App'
import { SURVEY_TEMPLATES, flatFields, getTemplate } from '../config/surveyTemplate'
import { isValidUrl } from '../engine/DigitalPresenceCollector'
import { parseQuestionnaire } from '../engine/QuestionnaireParser'
import { PLATFORM_LABEL, type PlatformId } from '../engine/types'
import { FILE_KIND_LABEL, type ClientRecord, type FileKind, type StoredFile } from '../lib/clientTypes'
import { extractText, readImageDataUrl } from '../lib/parsers'
import { emptyClient, getClient, newId, saveClient } from '../lib/storage'
import { Card, Field, Select, TextArea } from '../components/ui'

const LINK_FIELDS: Array<{ key: PlatformId | 'extra'; label: string }> = [
  { key: 'website', label: PLATFORM_LABEL.website },
  { key: 'google', label: PLATFORM_LABEL.google },
  { key: 'instagram', label: PLATFORM_LABEL.instagram },
  { key: 'tiktok', label: PLATFORM_LABEL.tiktok },
  { key: 'snapchat', label: PLATFORM_LABEL.snapchat },
  { key: 'x', label: PLATFORM_LABEL.x },
  { key: 'linkedin', label: PLATFORM_LABEL.linkedin },
  { key: 'store', label: PLATFORM_LABEL.store },
  { key: 'extra', label: 'منصات إضافية' },
]

const FILE_KINDS: FileKind[] = [
  'survey',
  'instagram_insights',
  'tiktok_analytics',
  'google_business',
  'google_analytics',
  'search_console',
  'screenshot_chat',
  'screenshot_order',
  'other',
]

export default function ClientFormScreen({ id, go }: { id?: string; go: (r: Route) => void }) {
  const [client, setClient] = useState<ClientRecord>(() => (id ? (getClient(id) ?? emptyClient()) : emptyClient()))
  const [saved, setSaved] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [parseMsg, setParseMsg] = useState<string>('')
  const [manualOpen, setManualOpen] = useState(false)
  const [dragOver, setDragOver] = useState<string>('')
  const [uploadKind, setUploadKind] = useState<FileKind>('survey')
  const fileInput = useRef<HTMLInputElement>(null)

  const template = getTemplate(client.survey.templateId)
  const fields = useMemo(() => flatFields(template), [template])

  const patch = (p: Partial<ClientRecord>) => setClient((c) => ({ ...c, ...p }))
  const patchProfile = (k: keyof ClientRecord['profile'], v: string) =>
    setClient((c) => ({ ...c, profile: { ...c.profile, [k]: v } }))
  const patchNotes = (k: keyof ClientRecord['notes'], v: string) =>
    setClient((c) => ({ ...c, notes: { ...c.notes, [k]: v } }))

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (!client.profile.businessName.trim()) e.businessName = 'اسم النشاط مطلوب.'
    if (client.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.profile.email))
      e.email = 'صيغة البريد غير صحيحة.'
    for (const f of LINK_FIELDS) {
      const v = (client.links[f.key as PlatformId] ?? '').trim()
      if (v && !isValidUrl(v)) e[`link_${f.key}`] = 'صيغة الرابط غير صحيحة.'
    }
    return e
  }, [client])

  const canAnalyze =
    !Object.keys(errors).length &&
    client.profile.businessName.trim() !== '' &&
    (client.survey.rawText.trim() !== '' ||
      Object.values(client.survey.answers).some((v) => v.trim()) ||
      Object.values(client.links).some((v) => (v ?? '').trim()))

  /* ---------------- الاستبيان ---------------- */

  const runExtract = (text: string) => {
    if (!text.trim()) {
      setParseMsg('')
      return
    }
    const r = parseQuestionnaire(text, client.survey.templateId)
    const sources: Record<string, 'extracted' | 'manual'> = { ...client.survey.answerSources }
    for (const k of Object.keys(r.answers)) if (sources[k] !== 'manual') sources[k] = 'extracted'
    // الحفاظ على القيم المدخلة يدويًا
    const merged = { ...r.answers }
    for (const [k, v] of Object.entries(client.survey.answers)) {
      if (client.survey.answerSources[k] === 'manual' && v.trim()) merged[k] = v
    }
    setClient((c) => ({ ...c, survey: { ...c.survey, rawText: text, answers: merged, answerSources: sources } }))
    setParseMsg(`استُخرج ${r.matched.length} حقلًا من أصل ${fields.length}. الحقول غير المعبأة تبقى بلا قيمة ولا تُخمَّن.`)
  }

  /* ---------------- الملفات ---------------- */

  const addFiles = async (list: FileList | File[], kind: FileKind) => {
    setBusy(true)
    const added: StoredFile[] = []
    let surveyText = ''
    for (const file of Array.from(list)) {
      if (file.size > 12 * 1024 * 1024) {
        alert(`الملف ${file.name} أكبر من 12 ميجابايت ولم يُضف.`)
        continue
      }
      const dataUrl = await readImageDataUrl(file)
      let extractedText: string | undefined
      if (!dataUrl) {
        const res = await extractText(file)
        if (res.ok) {
          extractedText = res.text
          if (kind === 'survey') surveyText = res.text
        } else if (kind === 'survey') {
          setParseMsg(res.reason)
        }
      }
      added.push({
        id: newId(),
        name: file.name,
        size: file.size,
        kind,
        extractedText,
        dataUrl,
        addedAt: new Date().toISOString(),
      })
    }
    setClient((c) => ({ ...c, files: [...c.files, ...added] }))
    if (surveyText) runExtract(surveyText)
    setBusy(false)
  }

  const onDrop = (e: React.DragEvent, kind: FileKind) => {
    e.preventDefault()
    setDragOver('')
    if (e.dataTransfer.files?.length) void addFiles(e.dataTransfer.files, kind)
  }

  /* ---------------- الحفظ ---------------- */

  const save = (): ClientRecord => {
    const s = saveClient(client)
    setClient(s)
    setSaved(`حُفظت البيانات ${new Date().toLocaleTimeString('ar-SA')}`)
    setTimeout(() => setSaved(''), 3500)
    return s
  }

  const startAnalysis = () => {
    const s = saveClient({ ...client, status: 'analyzing' })
    go({ name: 'analyze', id: s.id })
  }

  const manualCount = Object.values(client.survey.answers).filter((v) => v.trim()).length

  return (
    <>
      <div className="page-head">
        <h1>{id ? 'ملف العميل' : 'تسجيل عميل جديد'}</h1>
        <p>عبّئ البيانات ثم اضغط «بدء التشخيص». الحقول غير المتوفرة تبقى فارغة ولا يُفترض لها قيمة.</p>
      </div>

      {/* 1) بيانات العميل */}
      <Card title="بيانات العميل">
        <div className="grid grid-3">
          <Field
            label="اسم النشاط"
            value={client.profile.businessName}
            onChange={(v) => patchProfile('businessName', v)}
            required
            error={errors.businessName}
          />
          <Field label="اسم المسؤول" value={client.profile.ownerName} onChange={(v) => patchProfile('ownerName', v)} />
          <Field label="القطاع" value={client.profile.sector} onChange={(v) => patchProfile('sector', v)} />
          <Field label="المدينة" value={client.profile.city} onChange={(v) => patchProfile('city', v)} />
          <Field label="رقم التواصل" value={client.profile.phone} onChange={(v) => patchProfile('phone', v)} ltr />
          <Field
            label="البريد"
            type="email"
            value={client.profile.email}
            onChange={(v) => patchProfile('email', v)}
            error={errors.email}
            ltr
          />
          <Field
            label="مدة النشاط"
            value={client.profile.businessAge}
            onChange={(v) => patchProfile('businessAge', v)}
          />
          <Field label="عدد الفروع" value={client.profile.branches} onChange={(v) => patchProfile('branches', v)} />
        </div>
        <div style={{ marginTop: 16 }} className="grid grid-2">
          <TextArea
            label="وصف مختصر للنشاط"
            value={client.profile.description}
            onChange={(v) => patchProfile('description', v)}
          />
          <TextArea
            label="الهدف من طلب التشخيص"
            value={client.profile.diagnosisPurpose}
            onChange={(v) => patchProfile('diagnosisPurpose', v)}
          />
        </div>
      </Card>

      {/* 2) الاستبيان */}
      <Card title="الاستبيان">
        <div className="grid grid-2" style={{ marginBottom: 14 }}>
          <Select
            label="قالب الاستبيان"
            value={client.survey.templateId}
            onChange={(v) => patch({ survey: { ...client.survey, templateId: v } })}
            options={SURVEY_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
            hint="يمكن إضافة قوالب جديدة من ملف الإعدادات دون تعديل النظام."
          />
        </div>

        <div
          className={`drop ${dragOver === 'survey' ? 'over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver('survey')
          }}
          onDragLeave={() => setDragOver('')}
          onDrop={(e) => onDrop(e, 'survey')}
          onClick={() => {
            setUploadKind('survey')
            fileInput.current?.click()
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setUploadKind('survey')
              fileInput.current?.click()
            }
          }}
        >
          اسحب ملف الاستبيان هنا أو اضغط للاختيار — PDF أو Word أو Excel أو CSV
        </div>

        <div style={{ marginTop: 14 }}>
          <TextArea
            label="أو الصق نص الاستبيان مباشرة"
            value={client.survey.rawText}
            onChange={(v) => patch({ survey: { ...client.survey, rawText: v } })}
            rows={6}
            placeholder="الصق نص الاستبيان هنا ثم اضغط استخراج الإجابات"
          />
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => runExtract(client.survey.rawText)} disabled={!client.survey.rawText.trim()}>
              استخراج الإجابات
            </button>
            <button className="btn" onClick={() => setManualOpen((o) => !o)}>
              {manualOpen ? 'إخفاء الإدخال اليدوي' : `الإدخال اليدوي (${manualCount}/${fields.length})`}
            </button>
          </div>
          {parseMsg && (
            <div className="notice accent" style={{ marginTop: 12 }}>
              {parseMsg}
            </div>
          )}
        </div>

        {manualOpen && (
          <div style={{ marginTop: 18 }}>
            {template.steps.map((step) => (
              <div key={step.id} style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 14, marginBottom: 10 }}>{step.title}</h3>
                <div className="grid grid-2">
                  {step.fields.map((f) => (
                    <Field
                      key={f.key}
                      label={f.label}
                      value={client.survey.answers[f.key] ?? ''}
                      onChange={(v) =>
                        setClient((c) => ({
                          ...c,
                          survey: {
                            ...c.survey,
                            answers: { ...c.survey.answers, [f.key]: v },
                            answerSources: { ...c.survey.answerSources, [f.key]: 'manual' },
                          },
                        }))
                      }
                      hint={client.survey.answerSources[f.key] === 'extracted' ? 'مستخرج آليًا' : undefined}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3) الروابط */}
      <Card title="الروابط الرقمية">
        <div className="grid grid-3">
          {LINK_FIELDS.map((l) => (
            <Field
              key={l.key}
              label={l.label}
              value={(client.links[l.key as PlatformId] ?? '') as string}
              onChange={(v) => patch({ links: { ...client.links, [l.key]: v } })}
              placeholder="https://"
              error={errors[`link_${l.key}`]}
              ltr
            />
          ))}
        </div>
        <div className="notice" style={{ marginTop: 14 }}>
          أدوات التصفح غير مفعّلة في هذه النسخة. الروابط تُحفظ للتوثيق، ويُعتمد في التحليل على الملفات المرفوعة
          والرصد اليدوي في شاشة المراجعة.
        </div>
      </Card>

      {/* 4) الملفات الداعمة */}
      <Card title="الملفات الداعمة">
        <div className="grid grid-2" style={{ marginBottom: 14 }}>
          <Select
            label="نوع الملف المرفوع"
            value={uploadKind}
            onChange={(v) => setUploadKind(v as FileKind)}
            options={FILE_KINDS.map((k) => ({ value: k, label: FILE_KIND_LABEL[k] }))}
          />
        </div>
        <div
          className={`drop ${dragOver === 'support' ? 'over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver('support')
          }}
          onDragLeave={() => setDragOver('')}
          onDrop={(e) => onDrop(e, uploadKind)}
          onClick={() => fileInput.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInput.current?.click()}
        >
          اسحب الملفات أو لقطات الشاشة هنا — تُصنَّف كـ «{FILE_KIND_LABEL[uploadKind]}»
        </div>

        {client.files.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {client.files.map((f) => (
              <div className="file-row" key={f.id}>
                <span className="badge badge-blue">{FILE_KIND_LABEL[f.kind]}</span>
                <span className="name">{f.name}</span>
                <span className="muted">{(f.size / 1024).toFixed(0)} كب</span>
                {f.extractedText && <span className="badge badge-good">نص مستخرج</span>}
                {f.dataUrl && <span className="badge">صورة</span>}
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => patch({ files: client.files.filter((x) => x.id !== f.id) })}
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInput}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) void addFiles(e.target.files, uploadKind)
            e.target.value = ''
          }}
        />
      </Card>

      {/* 5) ملاحظات الفريق */}
      <Card title="ملاحظات فريق بسطة">
        <div className="grid grid-2">
          <TextArea label="ملاحظات عامة" value={client.notes.general} onChange={(v) => patchNotes('general', v)} />
          <TextArea
            label="ملاحظات التواصل"
            value={client.notes.communication}
            onChange={(v) => patchNotes('communication', v)}
          />
          <TextArea label="ملاحظات الزيارة" value={client.notes.visit} onChange={(v) => patchNotes('visit', v)} />
          <TextArea
            label="ملاحظات المتسوق السري"
            value={client.notes.mysteryShopper}
            onChange={(v) => patchNotes('mysteryShopper', v)}
            hint="تُعتمد فقط عند توثيق زيارة أو اتصال أو طلب فعلي. بدونها تبقى القراءة رقمية."
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <TextArea
            label="معلومات لا تظهر على المنصات العامة"
            value={client.notes.offPlatform}
            onChange={(v) => patchNotes('offPlatform', v)}
          />
        </div>
      </Card>

      {/* الإجراءات */}
      <div
        className="card"
        style={{ position: 'sticky', bottom: 16, marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
      >
        <button className="btn" onClick={save} disabled={busy}>
          حفظ المسودة
        </button>
        <button className="btn btn-primary" onClick={startAnalysis} disabled={!canAnalyze || busy}>
          بدء التشخيص
        </button>
        {client.analysis && (
          <button className="btn" onClick={() => go({ name: 'review', id: client.id })}>
            فتح المراجعة
          </button>
        )}
        {saved && <span className="badge badge-good">{saved}</span>}
        {busy && <span className="badge badge-blue">جارٍ معالجة الملفات…</span>}
        {!canAnalyze && (
          <span className="muted" style={{ fontSize: 13 }}>
            يلزم اسم النشاط ومصدر واحد على الأقل: استبيان أو رابط.
          </span>
        )}
      </div>
    </>
  )
}
