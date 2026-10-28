import React, { useState } from 'react';
import { Shield, Lock, FileText, AlertTriangle, ArrowRight, Eye, Terminal, Sparkles, UserCheck } from 'lucide-react';
import { Squad } from '../types/game';
import { SQUADS } from '../data/gameData';
import { sfx } from '../services/audioService';

interface CaseFileIntroProps {
  onAcceptMission: (displayName: string, squad: Squad) => void;
  isSubmitting?: boolean;
}

export const CaseFileIntro: React.FC<CaseFileIntroProps> = ({
  onAcceptMission,
  isSubmitting = false
}) => {
  const [displayName, setDisplayName] = useState('');
  const [selectedSquad, setSelectedSquad] = useState<Squad>('sentinels');
  const [stampRevealed, setStampRevealed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || isSubmitting) return;

    sfx.unlock();
    setStampRevealed(true);
    setTimeout(() => {
      onAcceptMission(displayName.trim(), selectedSquad);
    }, 600);
  };

  const handleQuickStart = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const agentName = `Agent-${randomNum}`;
    sfx.unlock();
    setStampRevealed(true);
    setTimeout(() => {
      onAcceptMission(agentName, selectedSquad);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 bg-[#030611] relative overflow-hidden font-cairo select-none">
      
      {/* Background Ambience: Subtle Cyber Grid & Vignette */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#152652_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent blur-3xl" />
        <div className="sc" />
      </div>

      {/* CLASSIFIED DOSSIER CONTAINER */}
      <div className="relative w-full max-w-3xl z-10 my-auto">
        
        {/* Top Folder Tab */}
        <div className="flex items-center justify-between px-6 py-2 bg-[#0a142e] border-t-2 border-x-2 border-slate-700 rounded-t-2xl w-fit min-w-[280px] shadow-lg">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="mono font-mono text-xs font-black text-red-400 tracking-widest">
              RESTRICTED // CASE-503
            </span>
          </div>
          <span className="mono text-[10px] text-slate-400">SOC LEVEL 5 CLEARANCE</span>
        </div>

        {/* Main Dossier Folder Body */}
        <div className="relative rounded-b-2xl rounded-tr-2xl bg-gradient-to-b from-[#081228] via-[#050b1a] to-[#02050e] border-2 border-slate-700 shadow-[0_0_60px_rgba(10,20,50,0.8)] p-5 sm:p-8 space-y-6">
          
          {/* Top Stamp / Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 font-mono text-[11px] mb-2 font-bold">
                <AlertTriangle size={13} className="text-red-400" />
                <bdi dir="ltr">TOP SECRET • INCIDENT CASE DOSSIER</bdi>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                ملف التحقيق الأمني: <span className="text-glow-blue font-mono text-[#4285F4]">503: OVERLOAD</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                تقرير استخباراتي عاجل — تم استدعاء وحدة الاستجابة للطوارئ السيبرانية (<bdi dir="ltr">CERT</bdi>)
              </p>
            </div>

            {/* Red Classified Stamp */}
            <div className={`shrink-0 border-2 border-red-500/80 bg-red-950/40 px-4 py-2 rounded-xl text-center transform -rotate-3 transition-transform duration-300 ${
              stampRevealed ? 'scale-110 shadow-[0_0_30px_#EA4335]' : ''
            }`}>
              <div className="mono font-black text-sm text-red-400 tracking-wider">CLASSIFIED</div>
              <div className="text-[10px] text-red-300 font-bold">ملف قضية غير قابل للنشر</div>
            </div>
          </div>

          {/* Incident Intelligence Briefing Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-[#030816]/90 border border-slate-800 text-xs leading-relaxed">
            
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">TARGET ASSET</span>
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span>محرك نواة PHP (Zend Engine)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                أكثر من <strong className="text-yellow-400 font-mono">70%</strong> من مواقع الإنترنت تعمل عبر هذا المحرك.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">THREAT SIGNATURE</span>
              <div className="font-mono text-xs font-bold text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>CVE-2026-109618 / 619</span>
              </div>
              <p className="text-[11px] text-slate-400">
                تسريب ذاكرة <span className="bg-slate-800 px-1 rounded font-mono text-slate-500">████████</span> واستغلال مؤشر Use-After-Free معلق.
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">MISSION DIRECTIVE</span>
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>الاحتواء والإنقاذ (Containment)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                الدخول لغرفة العمليات، رصد الهجوم عند حدوثه، وترقيع النواة قبل فوات الأوان.
              </p>
            </div>

          </div>

          {/* Form: Agent Identity & Clearance */}
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            
            {/* Display Name Input */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-bold text-slate-200">
                الاسم الرمزي للمحقق (Agent Callsign):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="اكتب اسمك أو لقبك السيبراني..."
                  maxLength={20}
                  className="w-full min-h-[48px] bg-[#02050f] border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm outline-none focus:border-[#4285F4] focus:shadow-[0_0_15px_rgba(66,133,244,0.4)] transition font-bold"
                />
              </div>
            </div>

            {/* Squad Selection */}
            <div className="space-y-2 text-right">
              <label className="block text-xs font-bold text-slate-200">
                اختر الكتيبة التخصصية (Squad Assignment):
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(['sentinels', 'neural', 'vault'] as Squad[]).map((sqId) => {
                  const sq = SQUADS[sqId];
                  const isSelected = selectedSquad === sqId;

                  return (
                    <div
                      key={sqId}
                      onClick={() => {
                        sfx.tick();
                        setSelectedSquad(sqId);
                      }}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'bg-[#0a1535] border-[#4285F4] shadow-[0_0_15px_rgba(66,133,244,0.3)]'
                          : 'bg-[#020612] border-slate-800 hover:border-slate-700'
                      }`}
                      style={{ borderColor: isSelected ? sq.color : undefined }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{sq.badge}</span>
                        <div>
                          <div className="font-bold text-xs text-white" style={{ color: isSelected ? sq.color : undefined }}>
                            {sq.name}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">({sq.track})</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {sq.manifesto}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dual Action Buttons */}
            <div className="pt-3 space-y-2.5">
              <button
                type="submit"
                disabled={!displayName.trim() || isSubmitting}
                className="w-full min-h-[52px] rounded-xl bg-gradient-to-r from-[#4285F4] via-blue-600 to-[#34A853] hover:brightness-110 text-white font-black text-sm shadow-[0_0_30px_rgba(66,133,244,0.5)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
              >
                <span>📂 فك تشفير القضية وقبول المهمة (ACCEPT MISSION)</span>
                <ArrowRight size={18} />
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <button
                  type="button"
                  onClick={handleQuickStart}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>دخول سريع باسم عشوائي (Quick Play)</span>
                </button>
                <span>Google DGoC | TU · OVERLOAD503</span>
              </div>
            </div>

          </form>

        </div>

      </div>

    </div>
  );
};
