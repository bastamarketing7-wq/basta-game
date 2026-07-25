/**
 * قارئ ZIP مبسّط يعتمد على DecompressionStream المدمج في المتصفح.
 * يُستخدم لقراءة ملفات Word و Excel لأنها في الأصل حزم ZIP،
 * بدل تثبيت مكتبة إضافية لهذه المهمة وحدها.
 */

interface ZipEntry {
  name: string
  /** 0 = مخزّن بدون ضغط، 8 = deflate */
  method: number
  data: Uint8Array
}

function u16(v: DataView, o: number) {
  return v.getUint16(o, true)
}
function u32(v: DataView, o: number) {
  return v.getUint32(o, true)
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw')
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds)
  const buf = await new Response(stream).arrayBuffer()
  return new Uint8Array(buf)
}

/** يقرأ محتويات ملف ZIP ويعيد خريطة: اسم الملف ← نصه. */
export async function readZipText(buffer: ArrayBuffer, wanted: (name: string) => boolean) {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const out = new Map<string, string>()

  // البحث عن سجل نهاية الفهرس المركزي من آخر الملف
  let eocd = -1
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 66000; i--) {
    if (u32(view, i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('ملف غير صالح')

  const count = u16(view, eocd + 10)
  let ptr = u32(view, eocd + 16)

  const entries: ZipEntry[] = []
  for (let i = 0; i < count; i++) {
    if (u32(view, ptr) !== 0x02014b50) break
    const method = u16(view, ptr + 10)
    const compSize = u32(view, ptr + 20)
    const nameLen = u16(view, ptr + 28)
    const extraLen = u16(view, ptr + 30)
    const commentLen = u16(view, ptr + 32)
    const localOffset = u32(view, ptr + 42)
    const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen))

    if (wanted(name)) {
      // قراءة الترويسة المحلية لمعرفة بداية البيانات فعليًا
      const lnLen = u16(view, localOffset + 26)
      const leLen = u16(view, localOffset + 28)
      const start = localOffset + 30 + lnLen + leLen
      entries.push({ name, method, data: bytes.subarray(start, start + compSize) })
    }
    ptr += 46 + nameLen + extraLen + commentLen
  }

  for (const e of entries) {
    const raw = e.method === 0 ? e.data : await inflateRaw(e.data)
    out.set(e.name, new TextDecoder('utf-8').decode(raw))
  }
  return out
}
