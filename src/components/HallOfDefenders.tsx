import React, { useEffect } from 'react';
import { 
  Trophy, 
  Crown, 
  Award, 
  ShieldCheck, 
  ExternalLink, 
  RotateCcw, 
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  Users
} from 'lucide-react';
import { Agent, Squad, CyberRank, BadgeId } from '../types/game';
import { SQUADS, CYBER_RANK_TITLES, getCyberRank } from '../data/gameData';
import { audio } from '../services/audioService';

interface HallOfDefendersProps {
  agents: Agent[];
  currentAgent?: Agent;
  isHost?: boolean;
  onReset?: () => void;
  paperUrl?: string;
}

export const HallOfDefenders: React.FC<HallOfDefendersProps> = ({
  agents,
  currentAgent,
  isHost = false,
  onReset,
  paperUrl = 'https://gdg.community.dev'
}) => {
  useEffect(() => {
    audio.playSuccessChime();
  }, []);

  // Sort agents by score descending
  const sortedAgents = [...agents].sort((a, b) => b.score - a.score);
  const top10 = sortedAgents.slice(0, 10);

  // Compute Squad Statistics based on AVERAGE score
  const squadStats: Record<Squad, { squad: Squad; count: number; totalScore: number; avgScore: number }> = {
    sentinels: { squad: 'sentinels', count: 0, totalScore: 0, avgScore: 0 },
    neural: { squad: 'neural', count: 0, totalScore: 0, avgScore: 0 },
    vault: { squad: 'vault', count: 0, totalScore: 0, avgScore: 0 }
  };

  agents.forEach((agent) => {
    if (squadStats[agent.squad]) {
      squadStats[agent.squad].count += 1;
      squadStats[agent.squad].totalScore += agent.score;
    }
  });

  Object.values(squadStats).forEach((stat) => {
    stat.avgScore = stat.count > 0 ? Math.round(stat.totalScore / stat.count) : 0;
  });

  const rankedSquads = Object.values(squadStats).sort((a, b) => b.avgScore - a.avgScore);
  const winningSquad = rankedSquads[0];

  // Badges metadata
  const BADGES_INFO: Record<BadgeId, { name: string; desc: string; icon: string }> = {
    ZERO_LEAK: { name: 'ZERO LEAK', desc: 'تصدى لجميع الطلبات الخبيثة في المحطة 1 دون أخطاء', icon: '🛡️' },
    POINTER_CUTTER: { name: 'POINTER CUTTER', desc: 'قطع أكبر عدد من المؤشرات المعلقة في المحطة 2', icon: '⚡' },
    PATCH_MASTER: { name: 'PATCH MASTER', desc: 'اختار الرهان الجذري الصحيح في المحطة 4', icon: '🎯' },
    COMBO_BREAKER: { name: 'COMBO BREAKER', desc: 'حقق أعلى مضاعف نقاط x5', icon: '🔥' }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 md:p-6 bg-[#04070f] relative overflow-x-hidden text-right font-cairo">
      
      {/* Background Neon Grid & Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[#34A853]/15 via-[#4285F4]/10 to-transparent blur-3xl" />
      </div>

      {/* Header */}
      <header className="max-w-4xl mx-auto w-full text-center space-y-3 z-10 pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 font-mono text-xs shadow-[0_0_15px_rgba(52,168,83,0.3)]">
          <ShieldCheck size={16} />
          <span>INCIDENT CONCLUDED • SYSTEM SECURED</span>
        </div>

        <h1 className="font-mono text-3xl md:text-5xl font-black text-white tracking-wider text-glow-green">
          HALL OF DEFENDERS
        </h1>

        <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
          قاعة الشرف لحماة المنظومة — تم احتواء استغلال ثغرات <span className="text-[#4285F4] font-mono font-bold">PHP2Shell</span> بنجاح!
        </p>
      </header>

      {/* Main Grid: Squad Standings + Top Agents */}
      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 my-6 z-10">
        
        {/* Left Column: SQUAD LEADERBOARD (Ranked by Average Score) */}
        <section className="md:col-span-5 flex flex-col gap-4">
          <div className="cyber-panel p-5 border-[#34A853]/40 bg-[#070e24]/90">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono text-slate-400">RANKED BY AGENT AVERAGE</span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Crown size={18} className="text-[#FBBC05]" />
                <span>لوحة الكتائب (Squads)</span>
              </h2>
            </div>

            <div className="space-y-3">
              {rankedSquads.map((sq, index) => {
                const meta = SQUADS[sq.squad];
                const isLeader = index === 0 && sq.count > 0;

                return (
                  <div
                    key={sq.squad}
                    className={`relative p-3.5 rounded-xl border transition-all ${
                      isLeader
                        ? 'border-[#FBBC05] bg-[#FBBC05]/10 shadow-[0_0_20px_rgba(251,188,5,0.25)]'
                        : 'border-slate-800 bg-[#030612]/70'
                    }`}
                  >
                    {isLeader && (
                      <div className="absolute -top-3 left-4 px-2 py-0.5 rounded-md bg-[#FBBC05] text-black font-mono font-black text-[10px] flex items-center gap-1 shadow-md">
                        <Crown size={11} />
                        <span>TOP SQUAD</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Left: Scores */}
                      <div className="text-left font-mono">
                        <div className="text-lg font-black text-white flex items-center gap-1">
                          <span>{sq.avgScore}</span>
                          <span className="text-[10px] text-slate-400 font-cairo">متوسط</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {sq.totalScore} نقطة كلية • {sq.count} عملاء
                        </div>
                      </div>

                      {/* Right: Squad Name & Rank */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-sm text-white flex items-center gap-1.5 justify-end">
                            <span style={{ color: meta.color }}>{meta.name}</span>
                            <span>{meta.badge}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">مسار {meta.track}</span>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-sm text-slate-300">
                          #{index + 1}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Agent Performance Card (If in Agent Phone Mode) */}
          {currentAgent && (
            <div className="cyber-panel p-5 border-[#4285F4]/40 bg-[#070e24]/90">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <span className="text-xs font-mono text-[#4285F4]">YOUR PERFORMANCE</span>
                <h3 className="text-sm font-bold text-white">بطاقة نتائجك الشخصية</h3>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="text-left">
                  <span className="text-2xl font-black text-white font-mono">{currentAgent.score}</span>
                  <span className="text-xs text-slate-400 block font-mono">/ 1000 PTS</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-white">{currentAgent.displayName}</div>
                  <div className="text-xs text-slate-400">كتيبة {SQUADS[currentAgent.squad].name}</div>
                </div>
              </div>

              {/* Cyber Rank Title */}
              {(() => {
                const rank = getCyberRank(currentAgent.score);
                const titleMeta = CYBER_RANK_TITLES[rank];
                return (
                  <div className="p-2.5 rounded-lg bg-[#02050f] border border-slate-800 flex items-center justify-between mb-3">
                    <span className="font-mono font-black text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${titleMeta.color}20`, color: titleMeta.color, border: `1px solid ${titleMeta.color}60` }}>
                      {titleMeta.name}
                    </span>
                    <span className="text-xs text-slate-300 font-bold">{titleMeta.arabicName}</span>
                  </div>
                );
              })()}

              {/* Earned Badges */}
              {currentAgent.badges && currentAgent.badges.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 block font-mono">الأوسمة المكتسبة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAgent.badges.map((b) => (
                      <span key={b} className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center gap-1 font-mono">
                        <span>{BADGES_INFO[b]?.icon || '🎖️'}</span>
                        <span>{BADGES_INFO[b]?.name || b}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Column: TOP 10 AGENTS */}
        <section className="md:col-span-7 flex flex-col gap-4">
          <div className="cyber-panel p-5 border-[#4285F4]/40 bg-[#070e24]/90 flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono text-slate-400">TOTAL DEFENDERS: {agents.length}</span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy size={18} className="text-[#4285F4]" />
                <span>أفضل 10 عملاء (Top 10 Agents)</span>
              </h2>
            </div>

            {top10.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-sm">
                لا يوجد عملاء مسجلين حالياً.
              </div>
            ) : (
              <div className="space-y-2">
                {top10.map((agent, idx) => {
                  const rank = getCyberRank(agent.score);
                  const titleMeta = CYBER_RANK_TITLES[rank];
                  const squadMeta = SQUADS[agent.squad];
                  const isTop3 = idx < 3;

                  return (
                    <div
                      key={agent.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isTop3
                          ? 'border-[#4285F4]/50 bg-[#4285F4]/10 shadow-[0_0_15px_rgba(66,133,244,0.15)]'
                          : 'border-slate-800/80 bg-[#030612]/60'
                      }`}
                    >
                      {/* Left: Score & Badges */}
                      <div className="flex items-center gap-3">
                        <div className="text-left font-mono">
                          <span className="text-base font-black text-white">{agent.score}</span>
                          <span className="text-[10px] text-slate-500 block">PTS</span>
                        </div>
                        {agent.badges && agent.badges.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1">
                            {agent.badges.map((b) => (
                              <span key={b} title={BADGES_INFO[b]?.name} className="text-xs">
                                {BADGES_INFO[b]?.icon}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Rank, Name, Title, Squad */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-sm text-white flex items-center gap-2 justify-end">
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: `${squadMeta.color}25`, color: squadMeta.color }}>
                              {squadMeta.name}
                            </span>
                            <span>{agent.displayName}</span>
                          </div>
                          <div className="text-[11px] font-mono" style={{ color: titleMeta.color }}>
                            {titleMeta.name} • {titleMeta.arabicName}
                          </div>
                        </div>

                        {/* Rank Badge */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            idx === 0
                              ? 'bg-[#FBBC05] text-black font-black shadow-[0_0_10px_#FBBC05]'
                              : idx === 1
                              ? 'bg-slate-300 text-black font-black'
                              : idx === 2
                              ? 'bg-amber-700 text-white font-black'
                              : 'bg-slate-900 border border-slate-700 text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bridge to the Research Paper (Section 8) */}
      <footer className="max-w-4xl mx-auto w-full z-10 space-y-4 pt-2 pb-4">
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[#070e24] via-[#0b173d] to-[#070e24] border border-[#4285F4]/40 shadow-[0_0_30px_rgba(66,133,244,0.2)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="text-right space-y-2 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-900/50 border border-blue-400/40 text-blue-300 text-xs font-mono">
                <FileText size={13} />
                <span>PHP2SHELL SECURITY BRIEF</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white">
                تم تأمين النظام... لكن القصة لم تنتهِ بعد!
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                اكتشف في الورقة البحثية الإجابات الكاملة: كيف تم اكتشاف الثغرتين؟ ما هو دور الذكاء الاصطناعي في التدقيق الأمني؟ وكيف نحمي خوادمنا التي تشغل 70% من الإنترنت؟
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <a
                href={paperUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4285F4] to-[#34A853] text-white font-bold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(66,133,244,0.4)] hover:brightness-110 active:scale-95 transition"
              >
                <span>قراءة ورقة PHP2Shell البحثية</span>
                <ExternalLink size={16} />
              </a>

              {isHost && onReset && (
                <button
                  onClick={onReset}
                  className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-sm font-cairo font-bold flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer"
                >
                  <RotateCcw size={16} />
                  <span>إعادة تشغيل المحاكاة</span>
                </button>
              )}
            </div>

          </div>
        </div>

        <div className="text-center font-cairo text-xs text-slate-500">
          Prepared by the Web track members, Google DGoC | TU, Be Googley
        </div>
      </footer>

    </div>
  );
};
