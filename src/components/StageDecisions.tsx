import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle2, ArrowRight, Lock, Award, Flame } from 'lucide-react';
import { sfx } from '../services/audioService';

interface DecisionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

interface StageDecisionsProps {
  currentStage: number; // 1, 2, 3, 4
  onDecisionOutcome: (isCorrect: boolean, points: number, penaltySec?: number) => void;
  onAdvanceStage: () => void;
  patchDeployed: boolean;
  onDeployPatch: () => void;
}

export const StageDecisions: React.FC<StageDecisionsProps> = ({
  currentStage,
  onDecisionOutcome,
  onAdvanceStage,
  patchDeployed,
  onDeployPatch
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [decisionFeedback, setDecisionFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Stage 4 Matching State
  const [cve1Match, setCve1Match] = useState<string>('');
  const [cve2Match, setCve2Match] = useState<string>('');
  const [cveSubmitted, setCveSubmitted] = useState<boolean>(false);

  // Reset when stage changes
  React.useEffect(() => {
    setSelectedOption(null);
    setSubmitted(false);
    setDecisionFeedback(null);
  }, [currentStage]);

  // Stage 1 Decisions
  const stage1Options: DecisionOption[] = [
    {
      id: 's1-opt-1',
      text: 'زيادة memory_limit إلى 2048MB في php.ini وإعادة تشغيل الخدمة',
      isCorrect: false,
      explanation: 'حل خادع مؤقت: زيادة الذاكرة تؤخر الانهيار فقط لكنها لا تعالج الفشل في تنظيف إطارات الذاكرة المتضررة!'
    },
    {
      id: 's1-opt-2',
      text: 'عزل العامل المتضرر وفحص فشل تنظيف إطارات الذاكرة أثناء OOM (CVE-2026-109618)',
      isCorrect: true,
      explanation: 'قرار ممتاز: الخلل يكمن في توقف المحرك فجأة دون تنظيف هياكل الذاكرة الداخلية أثناء رفع ملفات ضخمة.'
    },
    {
      id: 's1-opt-3',
      text: 'إعادة تشغيل الخادم الفيزيائي بالكامل وتجاهل السجلات',
      isCorrect: false,
      explanation: 'خطأ تشغيلي فادح: إعادة تشغيل الخادم لا يحل الثغرة البرمجية ويسبب انقطاعاً غير مبرر للخدمة!'
    }
  ];

  // Stage 2 Decisions
  const stage2Options: DecisionOption[] = [
    {
      id: 's2-opt-1',
      text: 'اعتبار المشكلة خطأ برمجي عادي (Null Pointer) في كود الموقع المكتوب',
      isCorrect: false,
      explanation: 'تشخيص خاطئ: الخلل ليس في كود تطبيق PHP بل في محرك اللغة نفسه (Zend Engine C runtime) واستخدامه للذاكرة بعد تحريرها!'
    },
    {
      id: 's2-opt-2',
      text: 'تأكيد وجود ثغرة Use-After-Free (CVE-2026-109619) وتصفير المؤشر العام global_backtrace_ptr',
      isCorrect: true,
      explanation: 'تحليل دقيق: تم ترك المؤشر يشير للكتلة 0x7f3a المحررة، وتصفيره يمنع استغلاله لتنفيذ أكواد خبيثة (RCE)!'
    },
    {
      id: 's2-opt-3',
      text: 'إضافة معامل كتم الأخطاء @ أمام الدوال لمنع ظهور التحذيرات للمستخدمين',
      isCorrect: false,
      explanation: 'كارثة أمنية: إخفاء الأخطاء لا يمنع استغلال الثغرات في الذاكرة بل يعمي فريق الاستجابة للحوادث!'
    }
  ];

  // Stage 3 Decisions
  const stage3Options: DecisionOption[] = [
    {
      id: 's3-opt-1',
      text: 'جدولة إعادة تشغيل دورية لخوادم PHP كل ساعة عبر Cron Job',
      isCorrect: false,
      explanation: 'حل ترقيعي غير فعال: يمكن للمهاجم استغلال الثغرة في أي ثانية قبل موعد إعادة التشغيل.'
    },
    {
      id: 's3-opt-2',
      text: 'نشر التحديث الأمني الرسمي للغة PHP (الإصدار المعالج 8.3.6) والتحقق من سلامة المجمع',
      isCorrect: true,
      explanation: 'الحل الجذري المعتمد: التحديث الرسمي يصحح تعامل Zend Allocator مع الـ OOM ويصفّر مؤشرات الذاكرة تلقائياً.'
    },
    {
      id: 's3-opt-3',
      text: 'تعطيل سجلات الأخطاء display_errors = Off وحظر الوصول للملف /var/log',
      isCorrect: false,
      explanation: 'مغالطة أمنية: إخفاء السجلات لا يقدم أي حماية حقيقية ضد استغلال الذاكرة في الـ Backend.'
    }
  ];

  const handleSelectOption = (opt: DecisionOption) => {
    if (submitted) return;
    setSelectedOption(opt.id);
    setSubmitted(true);

    if (opt.isCorrect) {
      sfx.unlock();
      setDecisionFeedback({ isCorrect: true, text: opt.explanation });
      onDecisionOutcome(true, 100);
    } else {
      sfx.error();
      setDecisionFeedback({ isCorrect: false, text: opt.explanation });
      onDecisionOutcome(false, -20, 10);
    }
  };

  const handleStage4Submit = () => {
    if (cveSubmitted) return;
    setCveSubmitted(true);

    const isCve1Correct = cve1Match === 'oom';
    const isCve2Correct = cve2Match === 'uaf';

    if (isCve1Correct && isCve2Correct) {
      sfx.chime();
      onDecisionOutcome(true, 150);
      onAdvanceStage();
    } else {
      sfx.error();
      onDecisionOutcome(false, -30, 10);
    }
  };

  const getCurrentOptions = () => {
    if (currentStage === 1) return stage1Options;
    if (currentStage === 2) return stage2Options;
    return stage3Options;
  };

  return (
    <div className="pn p-3 sm:p-4 rounded-2xl border border-[#4285F4]/40 bg-[#070d1f]/95 shadow-[0_0_25px_rgba(66,133,244,0.15)] flex flex-col gap-3 font-cairo">
      
      {/* Stage Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-[#4285F4]" />
          <span className="font-black text-sm text-white">
            {currentStage === 1 && 'المرحلة 1: قرار احتواء استنزاف الذاكرة (OOM)'}
            {currentStage === 2 && 'المرحلة 2: تشخيص خطأ المؤشر المعلق (Use-After-Free)'}
            {currentStage === 3 && 'المرحلة 3: معمل الترقيع واختيار الحل الدائم'}
            {currentStage === 4 && 'المرحلة 4: قفل وتأمين المنظومة (Final Lockdown)'}
          </span>
        </div>
        <span className="mono text-xs text-[#FBBC05] font-bold">
          {currentStage < 4 ? '+100 PTS' : '+150 PTS'}
        </span>
      </div>

      {/* STAGES 1, 2, 3: Multiple Choice Incident Decisions */}
      {currentStage <= 3 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-300 font-semibold leading-relaxed">
            بناءً على الأدلة المستخرجة من التيرمينال وفحص الذاكرة، ما هو الإجراء الدفاعي الصحيح؟
          </p>

          <div className="space-y-2">
            {getCurrentOptions().map((opt) => {
              const isSelected = selectedOption === opt.id;
              let btnClass = 'border-slate-800 bg-[#0a142e] text-slate-200 hover:border-[#4285F4]/60';

              if (submitted && isSelected) {
                btnClass = opt.isCorrect
                  ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200 shadow-[0_0_15px_#34A853]'
                  : 'border-red-500 bg-red-950/70 text-red-200 shadow-[0_0_15px_#EA4335]';
              } else if (submitted && opt.isCorrect) {
                btnClass = 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300';
              }

              return (
                <button
                  key={opt.id}
                  disabled={submitted}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full p-2.5 sm:p-3 rounded-xl border text-right text-xs font-semibold transition-all cursor-pointer flex items-start gap-2.5 ${btnClass}`}
                >
                  <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-[10px] font-mono mt-0.5">
                    {opt.id.slice(-1)}
                  </span>
                  <span className="flex-1 leading-snug">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback Banner */}
          {decisionFeedback && (
            <div
              className={`p-2.5 rounded-xl border text-xs leading-relaxed mt-2 ${
                decisionFeedback.isCorrect
                  ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                  : 'bg-red-950/70 border-red-500 text-red-200'
              }`}
            >
              <div className="font-bold mb-1 flex items-center gap-1.5">
                {decisionFeedback.isCorrect ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{decisionFeedback.isCorrect ? 'قرار صحيح (+100 نقطة)!' : 'قرار غير صحيح (-20 نقطة، -10 ثوانٍ)!'}</span>
              </div>
              <p>{decisionFeedback.text}</p>
            </div>
          )}

          {/* Advance to next stage button */}
          {submitted && (
            <button
              onClick={onAdvanceStage}
              className="w-full mt-2 min-h-[44px] rounded-xl bg-gradient-to-r from-[#4285F4] to-[#1a56c4] text-white font-bold text-xs active:scale-95 transition shadow-lg flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <span>الانتقال للمرحلة التالية</span>
              <ArrowRight size={14} className="rtl:rotate-180" />
            </button>
          )}
        </div>
      )}

      {/* STAGE 4: FINAL LOCKDOWN CVE MATCHING CHALLENGE */}
      {currentStage === 4 && (
        <div className="space-y-3">
          <p className="text-xs text-slate-300 leading-relaxed font-semibold">
            التحدي النهائي: اربط كل معرف ثغرة (CVE) بوصفها العلمي الصحيح لتأمين النظام بالكامل:
          </p>

          {/* CVE-2026-109618 Match */}
          <div className="p-3 rounded-xl bg-[#091124] border border-[#EA4335]/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#ff8a80] ltr">
              <span>CVE-2026-109618</span>
              <span className="text-slate-400 font-cairo">اختر الوصف الدقيق:</span>
            </div>
            <select
              value={cve1Match}
              onChange={(e) => setCve1Match(e.target.value)}
              disabled={cveSubmitted}
              className="w-full p-2 rounded-lg bg-[#040817] border border-slate-700 text-white font-cairo text-xs focus:outline-none focus:border-[#4285F4]"
            >
              <option value="">-- اضغط لاختيار الوصف --</option>
              <option value="oom">استنزاف الذاكرة (OOM) وانهيار تنظيف الإطارات عند معالجة طلبات الرفع</option>
              <option value="uaf">مؤشر عام معلق يشير لكتلة ذاكرة محررة (Use-After-Free)</option>
              <option value="xss">حقن أكواد جافاسكريبت داخل الكوكيز</option>
            </select>
          </div>

          {/* CVE-2026-109619 Match */}
          <div className="p-3 rounded-xl bg-[#091124] border border-[#FBBC05]/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#FBBC05] ltr">
              <span>CVE-2026-109619</span>
              <span className="text-slate-400 font-cairo">اختر الوصف الدقيق:</span>
            </div>
            <select
              value={cve2Match}
              onChange={(e) => setCve2Match(e.target.value)}
              disabled={cveSubmitted}
              className="w-full p-2 rounded-lg bg-[#040817] border border-slate-700 text-white font-cairo text-xs focus:outline-none focus:border-[#FBBC05]"
            >
              <option value="">-- اضغط لاختيار الوصف --</option>
              <option value="oom">استنزاف الذاكرة (OOM) وانهيار تنظيف الإطارات عند معالجة طلبات الرفع</option>
              <option value="uaf">مؤشر عام معلق يشير لكتلة ذاكرة محررة (Use-After-Free)</option>
              <option value="xss">حقن أكواد جافاسكريبت داخل الكوكيز</option>
            </select>
          </div>

          {/* Submit Lockdown */}
          <button
            onClick={handleStage4Submit}
            disabled={!cve1Match || !cve2Match || cveSubmitted}
            className={`w-full min-h-[46px] rounded-xl font-black text-xs sm:text-sm tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              cve1Match && cve2Match && !cveSubmitted
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_25px_#34A853] animate-pulse active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Lock size={16} />
            <span>تأكيد الإغلاق الأمني التام (LOCKDOWN &amp; SECURE)</span>
          </button>
        </div>
      )}

    </div>
  );
};
