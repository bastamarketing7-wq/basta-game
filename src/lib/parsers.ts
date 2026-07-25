/**
 * استخراج النص من ملفات الاستبيان المرفوعة.
 * المدعوم: PDF، Word، Excel، CSV، نص عادي.
 * لا يُستنتج أي شيء هنا — الاستخراج فقط.
 */

import { readZipText } from './zip'

export type ParseOutcome =
  | { ok: true; text: string }
  | { ok: false; reason: string }

/** إزالة الوسوم من XML وإرجاع النص. */
function xmlToText(xml: string, blockTags: string[]): string {
  let s = xml
  for (const t of blockTags) {
    s = s.replace(new RegExp(`</${t}>`, 'g'), '\n')
  }
  s = s.replace(/<[^>]+>/g, '')
  s = s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
}

async function parsePdf(file: File): Promise<ParseOutcome> {
  try {
    const pdfjs = await import('pdfjs-dist')
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const parts: string[] = []
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      // تجميع العناصر في أسطر بحسب موضعها الرأسي للحفاظ على ترتيب الحقول
      const rows = new Map<number, Array<{ x: number; s: string }>>()
      for (const item of content.items as Array<{ str: string; transform: number[] }>) {
        if (!item.str?.trim()) continue
        const y = Math.round(item.transform[5])
        const x = item.transform[4]
        if (!rows.has(y)) rows.set(y, [])
        rows.get(y)!.push({ x, s: item.str })
      }
      const lines = [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        // النص عربي RTL: العناصر ذات الإحداثي الأكبر تأتي أولًا
        .map(([, items]) => items.sort((a, b) => b.x - a.x).map((i) => i.s).join(' ').trim())
        .filter(Boolean)
      parts.push(lines.join('\n'))
    }
    const text = parts.join('\n')
    if (!text.trim()) {
      return { ok: false, reason: 'الملف لا يحتوي على نص قابل للاستخراج. قد يكون صورة ممسوحة ضوئيًا — الرجاء لصق النص يدويًا.' }
    }
    return { ok: true, text }
  } catch {
    return { ok: false, reason: 'تعذر قراءة ملف PDF. الرجاء لصق النص يدويًا.' }
  }
}

async function parseDocx(file: File): Promise<ParseOutcome> {
  try {
    const buf = await file.arrayBuffer()
    const files = await readZipText(buf, (n) => n === 'word/document.xml')
    const xml = files.get('word/document.xml')
    if (!xml) return { ok: false, reason: 'تعذر قراءة محتوى ملف Word.' }
    const text = xmlToText(xml, ['w:p', 'w:tr'])
    if (!text.trim()) {
      return { ok: false, reason: 'ملف Word لا يحتوي على نص. قد يكون محتواه صورًا — الرجاء لصق النص يدويًا.' }
    }
    return { ok: true, text }
  } catch {
    return { ok: false, reason: 'تعذر قراءة ملف Word. الرجاء لصق النص يدويًا.' }
  }
}

async function parseXlsx(file: File): Promise<ParseOutcome> {
  try {
    const buf = await file.arrayBuffer()
    const files = await readZipText(
      buf,
      (n) => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n),
    )
    // جدول النصوص المشتركة
    const sharedXml = files.get('xl/sharedStrings.xml') ?? ''
    const shared: string[] = []
    for (const m of sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      shared.push(xmlToText(m[1], []).replace(/\n/g, ' ').trim())
    }

    const lines: string[] = []
    const sheetNames = [...files.keys()].filter((n) => n.startsWith('xl/worksheets/')).sort()
    for (const name of sheetNames) {
      const xml = files.get(name)!
      for (const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
        const cells: string[] = []
        for (const c of row[1].matchAll(/<c[^>]*?(?:\st="([^"]*)")?[^>]*>([\s\S]*?)<\/c>/g)) {
          const type = c[1]
          const vm = c[2].match(/<v>([\s\S]*?)<\/v>/)
          const inline = c[2].match(/<is>([\s\S]*?)<\/is>/)
          let val = ''
          if (inline) val = xmlToText(inline[1], []).replace(/\n/g, ' ')
          else if (vm) val = type === 's' ? (shared[Number(vm[1])] ?? '') : vm[1]
          cells.push(val.trim())
        }
        const line = cells.filter(Boolean).join(' : ')
        if (line) lines.push(line)
      }
    }
    if (!lines.length) return { ok: false, reason: 'ملف Excel لا يحتوي على بيانات قابلة للقراءة.' }
    return { ok: true, text: lines.join('\n') }
  } catch {
    return { ok: false, reason: 'تعذر قراءة ملف Excel. الرجاء رفعه بصيغة CSV أو لصق النص يدويًا.' }
  }
}

function parseCsvText(raw: string): string {
  return raw
    .split(/\r?\n/)
    .map((line) => line.split(/[,;\t]/).map((c) => c.replace(/^"|"$/g, '').trim()).filter(Boolean).join(' : '))
    .filter(Boolean)
    .join('\n')
}

/** نقطة الدخول: يحدد الصيغة ويستخرج النص. */
export async function extractText(file: File): Promise<ParseOutcome> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return parsePdf(file)
  if (name.endsWith('.docx')) return parseDocx(file)
  if (name.endsWith('.doc')) {
    return { ok: false, reason: 'صيغة doc القديمة غير مدعومة. الرجاء حفظ الملف بصيغة docx أو PDF.' }
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xlsm')) return parseXlsx(file)
  if (name.endsWith('.csv') || name.endsWith('.tsv')) {
    return { ok: true, text: parseCsvText(await file.text()) }
  }
  if (name.endsWith('.txt') || name.endsWith('.md')) {
    return { ok: true, text: await file.text() }
  }
  return { ok: false, reason: 'صيغة غير مدعومة للاستخراج النصي. سيُحفظ الملف كمرفق فقط.' }
}

/** قراءة صورة كـ dataURL لعرض اللقطات. */
export function readImageDataUrl(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return Promise.resolve(undefined)
  return new Promise((resolve) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => resolve(undefined)
    r.readAsDataURL(file)
  })
}
