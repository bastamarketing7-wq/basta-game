/**
 * هوية بسطة للتسويق — ملف الإعداد الرسمي.
 * القيم مأخوذة من ملفات الهوية المرفقة في المشروع.
 * لا تُعدّل الألوان أو الشعار أو بيانات التواصل إلا بطلب رسمي.
 */

export const IDENTITY = {
  nameAr: 'بسطة للتسويق',
  nameEn: 'BASTA Marketing',
  tagline: 'نصنع التجربة ويستمر الأثر',
  website: 'bastamarketing.sa',
  email: 'info@bastamarketing.sa',
  username: 'basta_marketing',
  googleBusiness: 'وكالة بسطة',
  whatsapp: '966 59 949 0740',
  locationLabel: 'تبوك — المملكة العربية السعودية',
  regions: ['تبوك', 'منطقة تبوك', 'المنطقة الشمالية'],
} as const

/**
 * الشعار الرسمي.
 * الأصل محفوظ كما هو في src/assets/brand ولم يُعدّل ولم يُعد رسمه.
 * النسخ المستخدمة في الواجهة مشتقة بقص المساحة البيضاء المحيطة فقط،
 * دون أي تغيير في الرسم أو الألوان أو نسب الشعار.
 */
import logoFull from '../assets/brand/logo-full-trimmed.png'
import logoBadge from '../assets/brand/logo-badge-trimmed.png'
import logoFullOriginal from '../assets/brand/logo-full.jpeg'

export const LOGO = {
  /** الشعار الكامل بخلفية بيضاء مع الشعار النصي أسفله — يُستخدم في التقارير */
  full: logoFull,
  /** الرمز الدائري الرسمي */
  badge: logoBadge,
  /** الملف الأصلي دون أي تعديل — مرجع الهوية */
  fullOriginal: logoFullOriginal,
} as const

/** الألوان الرسمية المستخرجة من ملفات الهوية. */
export const COLORS = {
  blue: '#0246FF',
  orange: '#FF7F40',
  white: '#FFFFFF',
  ink: '#0B1220',
  muted: '#5B6472',
  line: '#E6E9EF',
  surface: '#F7F8FA',
  good: '#12855A',
  warn: '#B7791F',
  bad: '#C0392B',
} as const

/** عنوان النظام الداخلي. */
export const APP = {
  nameAr: 'محرك التشخيص',
  nameEn: 'BASTA Diagnosis Engine',
  reportTitle: 'تقرير تشخيص وتحليل النشاط',
  reportFooterNote: 'إعداد وكالة بسطة للتسويق',
} as const
