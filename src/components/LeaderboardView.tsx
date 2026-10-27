import React from 'react';
import { Trophy, Medal, RotateCcw, ShieldCheck, ExternalLink, Clock, Target, AlertTriangle } from 'lucide-react';
import { Agent } from '../types/game';

interface LeaderboardViewProps {
  agents: Agent[];
  currentAgent: Agent;
  missionOutcome: 'SECURED' | 'TIMEOUT';
  timeElapsed: number; // in seconds
  accuracy: number;
  onPlayAgain: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  agents,
  currentAgent,
  missionOutcome,
  timeElapsed,
  accuracy,
  onPlayAgain
}) => {
  // Sort agents by score descending, then time ascending
  const sorted = [...agents].sort((a, b) => (b.score || 0) - (a.score || 0));
  const top10 = sorted.slice(0, 10);
  const myRankIndex = sorted.findIndex((a) => a.id === currentAgent.id);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : sorted.length + 1;

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4 font-cairo">
      
      {/* 1. MISSION CONCLUSION BANNER */}
      <div
        className={`p-5 rounded-2xl border text-center space-y-2 shadow-2xl ${
          missionOutcome === 'SECURED'
            ? 'bg-gradient-to-b from-[#0a2618] to-[#04110a] border-emerald-500/60 shadow-[0_0_40px_rgba(52,168,83,0.25)]'
            : 'bg-gradient-to-b from-[#2a0d12] to-[#0f0406] border-red-500/60 shadow-[0_0_40px_rgba(234,67,53,0.25)]'
        }`}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/40 border border-current">
          {missionOutcome === 'SECURED' ? (
            <>
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-emerald-300">SYSTEM SECURED • INCIDENT CONTAINED</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-red-300">INCIDENT UNRESOLVED • TIME EXPIRED</span>
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {missionOutcome === 'SECURED' ? 'اكتملت المهمة بنجاح!' : 'انتهى الوقت قبل الاحتواء التام!'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          {missionOutcome === 'SECURED'
            ? 'تم كشف ثغرتي الذاكرة، تصفير المؤشر المعلق، ونشر التحديث الأمني المعتمد لبيئة PHP.'
            : 'استنفد العداد التنازلي قبل إتمام الترقيع النهائي. راجع الأدلة وحاول مرة أخرى!'}
        </p>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto pt-2">
          <div className="p-2 rounded-xl bg-black/50 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono block">النقاط النهائية</span>
            <span className="text-lg font-mono font-black text-white">{currentAgent.score || 0}</span>
          </div>
          <div className="p-2 rounded-xl bg-black/50 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono block">وقت الاستجابة</span>
            <span className="text-lg font-mono font-black text-white">{formatSec(timeElapsed)}</span>
          </div>
          <div className="p-2 rounded-xl bg-black/50 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono block">دقة القرارات</span>
            <span className="text-lg font-mono font-black text-white">{accuracy}%</span>
          </div>
        </div>
      </div>

      {/* 2. PERSISTENT GLOBAL LEADERBOARD */}
      <div className="pn p-4 rounded-2xl border border-[#FBBC05]/40 bg-[#070d1f]/95 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-[#FBBC05]" />
            <span className="font-black text-base text-white">قائمة المتصدرين العالمية (Global Leaderboard)</span>
          </div>
          <span className="text-xs font-mono text-slate-400">إجمالي الحماة: {sorted.length}</span>
        </div>

        {/* Top 3 Podium Cards */}
        {top10.length >= 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {top10.slice(0, 3).map((agent, i) => {
              const medals = ['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث'];
              const borderColors = ['border-amber-400 bg-amber-950/30', 'border-slate-400 bg-slate-900/40', 'border-amber-700 bg-amber-950/20'];
              const textColors = ['text-amber-300', 'text-slate-300', 'text-amber-600'];

              return (
                <div key={agent.id} className={`p-3 rounded-xl border text-center space-y-1 shadow-md ${borderColors[i]}`}>
                  <span className={`text-[11px] font-bold block ${textColors[i]}`}>{medals[i]}</span>
                  <span className="font-black text-sm text-white block truncate">{agent.displayName}</span>
                  <span className="mono text-base font-black text-white block">{agent.score || 0} PTS</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard Table (Ranks 4-10) */}
        <div className="space-y-1 pt-1">
          {top10.map((agent, idx) => {
            const isMe = agent.id === currentAgent.id;
            return (
              <div
                key={agent.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono transition ${
                  isMe
                    ? 'border-[#4285F4] bg-[#0d204a] text-white shadow-md'
                    : 'border-slate-800 bg-[#060c1d] text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-black text-slate-400">#{idx + 1}</span>
                  <span className="font-bold text-white truncate max-w-[140px] sm:max-w-none">{agent.displayName}</span>
                  {isMe && <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#4285F4] text-white font-cairo">أنت</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">{agent.squad?.toUpperCase() || 'DEFENDER'}</span>
                  <span className="font-black text-white">{agent.score || 0} PTS</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Player Card if outside Top 10 */}
        {myRank > 10 && (
          <div className="p-2.5 rounded-xl border border-[#4285F4] bg-[#0d204a] flex items-center justify-between text-xs font-mono text-white mt-2">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center font-black text-[#8ab4ff]">#{myRank}</span>
              <span className="font-bold">{currentAgent.displayName} (ترتيبك الحالي)</span>
            </div>
            <span className="font-black">{currentAgent.score || 0} PTS</span>
          </div>
        )}
      </div>

      {/* 3. EDUCATIONAL DEBRIEF & PHP2SHELL LEARNING */}
      <div className="pn p-4 rounded-2xl border border-slate-800 bg-[#070d1f]/95 space-y-3">
        <h3 className="font-black text-sm text-white">الخلاصة الأمنية للحادث (Security Debrief):</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-right">
          <div className="p-3 rounded-xl bg-[#091124] border border-[#EA4335]/40 space-y-1">
            <span className="mono font-bold text-[#ff8a80] block ltr text-right">CVE-2026-109618</span>
            <p className="text-slate-300 leading-relaxed">
              <strong>استنزاف الذاكرة (OOM):</strong> يحدث عند إرسال ملفات ضخمة تتجاوز الحد المسموح، فينهار المحرك دون تنظيف هياكل الذاكرة وإطارات الـ Backtrace الداخلية.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#091124] border border-[#FBBC05]/40 space-y-1">
            <span className="mono font-bold text-[#FBBC05] block ltr text-right">CVE-2026-109619</span>
            <p className="text-slate-300 leading-relaxed">
              <strong>المؤشر المعلق (Use-After-Free):</strong> بقي مؤشر عام يشير لكتلة ذاكرة تم تحريرها، مما يسمح لطلب جديد بتعبئتها واستغلال المؤشر القديم لتنفيذ كود عن بعد (RCE).
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#0d1d44]/50 border border-[#4285F4]/40 text-xs text-slate-300 leading-relaxed">
          <strong>لماذا لا يكفي إعادة تشغيل السيرفر؟</strong> إعادة التشغيل أو زيادة الذاكرة أو إخفاء الأخطاء لا يغير طريقة تعامل المحرك مع الذاكرة؛ الحل الدائم الوحيد هو <strong>نشر التحديث الأمني الرسمي (Security Patch)</strong> الذي يصحح منطق تخصيص وتصفير الذاكرة في Zend Engine.
        </div>
      </div>

      {/* 4. PLAY AGAIN BUTTON */}
      <button
        onClick={onPlayAgain}
        className="w-full min-h-[50px] rounded-2xl bg-gradient-to-r from-[#4285F4] via-[#1a56c4] to-[#4285F4] text-white font-black text-base shadow-[0_0_30px_rgba(66,133,244,0.5)] active:scale-95 hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2"
      >
        <RotateCcw size={18} />
        <span>إعادة خوض التحدي الأمني (Play Again)</span>
      </button>

    </div>
  );
};
