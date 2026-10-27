import { Squad, SquadMeta, StationDefinition, StationId, CyberRank, BadgeId } from '../types/game';

export const SQUADS: Record<Squad, SquadMeta> = {
  sentinels: {
    id: 'sentinels',
    name: 'Sentinels',
    arabicName: 'الحراس (WEB)',
    track: 'WEB',
    color: '#4285F4',
    glow: 'rgba(66, 133, 244, 0.5)',
    badge: '🛡️',
    manifesto: 'حماية خوادم الويب وجدران WAF وتحديث بيئات التشغيل لمنع استغلال الـ PHP.'
  },
  neural: {
    id: 'neural',
    name: 'Neural',
    arabicName: 'العصبيون (AI)',
    track: 'AI',
    color: '#FBBC05',
    glow: 'rgba(251, 188, 5, 0.5)',
    badge: '⚡',
    manifesto: 'تحليل شذوذ الحزم البرمجية وكشف سلاسل الاستغلال وحماية نماذج الاستدلال.'
  },
  vault: {
    id: 'vault',
    name: 'Vault',
    arabicName: 'الخزنة (DATA)',
    track: 'DATA',
    color: '#34A853',
    glow: 'rgba(52, 168, 83, 0.5)',
    badge: '🔐',
    manifesto: 'عزل قواعد البيانات وحماية الـ Sessions من التسريب وتدوير الأسرار فوراً.'
  }
};

export const STATIONS: Record<StationId, StationDefinition> = {
  0: {
    id: 0,
    name: 'ALL SYSTEMS NOMINAL',
    arabicName: 'الأنظمة بحالة مستقرة',
    subtitle: 'NORMAL MONITORING',
    normalDescription: 'المستخدم يسجل الدخول، خادم الويب يرسل الطلب لـ PHP، وPHP تستعلم من قاعدة البيانات وتبني الصفحة.',
    breakDescription: 'الخلل ليس في موقعك... بل في الطبقة التي تحته.',
    fixInstruction: 'انتظر إشارة بدء الحادث الأمني من المضيف.',
    takeawaySentence: 'الأنظمة المستقرة تبدأ دائماً بذاكرة نظيفة ودورات حياة منضبطة.'
  },
  1: {
    id: 1,
    name: 'MEMORY VAULT',
    arabicName: 'الغرفة 1 · الذاكرة والطلب',
    subtitle: 'THE REQUEST • HEAP ALLOCATION',
    cveId: 'CVE-2026-109618',
    normalDescription: 'تحجز PHP كتلة من الذاكرة (Heap) لكل طلب وارد، وتحررها بالكامل فور انتهاء الطلب.',
    breakDescription: 'طلب Multipart خبيث يستهلك الذاكرة حتى الانهيار المفاجئ (OOM Fatal Error) قبل التنظيف، ويسرب بيانات في كوكيز PHPSESSID.',
    fixInstruction: 'اقطع الطلبات المشبوهة (Multipart مشبوه، 500 متكرر، PHPSESSID ضخم) قبل ملء الذاكرة!',
    takeawaySentence: 'انهيار الذاكرة غير المنضبط قبل التنظيف هو الشرارة الأولى لثغرات الذاكرة.'
  },
  2: {
    id: 2,
    name: 'DANGLING CORRIDOR',
    arabicName: 'الغرفة 2 · مؤشر معلّق يشير لذاكرة محرّرة',
    subtitle: 'THE MEMORY • USE-AFTER-FREE',
    cveId: 'CVE-2026-109619',
    normalDescription: 'يعالج عامل الـ PHP الطلبات واحداً تلو الآخر، مع تنظيف وتصفير المؤشرات بين كل طلب.',
    breakDescription: 'تخطي التنظيف يترك مؤشراً معلقاً يشير لكتلة محررة؛ يأتي طلب جديد فيثق PHP بالمؤشر القديم!',
    fixInstruction: 'اقطع خيوط الليزر الحمراء (المؤشرات المعلقة) قبل أن يستقر الطلب الجديد في الكتلة!',
    takeawaySentence: 'استخدام الذاكرة بعد تحريرها (Use-After-Free) يمكن المهاجم من التحكم بمسار التنفيذ.'
  },
  3: {
    id: 3,
    name: 'PATCH LAB',
    arabicName: 'الغرفة 3 · ارتباك الأنواع في OPcache',
    subtitle: 'THE OPCACHE • TYPE CONFUSION',
    cveId: 'CVE-2026-109619',
    normalDescription: 'يحتفظ OPcache بالكود المجمع في ذاكرة مشتركة لتسريع الأداء عبر عداد محلي وآخر مشترك.',
    breakDescription: 'فشل حجز الذاكرة بين العدادين يجعلهما يختلفان، فتُعامل بيانات بريئة كأنها كائنات تنفيذية!',
    fixInstruction: 'انقر على الصناديق التي لا تتطابق محتوياتها مع الملصق قبل وصولها للرف المشترك!',
    takeawaySentence: 'اختلاف العدادات في الذاكرة المشتركة يخدع المحرك ليعامل كائناً بنوع مختلف تماماً.'
  },
  4: {
    id: 4,
    name: 'CORE REBOOT',
    arabicName: 'الغرفة 4 · الترقيع وتأمين المنظومة',
    subtitle: 'THE FIX • THE BET & SQUAD BATTLE',
    normalDescription: 'الصدع يمتد في المحرك وصولاً لتطبيقات WordPress و Drupal و Joomla.',
    breakDescription: 'تحديث تطبيق الويب وحده لا يعالج المشكلة؛ الخلل في محرك PHP نفسه!',
    fixInstruction: 'راهن على الحل الجذري الصحيح، ثم تعاون مع كتيبتك لترقية وإعادة تشغيل الخوادم فوراً!',
    takeawaySentence: 'لا تحاول علاج الأعراض السطحية؛ ثغرات المحرك تتطلب ترقية PHP نفسه وإعادة تشغيل الخدمات.'
  },
  5: {
    id: 5,
    name: 'HALL OF DEFENDERS',
    arabicName: 'قاعة الأبطال وتأمين المنظومة',
    subtitle: 'INCIDENT CONCLUDED • RESULTS',
    normalDescription: 'تم تأمين النظام واستعادة الاستقرار.',
    breakDescription: 'القصة لم تنتهِ بعد...',
    fixInstruction: 'راجع نتائجك واكتشف أسرار الورقة البحثية.',
    takeawaySentence: 'الوعي الأمني يبدأ من فهم ما تحت الكود.'
  }
};

export const LAYER_STACK = [
  { id: 'user', name: 'User / العميل', desc: 'الزائر الشرعي أو المهاجم' },
  { id: 'browser', name: 'Browser / App', desc: 'متصفح الويب وتطبيقات الهاتف' },
  { id: 'webserver', name: 'Web Server (Apache / Nginx)', desc: 'خادم استقبال وتوجيه الاتصالات' },
  { id: 'php', name: 'PHP Core Engine (5.4 → 8.3)', desc: 'محرك المعالجة - مصدر الثغرة CVE-2026-109618/19' },
  { id: 'apps', name: 'Applications (WordPress / Drupal / Joomla)', desc: 'تطبيقات الويب والمواقع المخدومة' }
];

export const THE_BET_OPTIONS = [
  {
    id: 'opt-a',
    title: 'ترقية محرك PHP نفسه وإعادة تشغيل الخدمات',
    subtitle: 'Update PHP (8.5.12, 8.4.27, 8.3.36, 8.2.35) & Restart FPM',
    isCorrect: true,
    feedback: 'صحيح 100%! الخلل في نواة PHP وعلاجه الجذري ترقية المحرك وإعادة تشغيله.'
  },
  {
    id: 'opt-b',
    title: 'تحديث إضافات وقوالب WordPress فقط',
    subtitle: 'Update WordPress plugins & core only',
    isCorrect: false,
    feedback: 'خاطئ! الثغرة تقع أسفل طبقة ووردبريس في لغة PHP نفسها، لذا يظل الموقع مخترقاً!'
  },
  {
    id: 'opt-c',
    title: 'تعطيل خاصية session.upload_progress فقط',
    subtitle: 'Disable session.upload_progress in php.ini',
    isCorrect: false,
    partial: true,
    feedback: 'حل جزئي مؤقت! يغلق مساراً واحداً لكنه يترك مسار الـ backtrace ومحرك OPcache مكشوفاً.'
  },
  {
    id: 'opt-d',
    title: 'الانتظار حتى انتهاء هجمة الـ 503 وإعادة تشغيل الخادم',
    subtitle: 'Wait and reboot containers periodically',
    isCorrect: false,
    feedback: 'كارثي! إعادة التشغيل تعيد تشغيل نفس الكود المصاب، وسيعاد استغلاله خلال ثوانٍ.'
  }
];

export const SQUAD_INITIAL_NODES = [
  { id: 'node-1', name: 'app-cluster-01', version: 'PHP 8.2.35', status: 'vulnerable' as const },
  { id: 'node-2', name: 'app-cluster-02', version: 'PHP 8.3.36', status: 'vulnerable' as const },
  { id: 'node-3', name: 'app-cluster-03', version: 'PHP 8.4.27', status: 'vulnerable' as const },
  { id: 'node-4', name: 'app-cluster-04', version: 'PHP 8.5.12', status: 'vulnerable' as const }
];

export function getCyberRank(score: number): CyberRank {
  if (score >= 800) return 'ROOT';
  if (score >= 600) return 'GUARDIAN';
  if (score >= 400) return 'HUNTER';
  if (score >= 200) return 'ANALYST';
  return 'ROOKIE';
}

export const CYBER_RANK_TITLES: Record<CyberRank, { name: string; arabicName: string; color: string }> = {
  ROOT: { name: 'ROOT', arabicName: 'رووت (سيد النظام)', color: '#34A853' },
  GUARDIAN: { name: 'GUARDIAN', arabicName: 'حارس سيبراني', color: '#4285F4' },
  HUNTER: { name: 'HUNTER', arabicName: 'صياد ثغرات', color: '#FBBC05' },
  ANALYST: { name: 'ANALYST', arabicName: 'محلل أمني', color: '#93c5fd' },
  ROOKIE: { name: 'ROOKIE', arabicName: 'مستجد', color: '#94a3b8' }
};

export const BADGE_DETAILS: Record<BadgeId, { name: string; arabicName: string; icon: string; desc: string }> = {
  ZERO_LEAK: {
    name: 'ZERO LEAK',
    arabicName: 'صفر تسريب',
    icon: '🛡️',
    desc: 'لم تخطئ في أي حزمة مشبوهة في الغرفة 1'
  },
  POINTER_CUTTER: {
    name: 'POINTER CUTTER',
    arabicName: 'قاطع المؤشرات',
    icon: '⚡',
    desc: 'قطعت خيوط المؤشرات المعلقة بنجاح فائق في الغرفة 2'
  },
  PATCH_MASTER: {
    name: 'PATCH MASTER',
    arabicName: 'خبير الترقيع',
    icon: '🔧',
    desc: 'اخترت الحل الأمني الجذري في رهان الغرفة 4'
  },
  COMBO_BREAKER: {
    name: 'COMBO BREAKER',
    arabicName: 'محطم الأرقام',
    icon: '🔥',
    desc: 'حققت مضاعف نقاط x5 combo'
  }
};
