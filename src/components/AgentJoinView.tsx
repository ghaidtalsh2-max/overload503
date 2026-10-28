import React, { useState } from 'react';
import { Shield, Server, Cpu, Database, ArrowRight, AlertCircle, Users } from 'lucide-react';
import { Squad, Agent } from '../types/game';
import { SQUADS } from '../data/gameData';
import { audio } from '../services/audioService';

interface AgentJoinViewProps {
  onRegister: (displayName: string, squad: Squad) => Promise<void>;
  agents: Agent[];
  isSubmitting: boolean;
  errorMessage: string;
  onOpenBriefing?: () => void;
}

export const AgentJoinView: React.FC<AgentJoinViewProps> = ({
  onRegister,
  agents,
  isSubmitting,
  errorMessage,
  onOpenBriefing
}) => {
  const [displayName, setDisplayName] = useState('');
  const [selectedSquad, setSelectedSquad] = useState<Squad>('sentinels');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || isSubmitting) return;

    audio.playUnlockClick();
    await onRegister(displayName.trim(), selectedSquad);
  };

  const squadCounts = {
    sentinels: agents.filter((a) => a.squad === 'sentinels').length,
    neural: agents.filter((a) => a.squad === 'neural').length,
    vault: agents.filter((a) => a.squad === 'vault').length
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between p-3 sm:p-4 bg-[#04070f] relative overflow-x-hidden font-cairo">
      
      {/* Background Cyber Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[250px] bg-gradient-to-b from-[#4285F4]/15 via-transparent to-transparent blur-3xl" />
      </div>

      {/* Centered Phone Container (380px max, centered on desktop, fills mobile) */}
      <div className="agent-phone-container z-10 py-2 w-full max-w-[380px]">

        {/* Top Banner */}
        <header className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/40 text-blue-300 font-mono text-xs">
            <bdi dir="ltr">GOOGLE DGOC | TU • INCIDENT ROOM</bdi>
          </div>

          <h1 className="font-mono text-3xl sm:text-4xl font-black text-white tracking-wider text-glow-blue">
            <bdi dir="ltr">503: OVERLOAD</bdi>
          </h1>

          <div className="font-mono text-[11px] text-slate-300 tracking-wider">
            <bdi dir="ltr">DETECT • INVESTIGATE • CONTAIN • RECOVER</bdi>
          </div>

          <p className="text-xs text-slate-400 pt-1">
            تسجيل العملاء للانضمام إلى محاكاة الحادث الأمني
          </p>
        </header>

        {/* Main Registration Form */}
        <main className="w-full my-auto py-3">
          <div className="cyber-panel w-full p-4 sm:p-5 border-[#4285F4]/40 bg-[#060c20]/95 shadow-[0_0_40px_rgba(66,133,244,0.2)]">
            
            {/* Quick Demo Play & Instructions Buttons */}
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-950/70 to-emerald-950/70 border border-emerald-500/40 text-center space-y-2">
              <div className="text-xs text-emerald-300 font-bold">
                ⚡ هل تريد تجربة اللعبة والتحكم بالتحديات فوراً؟
              </div>

              {onOpenBriefing && (
                <button
                  type="button"
                  onClick={onOpenBriefing}
                  className="w-full py-2 px-3 rounded-lg bg-blue-900/60 hover:bg-blue-800 border border-blue-400/60 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>📖 اضغط هنا لقراءة تعليمات اللعبة وقواعد المهمة</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  const randomNum = Math.floor(100 + Math.random() * 900);
                  audio.playUnlockClick();
                  await onRegister(`Hunter-${randomNum}`, selectedSquad);
                }}
                disabled={isSubmitting}
                className="w-full min-h-[44px] rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-[0_0_15px_rgba(52,168,83,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>🎮 دخول سريع وتجربة اللعبة (PLAY NOW)</span>
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-700"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-mono">أو سجّل اسمك للفعالية</span>
              <div className="flex-grow border-t border-slate-700"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              
              {/* Display Name Input */}
              <div className="space-y-1.5 text-right">
                <label className="block text-xs font-bold text-slate-200">
                  اسم العميل (Display Name):
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="اكتب اسمك أو لقبك الفريد"
                  maxLength={20}
                  required
                  className="w-full min-h-[48px] bg-[#02050e] border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-[#4285F4] focus:shadow-[0_0_12px_rgba(66,133,244,0.4)] transition"
                />
                <span className="text-[10px] text-slate-500 block">
                  * الأسماء فريدة ومخصصة لكل عميل (بدون PIN)
                </span>
              </div>

              {/* Error Message if name is taken */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/60 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Squad Selector */}
              <div className="space-y-2 text-right">
                <label className="block text-xs font-bold text-slate-200">
                  اختر كتيبتك التخصصية (Squad):
                </label>

                <div className="space-y-2 w-full">
                  {(['sentinels', 'neural', 'vault'] as Squad[]).map((sqId) => {
                    const sq = SQUADS[sqId];
                    const isSelected = selectedSquad === sqId;

                    return (
                      <div
                        key={sqId}
                        onClick={() => {
                          audio.playUnlockClick();
                          setSelectedSquad(sqId);
                        }}
                        className={`w-full p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between min-h-[52px] gap-2 overflow-hidden ${
                          isSelected
                            ? `bg-[#0a1432] border-[#4285F4]`
                            : 'bg-[#030612] border-slate-800 hover:border-slate-700'
                        }`}
                        style={{
                          borderColor: isSelected ? sq.color : undefined,
                          boxShadow: isSelected ? `0 0 14px ${sq.color}35` : undefined
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xl shrink-0">{sq.badge}</span>
                          <div className="text-right min-w-0 flex-1">
                            <div className="font-bold text-xs text-white flex items-center gap-1">
                              <span style={{ color: sq.color }} className="shrink-0">{sq.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                <bdi dir="ltr">({sq.track})</bdi>
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate block">
                              {sq.manifesto}
                            </p>
                          </div>
                        </div>

                        <div className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-black/60 border border-slate-800 text-slate-300 shrink-0">
                          <bdi dir="ltr">{squadCounts[sqId]}</bdi>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Join Button (min 48px height with Google glow) */}
              <button
                type="submit"
                disabled={!displayName.trim() || isSubmitting}
                className="w-full min-h-[50px] rounded-xl bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:brightness-110 text-white font-bold text-sm shadow-[0_0_20px_rgba(66,133,244,0.5)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                <span>{isSubmitting ? 'جارِ التسجيل...' : 'انضمام كعميل (JOIN)'}</span>
                <ArrowRight size={18} />
              </button>

            </form>

          </div>
        </main>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-500 py-2">
          Google DGoC | TU · Be Googley
        </footer>

      </div>

    </div>
  );
};
