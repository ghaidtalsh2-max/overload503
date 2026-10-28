import React from 'react';
import { 
  ShieldAlert, 
  Flame, 
  Scissors, 
  Search, 
  CheckCircle2, 
  Zap, 
  X, 
  Play, 
  Target, 
  Award,
  Terminal
} from 'lucide-react';

interface MissionBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPlaying?: () => void;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  isOpen,
  onClose,
  onStartPlaying
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in font-cairo">
      
      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-[#0a142e] via-[#060c20] to-[#030612] border-2 border-[#4285F4]/60 shadow-[0_0_50px_rgba(66,133,244,0.35)] p-5 sm:p-7 text-white space-y-5 my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          title="إغلاق"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <bdi dir="ltr">MISSION BRIEFING • تعليمات المهمة الأمنية</bdi>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-glow-blue tracking-wide text-white">
            كيف تلعب وتنقذ السيرفر من الانهيار؟ 🎮
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            أنت المحلل الأمني المناوب في مركز العمليات (<bdi dir="ltr">SOC</bdi>). السيرفر يتعرض لهجوم سيبراني يرفع الضغط إلى <span className="text-red-400 font-mono font-bold">503: OVERLOAD</span> بسبب ثغرات في نواة <bdi dir="ltr">PHP</bdi>. مهمتك إنقاذ السيرفر في <strong className="text-emerald-400">4 تحديات تفاعلية سريعة</strong> باللمس والضغط والخيارات الذكية!
          </p>
        </div>

        {/* The 4 Interactive Challenges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          
          {/* Challenge 1 */}
          <div className="p-3.5 rounded-xl bg-[#091636]/80 border border-[#4285F4]/40 hover:border-[#4285F4] transition space-y-1.5 shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-600/30 text-blue-400">
                <Target size={18} />
              </div>
              <div>
                <span className="text-[10px] text-blue-400 font-mono font-bold block">التحدي 1</span>
                <h4 className="text-xs font-bold text-white">💥 صد وقصف الطلبات الساقطة</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              طلبات هجومية تسقط لتفجير الذاكرة. <strong>انقر فوراً على الطلب لإسقاطه</strong> أو اكتب رقمه (مثل <bdi dir="ltr" className="font-mono text-emerald-300">block 4129</bdi>) لتكسب +20 نقطة وسلسلة كومبو!
            </p>
          </div>

          {/* Challenge 2 */}
          <div className="p-3.5 rounded-xl bg-[#1a1206]/80 border border-[#FBBC05]/40 hover:border-[#FBBC05] transition space-y-1.5 shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yellow-600/30 text-yellow-400">
                <Scissors size={18} />
              </div>
              <div>
                <span className="text-[10px] text-yellow-400 font-mono font-bold block">التحدي 2</span>
                <h4 className="text-xs font-bold text-white">✂️ قص مؤشر الذاكرة المعلق</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              محرك PHP ترك مؤشراً تالفاً <bdi dir="ltr" className="font-mono text-yellow-300">0x7f3a</bdi>. <strong>المس المؤشر لقص خيط الليزر</strong> وتصفيره قبل أن يسيطر الهكر على الذاكرة!
            </p>
          </div>

          {/* Challenge 3 */}
          <div className="p-3.5 rounded-xl bg-[#160a29]/80 border border-purple-500/40 hover:border-purple-400 transition space-y-1.5 shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-600/30 text-purple-400">
                <Search size={18} />
              </div>
              <div>
                <span className="text-[10px] text-purple-400 font-mono font-bold block">التحدي 3</span>
                <h4 className="text-xs font-bold text-white">🕵️‍♂️ كشف الصندوق المسموم</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              صناديق كاش <bdi dir="ltr">OPcache</bdi> تمر أمامك. افحص الصناديق واضغط <strong>عزل الصندوق الملغم (Box #12)</strong> ثم دوّر الجلسات لحماية المستخدمين.
            </p>
          </div>

          {/* Challenge 4 */}
          <div className="p-3.5 rounded-xl bg-[#071f14]/80 border border-[#34A853]/40 hover:border-[#34A853] transition space-y-1.5 shadow-md">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-600/30 text-emerald-400">
                <ShieldAlert size={18} />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold block">التحدي 4</span>
                <h4 className="text-xs font-bold text-white">🛡️ معركة الترقيع وحسم المعركة</h4>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              احذر فخ تحديث ووردبريس (-10 نقاط)! <strong>اختر ترقية نواة PHP الحقيقية</strong>، ثم اضغط <bdi dir="ltr" className="font-mono text-emerald-300">VERIFY</bdi> لإعادة السيرفر آمناً بالكامل.
            </p>
          </div>

        </div>

        {/* Action Button & Tips */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-yellow-400 shrink-0" />
              <span>يمكنك اللعب بالضغط المباشر على الأزرار والشاشة أو عبر كتابة الأوامر بالكيبورد!</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-bold shrink-0">
              <Award size={14} />
              <span>رتب سيبرانية وكؤوس للمتصدرين</span>
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                onClose();
                if (onStartPlaying) onStartPlaying();
              }}
              className="flex-1 min-h-[50px] rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:brightness-110 text-black font-black text-sm shadow-[0_0_25px_rgba(52,168,83,0.5)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Play size={18} fill="currentColor" />
              <span>فهمت، انطلق للمهمة وابدأ اللعب الآن! 🚀</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 transition cursor-pointer"
            >
              إغلاق ومتابعة
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
