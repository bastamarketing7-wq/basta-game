/**
 * بنود التحقق لكل منصة — ملف إعداد قابل للتعديل.
 * الموظف يرصد ما يظهر فعلًا؛ البند الفارغ يبقى «غير متوفر» ولا يُمنح درجة.
 * criterion = البند المرتبط في نموذج التقييم من 100.
 */

import type { PlatformId } from '../engine/types'

export interface PlatformCheck {
  key: string
  label: string
  criterion: string
}

export const PLATFORM_CHECKS: Record<PlatformId, PlatformCheck[]> = {
  google: [
    { key: 'nameCategory', label: 'صحة اسم النشاط والتصنيف', criterion: 'completeness' },
    { key: 'infoComplete', label: 'اكتمال معلومات النشاط', criterion: 'completeness' },
    { key: 'address', label: 'العنوان والموقع', criterion: 'completeness' },
    { key: 'phone', label: 'رقم الهاتف', criterion: 'completeness' },
    { key: 'hours', label: 'ساعات العمل', criterion: 'completeness' },
    { key: 'websiteLink', label: 'رابط الموقع', criterion: 'completeness' },
    { key: 'description', label: 'وصف النشاط', criterion: 'identity' },
    { key: 'photos', label: 'جودة الصور وحداثتها', criterion: 'contentQuality' },
    { key: 'products', label: 'المنتجات أو الخدمات', criterion: 'identity' },
    { key: 'posts', label: 'المنشورات والتحديثات', criterion: 'consistency' },
    { key: 'reviewsCount', label: 'عدد التقييمات', criterion: 'reputation' },
    { key: 'rating', label: 'متوسط التقييم', criterion: 'reputation' },
    { key: 'reviewsRecency', label: 'حداثة التقييمات', criterion: 'reputation' },
    { key: 'ownerReplies', label: 'ردود الإدارة على التقييمات', criterion: 'reputation' },
    { key: 'responseTime', label: 'زمن الاستجابة الظاهر', criterion: 'conversion' },
    { key: 'complaints', label: 'الشكاوى المتكررة', criterion: 'reputation' },
    { key: 'praise', label: 'عناصر الثناء المتكررة', criterion: 'reputation' },
    { key: 'reviewKeywords', label: 'كلمات متكررة في التقييمات', criterion: 'reputation' },
    { key: 'brandSearch', label: 'الظهور عند البحث بالاسم', criterion: 'searchability' },
    { key: 'localSearch', label: 'الظهور في مصطلحات الخدمة المحلية', criterion: 'searchability' },
  ],
  instagram: [
    { key: 'username', label: 'سهولة اسم المستخدم وإيجاده', criterion: 'completeness' },
    { key: 'avatar', label: 'صورة الحساب', criterion: 'identity' },
    { key: 'displayName', label: 'الاسم الظاهر', criterion: 'completeness' },
    { key: 'bio', label: 'النبذة التعريفية', criterion: 'identity' },
    { key: 'contactLink', label: 'رابط التواصل', criterion: 'conversion' },
    { key: 'cta', label: 'وضوح دعوة التواصل', criterion: 'conversion' },
    { key: 'highlights', label: 'الأبرز Highlights', criterion: 'identity' },
    { key: 'visualIdentity', label: 'الهوية البصرية', criterion: 'identity' },
    { key: 'offeringClarity', label: 'وضوح المنتجات والخدمات', criterion: 'identity' },
    { key: 'postingRegularity', label: 'انتظام النشر', criterion: 'consistency' },
    { key: 'contentVariety', label: 'تنوع المحتوى', criterion: 'contentQuality' },
    { key: 'designQuality', label: 'جودة التصميم', criterion: 'contentQuality' },
    { key: 'imageQuality', label: 'جودة الصور', criterion: 'contentQuality' },
    { key: 'captions', label: 'قوة العناوين والنصوص', criterion: 'contentQuality' },
    { key: 'reels', label: 'استخدام الريلز', criterion: 'contentQuality' },
    { key: 'visibleViews', label: 'المشاهدات الظاهرة', criterion: 'engagement' },
    { key: 'likesComments', label: 'الإعجابات والتعليقات الظاهرة', criterion: 'engagement' },
    { key: 'commentQuality', label: 'جودة التعليقات', criterion: 'engagement' },
    { key: 'replies', label: 'الرد على التعليقات', criterion: 'engagement' },
    { key: 'contentTypes', label: 'محتوى تعليمي أو تسويقي أو توثيقي', criterion: 'contentQuality' },
    { key: 'geoUsage', label: 'استخدام الموقع الجغرافي', criterion: 'searchability' },
    { key: 'keywords', label: 'الكلمات المفتاحية في الاسم والنبذة', criterion: 'searchability' },
    { key: 'localFit', label: 'ملاءمة المحتوى للجمهور المحلي', criterion: 'contentQuality' },
  ],
  tiktok: [
    { key: 'profileClarity', label: 'وضوح الملف الشخصي', criterion: 'completeness' },
    { key: 'bioLink', label: 'النبذة والرابط', criterion: 'conversion' },
    { key: 'identity', label: 'الهوية', criterion: 'identity' },
    { key: 'contentType', label: 'نوع المحتوى', criterion: 'contentQuality' },
    { key: 'firstSeconds', label: 'قوة أول ثانيتين', criterion: 'contentQuality' },
    { key: 'hook', label: 'جودة الخطاف', criterion: 'contentQuality' },
    { key: 'pace', label: 'سرعة الإيقاع', criterion: 'contentQuality' },
    { key: 'continuity', label: 'الاستمرارية', criterion: 'consistency' },
    { key: 'visibleViews', label: 'المشاهدات الظاهرة', criterion: 'engagement' },
    { key: 'visibleEngagement', label: 'التفاعل الظاهر', criterion: 'engagement' },
    { key: 'comments', label: 'التعليقات', criterion: 'engagement' },
    { key: 'topContent', label: 'المحتوى الأعلى أداءً', criterion: 'contentQuality' },
    { key: 'lowContent', label: 'المحتوى الأقل أداءً', criterion: 'contentQuality' },
    { key: 'facesVoices', label: 'استخدام الوجوه أو الأصوات أو القصص', criterion: 'contentQuality' },
    { key: 'productClarity', label: 'وضوح العرض والمنتج', criterion: 'identity' },
    { key: 'keywords', label: 'الكلمات المفتاحية في النص والوصف', criterion: 'searchability' },
    { key: 'searchability', label: 'قابلية المحتوى للبحث', criterion: 'searchability' },
    { key: 'localFit', label: 'ملاءمة المحتوى للجمهور المحلي', criterion: 'contentQuality' },
    { key: 'cta', label: 'وجود دعوة واضحة للتواصل أو الشراء', criterion: 'conversion' },
  ],
  snapchat: [
    { key: 'accountClarity', label: 'وضوح الحساب', criterion: 'completeness' },
    { key: 'presentation', label: 'طريقة عرض النشاط', criterion: 'identity' },
    { key: 'frequency', label: 'تكرار الظهور', criterion: 'consistency' },
    { key: 'storyNature', label: 'طبيعة القصص', criterion: 'contentQuality' },
    { key: 'photography', label: 'التصوير', criterion: 'contentQuality' },
    { key: 'shows', label: 'العروض', criterion: 'contentQuality' },
    { key: 'contactEase', label: 'سهولة التواصل', criterion: 'conversion' },
    { key: 'geoUsage', label: 'استخدام الموقع الجغرافي', criterion: 'searchability' },
    { key: 'coverage', label: 'جودة التغطية', criterion: 'contentQuality' },
    { key: 'localFit', label: 'ملاءمة المحتوى لجمهور تبوك والشمال', criterion: 'contentQuality' },
  ],
  website: [
    { key: 'heroClarity', label: 'وضوح العرض الرئيسي', criterion: 'identity' },
    { key: 'definition', label: 'تعريف النشاط', criterion: 'identity' },
    { key: 'navigation', label: 'سهولة التنقل', criterion: 'conversion' },
    { key: 'servicesSpeed', label: 'وضوح الخدمات', criterion: 'identity' },
    { key: 'mobile', label: 'تجربة الجوال', criterion: 'conversion' },
    { key: 'buttons', label: 'الأزرار', criterion: 'conversion' },
    { key: 'contactForm', label: 'نموذج التواصل', criterion: 'conversion' },
    { key: 'whatsapp', label: 'واتساب', criterion: 'conversion' },
    { key: 'trust', label: 'الثقة والمصداقية', criterion: 'reputation' },
    { key: 'reviews', label: 'التقييمات والشهادات', criterion: 'reputation' },
    { key: 'copyQuality', label: 'جودة النصوص', criterion: 'contentQuality' },
    { key: 'language', label: 'اللغة والأخطاء', criterion: 'contentQuality' },
    { key: 'servicePages', label: 'صفحات الخدمات', criterion: 'completeness' },
    { key: 'aboutPage', label: 'صفحة من نحن', criterion: 'completeness' },
    { key: 'contactInfo', label: 'معلومات التواصل', criterion: 'completeness' },
    { key: 'visualHarmony', label: 'الانسجام البصري', criterion: 'identity' },
    { key: 'purchaseFlow', label: 'تجربة الشراء أو الحجز', criterion: 'conversion' },
    { key: 'pricing', label: 'عرض الأسعار عند المناسبة', criterion: 'conversion' },
    { key: 'seoTitles', label: 'العناوين', criterion: 'searchability' },
    { key: 'seoDescription', label: 'الوصف', criterion: 'searchability' },
    { key: 'pageStructure', label: 'بنية الصفحة', criterion: 'searchability' },
    { key: 'seoKeywords', label: 'الكلمات المفتاحية', criterion: 'searchability' },
    { key: 'indexing', label: 'الفهرسة الظاهرة في نتائج البحث', criterion: 'searchability' },
    { key: 'brokenLinks', label: 'الروابط المكسورة الظاهرة', criterion: 'conversion' },
    { key: 'conversionBlockers', label: 'ما يمنع إتمام التحويل', criterion: 'conversion' },
  ],
  store: [
    { key: 'catalog', label: 'وضوح المنتجات', criterion: 'identity' },
    { key: 'productPhotos', label: 'جودة صور المنتجات', criterion: 'contentQuality' },
    { key: 'prices', label: 'وضوح الأسعار', criterion: 'conversion' },
    { key: 'checkout', label: 'تجربة إتمام الطلب', criterion: 'conversion' },
    { key: 'shipping', label: 'وضوح الشحن والتوصيل', criterion: 'conversion' },
    { key: 'trust', label: 'عناصر الثقة', criterion: 'reputation' },
    { key: 'mobile', label: 'تجربة الجوال', criterion: 'conversion' },
    { key: 'support', label: 'قنوات الدعم', criterion: 'conversion' },
  ],
  x: [
    { key: 'profileClarity', label: 'وضوح الحساب', criterion: 'completeness' },
    { key: 'identity', label: 'الهوية', criterion: 'identity' },
    { key: 'postingRegularity', label: 'انتظام النشر', criterion: 'consistency' },
    { key: 'engagement', label: 'التفاعل الظاهر', criterion: 'engagement' },
    { key: 'contentQuality', label: 'جودة المحتوى', criterion: 'contentQuality' },
  ],
  linkedin: [
    { key: 'profileClarity', label: 'اكتمال صفحة الشركة', criterion: 'completeness' },
    { key: 'identity', label: 'الهوية', criterion: 'identity' },
    { key: 'postingRegularity', label: 'انتظام النشر', criterion: 'consistency' },
    { key: 'engagement', label: 'التفاعل الظاهر', criterion: 'engagement' },
    { key: 'contentQuality', label: 'جودة المحتوى', criterion: 'contentQuality' },
  ],
}

/**
 * تقييم البند: الموظف يختار حالة، والنظام يحولها لنسبة.
 * البند غير المرصود يبقى بلا درجة.
 */
export const CHECK_STATES = [
  { value: '', label: 'غير مرصود', percent: null },
  { value: 'good', label: 'جيد', percent: 100 },
  { value: 'partial', label: 'يحتاج تحسين', percent: 55 },
  { value: 'weak', label: 'ضعيف', percent: 20 },
  { value: 'missing', label: 'غير موجود', percent: 0 },
] as const

export type CheckStateValue = (typeof CHECK_STATES)[number]['value']

export function percentOfState(v: string): number | null {
  return CHECK_STATES.find((s) => s.value === v)?.percent ?? null
}

export function labelOfState(v: string): string {
  return CHECK_STATES.find((s) => s.value === v)?.label ?? 'غير مرصود'
}
