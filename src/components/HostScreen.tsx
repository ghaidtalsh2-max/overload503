import React, { useState } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  FastForward, 
  Shield, 
  CheckCircle2, 
  QrCode,
  Flame,
  Zap,
  Lock,
  Unlock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Agent, EventState, KillFeedItem, Squad } from '../types/game';
import { TimelineState } from '../services/timelineService';
import { sfx } from '../services/audioService';

interface HostScreenProps {
  timeline: TimelineState;
  agents: Agent[];
  killFeed: KillFeedItem[];
  sharedHealth: number;
  heapMemoryUsage: number;
  doorCodeInput?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartNow: () => void;
  onPauseResume: () => void;
  onSkipPhase: () => void;
  onEndGame: () => void;
}

export const HostScreen: React.FC<HostScreenProps> = ({
  timeline,
  agents,
  killFeed,
  sharedHealth,
  heapMemoryUsage,
  isMuted,
  onToggleMute,
  onStartNow,
  onPauseResume,
  onSkipPhase,
  onEndGame
}) => {
  const [showControls, setShowControls] = useState(true);

  const squadCounts = {
    sentinels: agents.filter((a) => a.squad === 'sentinels').length,
    neural: agents.filter((a) => a.squad === 'neural').length,
    vault: agents.filter((a) => a.squad === 'vault').length,
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://overload503.vercel.app';

  // Sort top agents
  const sortedAgents = [...agents].sort((a, b) => b.score - a.score);

  // Compute Squad averages for Leaderboard
  const squadAverages = (['sentinels', 'vault', 'neural'] as Squad[]).map((sq) => {
    const sqAgents = agents.filter((a) => a.squad === sq);
    const avg = sqAgents.length > 0 ? Math.round(sqAgents.reduce((acc, x) => acc + x.score, 0) / sqAgents.length) : 0;
    return { squad: sq, avg, count: sqAgents.length };
  }).sort((a, b) => b.avg - a.avg);

  return (
    <div 
      className={`min-h-screen w-full relative select-none font-cairo flex flex-col justify-between overflow-hidden ${
        timeline.activeAlarm ? 'vig' : ''
      }`}
      style={{
        boxSizing: 'border-box',
        padding: '16px',
        background: timeline.phase === 'SECURED' 
          ? 'radial-gradient(ellipse at 50% 0,#0e3a22,#07140f 55%,#030806)' 
          : 'radial-gradient(ellipse at 50% 0,#10224d 0,#070d1f 55%,#04070f 100%)',
        color: '#e8eefc',
        gap: '12px',
        direction: 'rtl'
      }}
    >
      {/* Subtle Scanlines Overlay */}
      <div className="sc" />

      {/* Optional Host Override Bar (Hidden by default, hover/click toggle button) */}
      <div className="absolute top-2 left-4 z-50 flex items-center gap-2">
        <button 
          onClick={() => setShowControls(!showControls)}
          className="px-2 py-1 rounded bg-[#0b1430]/80 border border-[#2b3a66] text-[10px] text-slate-400 font-mono hover:text-white"
        >
          HOST CONTROLS {showControls ? '▲' : '▼'}
        </button>

        {showControls && (
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#070d1f]/95 border border-[#4285F4]/40 shadow-xl">
            <button onClick={onStartNow} className="p-1 rounded bg-blue-600/30 text-blue-300 text-xs px-2 font-mono hover:bg-blue-600/50">
              START NOW
            </button>
            <button onClick={onPauseResume} className="p-1 rounded bg-yellow-600/30 text-yellow-300 text-xs px-2 font-mono hover:bg-yellow-600/50">
              PAUSE
            </button>
            <button onClick={onSkipPhase} className="p-1 rounded bg-purple-600/30 text-purple-300 text-xs px-2 font-mono hover:bg-purple-600/50">
              SKIP
            </button>
            <button onClick={onEndGame} className="p-1 rounded bg-red-600/30 text-red-300 text-xs px-2 font-mono hover:bg-red-600/50">
              END
            </button>
            <button onClick={onToggleMute} className="p-1 text-slate-300 hover:text-white">
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: LOBBY / NOMINAL (screen-1-lobby.html)                            */}
      {/* ========================================================================= */}
      {timeline.phase === 'LOBBY' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          
          {/* Header */}
          <div className="pn h-[60px] flex-none px-5 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <svg width="46" height="28" viewBox="0 0 46 28" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3 4 14" stroke="#4285F4"/>
                <path d="M4 14 15 25" stroke="#34A853"/>
                <path d="M31 3 42 14" stroke="#EA4335"/>
                <path d="M42 14 31 25" stroke="#FBBC05"/>
              </svg>
              <div className="leading-tight">
                <div className="mono font-extrabold text-[21px] tracking-wider text-white">503: OVERLOAD</div>
                <div className="text-[11px] text-[#8fa6d6] font-bold">Google DGoC | TU · Be Googley</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="mono text-[26px] font-extrabold text-[#7ee2a0] drop-shadow-[0_0_16px_#34A853]">
                ALL SYSTEMS NOMINAL
              </span>
              <span className="ch border-[#7ee2a0] text-[#7ee2a0]">STABLE</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="mono text-[#FBBC05] font-extrabold">
                INCIDENT IN 00:{String(Math.max(0, 45 - timeline.inPhaseSeconds)).padStart(2, '0')}
              </span>
              <span className="ch border-[#8ab4ff] text-[#8ab4ff]">{agents.length} لاعب</span>
            </div>
          </div>

          {/* 3 Columns Content */}
          <div className="flex-1 flex gap-3 min-h-0 relative">
            
            {/* Left: Agents Joining */}
            <div className="pn w-[290px] p-3.5 flex flex-col gap-2">
              <div className="ttl">AGENTS JOINING</div>
              <div className="flex gap-1.5 ltr">
                <span className="ch border-[#8ab4ff] text-[#8ab4ff]">Sentinels {squadCounts.sentinels}</span>
                <span className="ch border-[#FBBC05] text-[#FBBC05]">Neural {squadCounts.neural}</span>
                <span className="ch border-[#7ee2a0] text-[#7ee2a0]">Vault {squadCounts.vault}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
                {agents.slice(0, 7).map((agent, i) => (
                  <div key={agent.id || i} className="rq">
                    <span className="flex gap-2.5 items-center">
                      <i 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ background: agent.squad === 'sentinels' ? '#4285F4' : agent.squad === 'vault' ? '#34A853' : '#FBBC05' }}
                      />
                      {agent.displayName}
                    </span>
                    <span className="text-[#7ee2a0] font-bold">READY</span>
                  </div>
                ))}
                {agents.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-500 font-mono">
                    AWAITING AGENTS TO JOIN...
                  </div>
                )}
              </div>
            </div>

            {/* Center: PHP Engine Heap Healthy + Flow + Layers */}
            <div className="pn flex-1 p-4 flex flex-col gap-3.5 border-[#34A853]/60">
              <div className="ttl text-[#7ee2a0]">PHP ENGINE · HEAP MEMORY · HEALTHY</div>

              {/* 12 Healthy Blocks */}
              <div className="grid grid-cols-12 gap-1.5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`mc ${[2, 8, 11].includes(i) ? 'e' : 'm'}`} />
                ))}
              </div>

              <div className="mono text-center text-[#7ee2a0] text-xs font-extrabold">
                heap healthy · memory released after each request
              </div>

              {/* Request Flow */}
              <div className="flex items-center justify-between ltr gap-1.5 text-xs font-mono">
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">User</span>
                <span className="text-[#34A853] font-bold">→</span>
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">Web server</span>
                <span className="text-[#34A853] font-bold">→</span>
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">PHP engine</span>
                <span className="text-[#34A853] font-bold">→</span>
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">Database</span>
                <span className="text-[#34A853] font-bold">→</span>
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">Page</span>
              </div>

              {/* Layer Stack */}
              <div className="ttl">LAYER STACK</div>
              <div className="flex gap-2 ltr flex-wrap">
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">Applications (WordPress / Drupal)</span>
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">PHP Core Engine</span>
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">Web Server</span>
                <span className="ch border-[#34A853] text-[#34A853] p-1.5 px-2.5">Browser</span>
              </div>

              {/* Steady Rack LEDs */}
              <div className="flex gap-2.5 ltr mt-auto">
                {[false, true, false, true, false].map((blink, i) => (
                  <div key={i} className="flex-1 h-[54px] rounded bg-gradient-to-b from-[#13224a] to-[#0a1432] border border-[#2b3a66] flex justify-center py-1.5">
                    <div 
                      className={`led ${blink ? 'blink' : ''}`} 
                      style={{ background: 'repeating-linear-gradient(#34A853 0 5px, transparent 5px 12px)' }} 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Notifications Pile Up */}
            <div className="pn w-[330px] p-3.5 flex flex-col gap-2.5">
              <div className="ttl">NOTIFICATIONS</div>

              {timeline.notificationsCount >= 4 && (
                <div className="pulse p-2.5 rounded-xl border border-[#EA4335] bg-[#2a0d12] font-bold text-xs flex justify-between gap-2.5 items-center">
                  <span className="text-red-200">تنبيه: الذاكرة 94%</span>
                  <span className="mono text-[11px] text-[#8fa6d6]">14:02:09</span>
                </div>
              )}

              {timeline.notificationsCount >= 3 && (
                <div className="p-2.5 rounded-xl border border-[#FBBC05] bg-[#2b2406] font-bold text-xs flex justify-between gap-2.5 items-center">
                  <span className="text-yellow-200">تذكرة #503: خطأ 500 في صفحة الرفع</span>
                  <span className="mono text-[11px] text-[#8fa6d6]">14:02:05</span>
                </div>
              )}

              {timeline.notificationsCount >= 2 && (
                <div className="p-2.5 rounded-xl border border-[#FBBC05] bg-[#2b2406] font-bold text-xs flex justify-between gap-2.5 items-center">
                  <span className="text-yellow-200">تنبيه: الذاكرة 78%</span>
                  <span className="mono text-[11px] text-[#8fa6d6]">14:01:58</span>
                </div>
              )}

              {timeline.notificationsCount >= 1 && (
                <div className="p-2.5 rounded-xl border border-[#4285F4] bg-[#0d1d44] font-bold text-xs flex justify-between gap-2.5 items-center">
                  <span className="text-blue-200">عميل: الموقع بطيء جدًا</span>
                  <span className="mono text-[11px] text-[#8fa6d6]">14:01:50</span>
                </div>
              )}

              <div className="p-2.5 rounded-xl border border-[#2b3a66] bg-[#0b1430] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span className="text-slate-300 font-mono">monitoring: all nominal</span>
                <span className="mono text-[11px] text-[#8fa6d6]">14:01:30</span>
              </div>

              {/* QR Code and Join link */}
              <div className="mt-auto flex items-center gap-3 border-t border-[#2b3a66] pt-2.5">
                <div className="w-[70px] h-[70px] rounded-lg bg-white text-slate-700 flex items-center justify-center font-extrabold text-xs shadow">
                  <QrCode size={48} className="text-slate-800" />
                </div>
                <div>
                  <div className="ttl text-[#FBBC05]">JOIN NOW</div>
                  <div className="mono font-extrabold text-xs mt-1 text-white truncate max-w-[190px]">
                    {currentUrl.replace('http://', '').replace('https://', '')}
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: BREACH DETECTED (screen-2-breach.html)                           */}
      {/* ========================================================================= */}
      {timeline.phase === 'BREACH' && (
        <div className="flex-1 flex flex-col justify-between items-center py-2 relative">
          
          {/* Top Hazard Bar */}
          <div className="haz w-full h-[46px] flex-none rounded-xl flex items-center justify-center relative">
            <span className="mono blink bg-[#150608] text-[#ff6b5e] font-extrabold text-[15px] py-1 px-5 rounded-lg tracking-widest">
              WARNING · WARNING · WARNING
            </span>
          </div>

          {/* Central Breach Explosion */}
          <div className="flex flex-col items-center justify-center gap-4 text-center my-auto">
            <div className="mono gl font-extrabold text-[90px] leading-none text-[#EA4335]">
              BREACH DETECTED
            </div>

            <div className="text-[24px] font-black text-[#ffd9d4]">
              {timeline.breachHeadline || 'الخلل ليس في موقعك... بل تحته'}
            </div>

            <div className="flex items-center gap-5 my-1">
              <span className="mono text-[20px] font-extrabold text-[#ff8a80] tracking-widest">
                OVERLOAD IN
              </span>
              <span className="mono pulse text-[105px] font-extrabold text-[#EA4335] leading-none drop-shadow-[0_0_40px_#EA4335]">
                {timeline.overloadText}
              </span>
            </div>

            {/* 3 Stat Tiles */}
            <div className="flex gap-4">
              <div className="pn w-[230px] p-3.5 text-center border-[#EA4335]">
                <div className="mono text-[44px] font-extrabold text-[#EA4335] drop-shadow-[0_0_18px_#EA4335]">
                  9.2
                </div>
                <div className="ttl mt-1">CVSS v4.0</div>
              </div>

              <div className="pn w-[230px] p-3.5 text-center border-[#FBBC05]">
                <div className="mono text-[44px] font-extrabold text-[#FBBC05] drop-shadow-[0_0_18px_#FBBC05]">
                  70%
                </div>
                <div className="ttl mt-1">OF WEBSITES RUN PHP</div>
              </div>

              <div className="pn w-[230px] p-3.5 text-center border-[#4285F4]">
                <div className="mono text-[44px] font-extrabold text-[#4285F4] drop-shadow-[0_0_18px_#4285F4]">
                  2
                </div>
                <div className="ttl mt-1">CRITICAL CVES</div>
              </div>
            </div>

            {/* Threat Level */}
            <div className="flex items-center gap-2.5 mt-2">
              <span className="ttl">THREAT LEVEL</span>
              <i className="w-11 h-3 rounded-sm bg-[#34A853]" />
              <i className="w-11 h-3 rounded-sm bg-[#FBBC05]" />
              <i className="w-11 h-3 rounded-sm bg-[#FBBC05]" />
              <i className="w-11 h-3 rounded-sm bg-[#EA4335]" />
              <i className="blink w-11 h-3 rounded-sm bg-[#EA4335]" />
            </div>
          </div>

          {/* Bottom Hazard Bar */}
          <div className="haz w-full h-[46px] flex-none rounded-xl flex items-center justify-center relative">
            <span className="mono blink bg-[#150608] text-[#ff6b5e] font-extrabold text-[15px] py-1 px-5 rounded-lg tracking-widest">
              BREACH DETECTED · CVE-2026-109618 · CVE-2026-109619
            </span>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: LOGIN / AUTHENTICATION (screen-3-login.html)                    */}
      {/* ========================================================================= */}
      {timeline.phase === 'LOGIN' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          
          {/* Header */}
          <div className="pn h-[60px] flex-none px-5 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <svg width="46" height="28" viewBox="0 0 46 28" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3 4 14" stroke="#4285F4"/>
                <path d="M4 14 15 25" stroke="#34A853"/>
                <path d="M31 3 42 14" stroke="#EA4335"/>
                <path d="M42 14 31 25" stroke="#FBBC05"/>
              </svg>
              <div className="leading-tight">
                <div className="mono font-extrabold text-[21px] tracking-wider text-white">503: OVERLOAD</div>
                <div className="text-[11px] text-[#8fa6d6] font-bold">Google DGoC | TU · Be Googley</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="mono text-[22px] font-extrabold text-[#8ab4ff]">
                TERMINAL · AUTHENTICATION
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="mono pulse text-[26px] font-extrabold text-[#EA4335] drop-shadow-[0_0_14px_#EA4335]">
                {timeline.overloadText}
              </span>
            </div>
          </div>

          {/* 3 Columns */}
          <div className="flex-1 flex gap-3 min-h-0 relative">
            
            {/* Left: Ticket #503 */}
            <div className="w-[270px] flex flex-col gap-3">
              <div className="pn p-3.5 border-[#FBBC05]">
                <div className="ttl text-[#FBBC05]">TICKET #503</div>
                <div className="text-xs font-bold leading-relaxed my-1.5 text-slate-200">
                  كلمة مرور المناوب المؤقتة:
                </div>
                <div className="mono text-2xl font-extrabold text-[#FBBC05]">
                  Ov3r-503
                </div>
              </div>

              <div className="pn p-3.5">
                <div className="ttl">ATTEMPTS</div>
                <div className="mono text-3xl font-extrabold my-1 text-white">2 / 3</div>
                <div className="bar h-2.5">
                  <i style={{ width: '66%', background: '#FBBC05' }} />
                </div>
                <div className="text-xs text-[#ff8a80] font-bold mt-2">
                  3 محاولات خاطئة تقفل الحساب 10 ثوانٍ
                </div>
              </div>
            </div>

            {/* Center: Real Terminal with Stamp */}
            <div className="pn flex-1 p-4 flex flex-col border-[#34A853] relative">
              <div className="ttl text-[#7ee2a0] mb-2">soc@prod-04</div>
              
              <div className="lk flex-1 overflow-auto space-y-1">
                <div><span className="text-[#7ee2a0] font-extrabold">soc@prod-04:~$</span> ssh soc@prod-04</div>
                <div className="text-slate-400">soc@prod-04's password: ********</div>
                <div className="text-[#ff6b5e] font-extrabold">Permission denied, please try again.</div>
                <div className="text-slate-400">soc@prod-04's password: **********</div>
                <div className="text-[#7ee2a0] font-extrabold">ACCESS GRANTED</div>
                <div className="text-slate-500">Last login: Tue 14:02 from 10.0.0.12</div>
                <div className="text-[#FBBC05]">ALERT: 3 php-fpm workers unresponsive</div>
                <div><span className="text-[#7ee2a0] font-extrabold">soc@prod-04:~$</span> <span className="blink bg-[#7ee2a0] text-[#7ee2a0]">__</span></div>
              </div>

              {/* ACCESS GRANTED STAMP */}
              <div 
                className="mono absolute left-8 bottom-6 text-[34px] font-extrabold text-[#7ee2a0] border-[3px] border-[#34A853] rounded-2xl px-6 py-1.5 bg-[#07140f] shadow-[0_0_30px_rgba(52,168,83,0.7)]"
                style={{ transform: 'rotate(-3deg)' }}
              >
                ACCESS GRANTED
              </div>
            </div>

            {/* Right: Login Feed */}
            <div className="pn w-[300px] p-3.5 flex flex-col gap-2">
              <div className="ttl">LOGIN FEED</div>
              <div className="p-2.5 rounded-xl border border-[#34A853] bg-[#0c2415] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span className="text-emerald-200">Reem: ACCESS GRANTED +50</span>
                <span className="mono text-[11px] text-[#8fa6d6]">00:11</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#EA4335] bg-[#2a0d12] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span className="text-red-200">Sara: Permission denied</span>
                <span className="mono text-[11px] text-[#8fa6d6]">00:12</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#34A853] bg-[#0c2415] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span className="text-emerald-200">Nora: ACCESS GRANTED +50</span>
                <span className="mono text-[11px] text-[#8fa6d6]">00:14</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#4285F4] bg-[#0d1d44] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span className="text-blue-200">Faisal: typing password...</span>
                <span className="mono text-[11px] text-[#8fa6d6]">00:15</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#EA4335] bg-[#2a0d12] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span className="text-red-200">Lama: Permission denied</span>
                <span className="mono text-[11px] text-[#8fa6d6]">00:16</span>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: STATION 1 - TYPE-TO-BLOCK (screen-4-station1-type-to-block.html) */}
      {/* ========================================================================= */}
      {timeline.phase === 'STATION_1' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          
          {/* Header */}
          <div className="pn h-[60px] flex-none px-5 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <svg width="46" height="28" viewBox="0 0 46 28" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3 4 14" stroke="#4285F4"/>
                <path d="M4 14 15 25" stroke="#34A853"/>
                <path d="M31 3 42 14" stroke="#EA4335"/>
                <path d="M42 14 31 25" stroke="#FBBC05"/>
              </svg>
              <div className="leading-tight">
                <div className="mono font-extrabold text-[21px] tracking-wider text-white">503: OVERLOAD</div>
                <div className="text-[11px] text-[#8fa6d6] font-bold">Google DGoC | TU · Be Googley</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="mono text-[20px] font-extrabold text-white">
                STATION 1 · THE REQUEST
              </span>
              <span className="ch border-[#ff8a80] text-[#ff8a80]">CVE-2026-109618</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="mono pulse text-[28px] font-extrabold text-[#EA4335] drop-shadow-[0_0_14px_#EA4335]">
                {timeline.overloadText}
              </span>
              <span className="ch border-[#FBBC05] text-[#FBBC05]">x3 COMBO</span>
            </div>
          </div>

          {/* 3 Columns */}
          <div className="flex-1 flex gap-3 min-h-0 relative">
            
            {/* Left: Fastest Typists & Health */}
            <div className="pn w-[260px] p-3.5 flex flex-col gap-2">
              <div className="ttl">FASTEST TYPISTS</div>
              <div className="rq"><span><b className="text-[#FBBC05]">1</b> Reem</span><span className="text-[#8ab4ff]">74 WPM</span></div>
              <div className="rq"><span><b className="text-[#FBBC05]">2</b> Sara</span><span className="text-[#8ab4ff]">68 WPM</span></div>
              <div className="rq"><span><b className="text-[#FBBC05]">3</b> Nora</span><span className="text-[#8ab4ff]">61 WPM</span></div>
              <div className="rq"><span><b className="text-[#FBBC05]">4</b> Omar</span><span className="text-[#8ab4ff]">55 WPM</span></div>
              <div className="rq"><span><b className="text-[#FBBC05]">5</b> Haya</span><span className="text-[#8ab4ff]">49 WPM</span></div>

              <div className="mt-auto">
                <div className="ttl">SHARED SERVER HEALTH</div>
                <div className="bar h-3 mt-1.5">
                  <i 
                    style={{ 
                      width: `${Math.max(5, sharedHealth)}%`, 
                      background: 'linear-gradient(90deg,#FBBC05,#34A853)' 
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Center: 3 Lanes of Falling Requests */}
            <div className="pn flex-1 p-3.5 flex flex-col gap-3 border-[#EA4335]">
              <div className="ttl text-[#ff8a80]">REQUESTS FALLING · TYPE THE ID TO BLOCK</div>
              
              <div className="flex-1 flex gap-3 min-h-0">
                {/* Lane 1 */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="rq opacity-50"><span>GET /index.php 200</span><span className="text-[#7ee2a0]">OK</span></div>
                  <div className="rq border-[#EA4335] bg-[#2a0d12] shadow-[0_0_12px_rgba(234,67,53,0.5)]">
                    <span className="text-[#ff8a80]">POST /upload multipart</span>
                    <span className="ch border-[#EA4335] text-[#ff8a80]">req-4821</span>
                  </div>
                  <div className="rq opacity-50"><span>GET /assets/app.js</span><span className="text-[#7ee2a0]">OK</span></div>
                  <div className="rq border-[#EA4335] bg-[#2a0d12] shadow-[0_0_12px_rgba(234,67,53,0.5)]">
                    <span className="text-[#ff8a80]">GET /api 500 x3</span>
                    <span className="ch border-[#EA4335] text-[#ff8a80]">req-4822</span>
                  </div>
                  <div className="rq border-[#EA4335] bg-[#2a0d12] shadow-[0_0_12px_rgba(234,67,53,0.5)]">
                    <span className="text-[#ff8a80]">POST /upload multipart</span>
                    <span className="ch border-[#EA4335] text-[#ff8a80]">req-4823</span>
                  </div>
                </div>

                {/* Lane 2 */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="rq opacity-50"><span>GET / 200</span><span className="text-[#7ee2a0]">OK</span></div>
                  <div className="rq border-[#EA4335] bg-[#2a0d12] shadow-[0_0_12px_rgba(234,67,53,0.5)]">
                    <span className="text-[#ff8a80]">PHPSESSID oversized</span>
                    <span className="ch border-[#EA4335] text-[#ff8a80]">req-4824</span>
                  </div>
                  <div className="rq border-[#34A853] bg-[#0c2415] text-[#7ee2a0]">
                    <span className="line-through opacity-70">PHPSESSID=7f3a9c...</span>
                    <b>BLOCKED +120</b>
                  </div>
                  <div className="rq border-[#EA4335] bg-[#2a0d12] shadow-[0_0_12px_rgba(234,67,53,0.5)]">
                    <span className="text-[#ff8a80]">POST /upload multipart</span>
                    <span className="ch border-[#EA4335] text-[#ff8a80]">req-4825</span>
                  </div>
                  <div className="rq opacity-50"><span>GET /login 200</span><span className="text-[#7ee2a0]">OK</span></div>
                </div>

                {/* Lane 3 */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="rq border-[#EA4335] bg-[#2a0d12] shadow-[0_0_12px_rgba(234,67,53,0.5)]">
                    <span className="text-[#ff8a80]">POST /upload multipart</span>
                    <span className="ch border-[#EA4335] text-[#ff8a80]">req-4826</span>
                  </div>
                  <div className="rq opacity-50"><span>GET /favicon.ico 200</span><span className="text-[#7ee2a0]">OK</span></div>
                  <div className="rq border-[#EA4335] bg-[#2a0d12] shadow-[0_0_12px_rgba(234,67,53,0.5)]">
                    <span className="text-[#ff8a80]">GET /api 500 x2</span>
                    <span className="ch border-[#EA4335] text-[#ff8a80]">req-4827</span>
                  </div>
                  <div className="rq border-[#34A853] bg-[#0c2415] text-[#7ee2a0]">
                    <span className="line-through opacity-70">POST /upload multipart</span>
                    <b>BLOCKED +120</b>
                  </div>
                  <div className="rq opacity-50"><span>GET /about 200</span><span className="text-[#7ee2a0]">OK</span></div>
                </div>
              </div>

              {/* Heap Memory Pressure Bar */}
              <div>
                <div className="mono text-xs font-extrabold text-[#ff8a80] flex justify-between ltr">
                  <span>HEAP MEMORY</span>
                  <span>{heapMemoryUsage}%</span>
                </div>
                <div className="bar h-3.5 mt-1">
                  <i 
                    style={{ 
                      width: `${heapMemoryUsage}%`, 
                      background: 'linear-gradient(90deg,#FBBC05,#EA4335)', 
                      boxShadow: '0 0 14px #EA4335' 
                    }} 
                  />
                </div>
              </div>
            </div>

            {/* Right: Kill Feed + Attack Wave Box */}
            <div className="pn w-[320px] p-3.5 flex flex-col gap-2">
              <div className="ttl">KILL FEED</div>
              <div className="p-2.5 rounded-xl border border-[#34A853] bg-[#0c2415] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span>Reem blocked req-4821 x3 +120</span>
                <span className="mono text-[11px] text-[#8fa6d6]">now</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#34A853] bg-[#0c2415] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span>Sara blocked req-4822 +60</span>
                <span className="mono text-[11px] text-[#8fa6d6]">2s</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#EA4335] bg-[#2a0d12] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span className="text-[#ff8a80]">Faisal typed clean request -10</span>
                <span className="mono text-[11px] text-[#8fa6d6]">4s</span>
              </div>
              <div className="p-2.5 rounded-xl border border-[#34A853] bg-[#0c2415] font-bold text-xs flex justify-between gap-2.5 items-center">
                <span>Nora blocked req-4824 +60</span>
                <span className="mono text-[11px] text-[#8fa6d6]">6s</span>
              </div>

              <div className="pn pulse mt-auto p-3 text-center border-[#FBBC05] bg-[#2b2406]">
                <div className="ttl text-[#FBBC05]">ATTACK WAVE IN</div>
                <div className="mono text-[34px] font-extrabold text-[#FBBC05]">00:08</div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 5: STATION 2 - THE MEMORY (screen-5-station2-memory.html)           */}
      {/* ========================================================================= */}
      {timeline.phase === 'STATION_2' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          
          {/* Header */}
          <div className="pn h-[60px] flex-none px-5 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <svg width="46" height="28" viewBox="0 0 46 28" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3 4 14" stroke="#4285F4"/>
                <path d="M4 14 15 25" stroke="#34A853"/>
                <path d="M31 3 42 14" stroke="#EA4335"/>
                <path d="M42 14 31 25" stroke="#FBBC05"/>
              </svg>
              <div className="leading-tight">
                <div className="mono font-extrabold text-[21px] tracking-wider text-white">503: OVERLOAD</div>
                <div className="text-[11px] text-[#8fa6d6] font-bold">Google DGoC | TU · Be Googley</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <span className="mono text-xs font-extrabold text-[#ff8a80] tracking-widest">OVERLOAD IN</span>
              <span className="mono pulse text-[40px] font-extrabold text-[#EA4335] leading-none drop-shadow-[0_0_18px_#EA4335]">
                {timeline.overloadText}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="mono text-[10px] text-[#8fa6d6] font-extrabold tracking-widest">THREAT LEVEL</div>
                <div className="flex gap-1 mt-1">
                  <i className="w-4 h-2.5 rounded-sm bg-[#34A853]" />
                  <i className="w-4 h-2.5 rounded-sm bg-[#FBBC05]" />
                  <i className="w-4 h-2.5 rounded-sm bg-[#FBBC05]" />
                  <i className="w-4 h-2.5 rounded-sm bg-[#EA4335]" />
                  <i className="blink w-4 h-2.5 rounded-sm bg-[#EA4335]" />
                </div>
              </div>
              <div className="mono py-1.5 px-3 rounded-xl bg-[#0b1430] border border-[#2b3a66] font-extrabold text-xs">
                PIN {timeline.doorCode}
              </div>
              <div className="py-1.5 px-3 rounded-xl bg-[#12275a] text-[#9fc0ff] font-extrabold text-xs">
                {agents.length} لاعب
              </div>
            </div>
          </div>

          {/* Hazard Alert Bar */}
          <div className="haz h-[40px] flex-none rounded-xl relative flex items-center justify-center">
            <div className="bg-[#150608] py-1 px-5 rounded-lg flex items-center gap-3 font-black text-sm text-[#ff6b5e] border border-[#EA4335]">
              <span className="mono blink tracking-wider">BREACH DETECTED</span>
              <span>الغرفة 2 · مؤشر معلّق يشير إلى ذاكرة محرّرة</span>
              <span className="mono text-[#FBBC05]">CVE-2026-109619</span>
            </div>
          </div>

          {/* 3 Columns */}
          <div className="flex-1 flex gap-3 min-h-0 relative">
            
            {/* Left: Rooms / Stations Nav + Rack LEDs */}
            <div className="w-[250px] flex flex-col gap-2.5">
              <div className="pn p-2.5 px-3.5 flex items-center gap-2.5 border-[#34A853]">
                <div className="w-7 h-7 rounded-full bg-[#34A853] flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-[#04110a]" />
                </div>
                <div>
                  <div className="mono font-extrabold text-xs text-white">1 · MEMORY VAULT</div>
                  <div className="text-[11px] text-[#7ee2a0] font-bold">UNLOCKED</div>
                </div>
              </div>

              <div className="pn pulse p-3 px-3.5 flex items-center gap-2.5 border-2 border-[#EA4335] shadow-[0_0_26px_rgba(234,67,53,0.55)]">
                <div className="w-7 h-7 rounded-full bg-[#EA4335] flex items-center justify-center font-black text-[#150608] text-sm">
                  2
                </div>
                <div>
                  <div className="mono font-extrabold text-xs text-white">2 · DANGLING CORRIDOR</div>
                  <div className="mono text-[11px] text-[#ff8a80] font-extrabold">ALERT · ACTIVE</div>
                </div>
              </div>

              <div className="pn p-2.5 px-3.5 flex items-center gap-2.5 opacity-60">
                <Lock size={20} className="text-[#8fa6d6]" />
                <div>
                  <div className="mono font-extrabold text-xs text-white">3 · PATCH LAB</div>
                  <div className="text-[11px] text-[#8fa6d6] font-bold">LOCKED</div>
                </div>
              </div>

              <div className="pn p-2.5 px-3.5 flex items-center gap-2.5 opacity-60">
                <Lock size={20} className="text-[#8fa6d6]" />
                <div>
                  <div className="mono font-extrabold text-xs text-white">4 · CORE REBOOT</div>
                  <div className="text-[11px] text-[#8fa6d6] font-bold">LOCKED</div>
                </div>
              </div>

              {/* Server Room LEDs */}
              <div className="pn flex-1 p-3 flex flex-col gap-2">
                <div className="mono text-[11px] font-extrabold text-[#8fa6d6] tracking-wider">SERVER ROOM · LIVE</div>
                <div className="flex-1 flex gap-2 items-stretch justify-center ltr">
                  <div className="w-9 rounded bg-gradient-to-b from-[#13224a] to-[#0a1432] border border-[#2b3a66] flex justify-center py-1.5"><div className="led" style={{ background: 'repeating-linear-gradient(#34A853 0 5px,transparent 5px 12px)' }} /></div>
                  <div className="w-9 rounded bg-gradient-to-b from-[#13224a] to-[#0a1432] border border-[#2b3a66] flex justify-center py-1.5"><div className="led blink" style={{ background: 'repeating-linear-gradient(#4285F4 0 5px,transparent 5px 12px)' }} /></div>
                  <div className="w-9 rounded bg-gradient-to-b from-[#2a0d12] to-[#12060a] border border-[#EA4335] shadow-[0_0_14px_rgba(234,67,53,0.6)] flex justify-center py-1.5"><div className="led blink" style={{ background: 'repeating-linear-gradient(#EA4335 0 5px,transparent 5px 12px)' }} /></div>
                  <div className="w-9 rounded bg-gradient-to-b from-[#13224a] to-[#0a1432] border border-[#2b3a66] flex justify-center py-1.5"><div className="led" style={{ background: 'repeating-linear-gradient(#FBBC05 0 5px,transparent 5px 12px)' }} /></div>
                  <div className="w-9 rounded bg-gradient-to-b from-[#13224a] to-[#0a1432] border border-[#2b3a66] flex justify-center py-1.5"><div className="led blink" style={{ background: 'repeating-linear-gradient(#34A853 0 5px,transparent 5px 12px)' }} /></div>
                </div>
              </div>
            </div>

            {/* Center: Exact PHP Heap Diagram with Converging Dashed Lines */}
            <div className="pn flex-1 p-3.5 flex flex-col gap-2.5 ltr border-[#EA4335]">
              <div className="flex items-center justify-between">
                <div className="mono font-extrabold text-sm tracking-wider text-white">
                  PHP ENGINE · HEAP MEMORY <span className="text-[#ff8a80]">· USE-AFTER-FREE</span>
                </div>
                <div className="mono blink text-xs font-extrabold text-[#FBBC05]">● LIVE</div>
              </div>

              {/* SVG Diagram with Converging Dashed Paths */}
              <svg width="100%" height="110" viewBox="0 0 604 110" aria-label="Stale pointer and new request pointing to same freed block">
                <rect x="2" y="6" width="200" height="38" rx="8" fill="#2a0d12" stroke="#EA4335" strokeWidth="2"/>
                <text x="102" y="22" textAnchor="middle" fill="#ff8a80" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono">global_backtrace_ptr</text>
                <text x="102" y="36" textAnchor="middle" fill="#ffb3ab" fontSize="10" fontFamily="JetBrains Mono">= 0x7f3a (STALE)</text>

                <rect x="402" y="6" width="200" height="38" rx="8" fill="#2b2406" stroke="#FBBC05" strokeWidth="2"/>
                <text x="502" y="22" textAnchor="middle" fill="#FBBC05" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono">NEW REQUEST #2</text>
                <text x="502" y="36" textAnchor="middle" fill="#ffe08a" fontSize="10" fontFamily="JetBrains Mono">reuses the freed block</text>

                <path className="dash" d="M102 44 C102 85 240 75 302 105" fill="none" stroke="#EA4335" strokeWidth="3"/>
                <path className="dash" d="M502 44 C502 85 380 75 302 105" fill="none" stroke="#FBBC05" strokeWidth="3"/>
                <path d="M294 95 302 109 310 95" fill="#fff"/>
              </svg>

              {/* 12 Memory Cells */}
              <div className="grid grid-cols-12 gap-1.5 -mt-1">
                <div className="mc m">a1</div><div className="mc m">b7</div><div className="mc e" /><div className="mc m">c2</div>
                <div className="mc m">9e</div><div className="mc m">d4</div>
                <div className="mc x">FREED</div>
                <div className="mc m">f0</div><div className="mc e" /><div className="mc m">3c</div><div className="mc m">e8</div><div className="mc e" />
              </div>

              <div className="mono text-center text-xs font-extrabold text-[#ff8a80]">
                ▲ 0x7f3a · PHP still trusts this address
              </div>

              {/* 3 Concept Cards */}
              <div className="grid grid-cols-3 gap-2 rtl">
                <div className="rounded-xl p-2.5 bg-[#2a0d12] border border-[#EA4335]">
                  <div className="mono text-xs font-extrabold text-[#ff8a80] ltr text-right">1 · OOM FATAL ERROR</div>
                  <div className="text-xs font-bold mt-1 leading-snug">الذاكرة نفدت والطلب انهار فجأة دون إكمال تنظيف المؤشرات.</div>
                </div>
                <div className="rounded-xl p-2.5 bg-[#2b2406] border border-[#FBBC05]">
                  <div className="mono text-xs font-extrabold text-[#FBBC05] ltr text-right">2 · STALE POINTER</div>
                  <div className="text-xs font-bold mt-1 leading-snug">بقي مؤشر عام يشير لكتلة تم تحريرها وإعادتها للمجمع.</div>
                </div>
                <div className="rounded-xl p-2.5 bg-[#0d1d44] border border-[#4285F4]">
                  <div className="mono text-xs font-extrabold text-[#8ab4ff] ltr text-right">3 · REUSE → TRUST</div>
                  <div className="text-xs font-bold mt-1 leading-snug">طلب جديد يشغل المكان ذاته والمحرك يثق بالمؤشر القديم (RCE).</div>
                </div>
              </div>

              {/* Clear The Pointer Action */}
              <div className="flex items-center gap-3 rtl mt-auto">
                <button 
                  onClick={() => sfx.unlock()}
                  className="flex-1 h-[48px] border-0 rounded-xl bg-gradient-to-r from-[#EA4335] to-[#c5221f] text-white font-mono font-extrabold text-base tracking-wider shadow-[0_0_24px_rgba(234,67,53,0.7)] cursor-pointer active:scale-95 transition"
                >
                  CLEAR THE POINTER
                </button>
                <div className="w-[180px]">
                  <div className="mono text-[11px] font-extrabold text-[#ff8a80] ltr text-right">NEXT REQUEST IN 0:04</div>
                  <div className="h-2 rounded bg-[#0b1430] mt-1 overflow-hidden">
                    <i className="block w-[35%] h-full bg-[#EA4335] shadow-[0_0_10px_#EA4335]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Terminal Logs & Door Code */}
            <div className="w-[330px] flex flex-col gap-2.5">
              
              {/* Terminal Logs */}
              <div className="pn flex-1 p-3 flex flex-col gap-1.5 ltr border-[#34A853]">
                <div className="mono text-[11px] font-extrabold text-[#7ee2a0] tracking-wider">TERMINAL · /var/log/php</div>
                <div className="mono text-[11px] leading-relaxed text-[#9fb4e0] space-y-1 overflow-auto">
                  <div>14:02:11 POST /upload multipart 200</div>
                  <div className="text-[#ff6b5e] font-extrabold">14:02:12 FATAL memory size exhausted</div>
                  <div className="text-[#FBBC05]">14:02:12 WARN ptr 0x7f3a not cleared</div>
                  <div>14:02:13 GET /index.php <span className="text-[#ff6b5e] font-extrabold">500</span></div>
                  <div className="text-[#ff6b5e] font-extrabold">14:02:13 Set-Cookie: PHPSESSID=</div>
                  <div className="text-[#ff6b5e] break-all">7f3a9c1e5b02d4a87e6f10c3b9a2…</div>
                  <div className="text-[#ff6b5e] font-extrabold blink">14:02:14 ALERT block reused</div>
                  <div className="text-[#7ee2a0]">&gt; awaiting response<span className="blink">█</span></div>
                </div>
                <div className="mt-auto text-[10px] text-[#8fa6d6] rtl font-bold">
                  رموز وبيانات وهمية للمحاكاة فقط.
                </div>
              </div>

              {/* Door Code Panel */}
              <div className="pn p-3 flex flex-col gap-2 border-[#FBBC05]">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm">رمز الباب</div>
                  <div className="mono font-extrabold text-sm text-[#FBBC05]">
                    0:0{timeline.doorCodeExpiresIn}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 ltr">
                  <div className="mono h-12 rounded-xl bg-[#0d1d44] border-2 border-[#4285F4] flex items-center justify-center text-2xl font-extrabold text-[#8ab4ff] shadow-[0_0_12px_rgba(66,133,244,0.5)]">
                    {timeline.doorCode[0] || '4'}
                  </div>
                  <div className="mono h-12 rounded-xl bg-[#0d1d44] border-2 border-[#4285F4] flex items-center justify-center text-2xl font-extrabold text-[#8ab4ff] shadow-[0_0_12px_rgba(66,133,244,0.5)]">
                    {timeline.doorCode[1] || '8'}
                  </div>
                  <div className="mono blink h-12 rounded-xl bg-[#0b1430] border-2 border-dashed border-[#FBBC05] flex items-center justify-center text-2xl font-extrabold text-[#FBBC05]">
                    {timeline.doorCode[2] || '_'}
                  </div>
                  <div className="mono h-12 rounded-xl bg-[#0b1430] border-2 border-dashed border-[#2b3a66] flex items-center justify-center text-2xl font-extrabold text-[#2b3a66]">
                    {timeline.doorCode[3] || '_'}
                  </div>
                </div>

                <div className="h-2 rounded bg-[#0b1430] overflow-hidden">
                  <i 
                    className="block h-full bg-[#FBBC05] shadow-[0_0_10px_#FBBC05]" 
                    style={{ width: `${(timeline.doorCodeExpiresIn / 8) * 100}%` }} 
                  />
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* DOOR CODE TRANSITION PHASES (DOOR_1, DOOR_2, DOOR_3)                      */}
      {/* ========================================================================= */}
      {(timeline.phase === 'DOOR_1' || timeline.phase === 'DOOR_2' || timeline.phase === 'DOOR_3') && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 my-auto">
          <div className="pn p-6 max-w-md w-full text-center border-[#FBBC05] shadow-[0_0_40px_rgba(251,188,5,0.25)] space-y-4">
            <div className="inline-flex p-3 rounded-full bg-[#2b2406] text-[#FBBC05] border border-[#FBBC05]/40 animate-pulse">
              <Lock size={32} />
            </div>
            <h2 className="mono text-2xl font-black text-white">CORRIDOR ACCESS CODE</h2>
            <p className="text-xs text-slate-300">
              أدخل رمز الباب على جهازك قبل نفاذ الوقت أو سيفتح الباب تلقائياً بعد {timeline.doorCodeExpiresIn} ثوانٍ
            </p>

            <div className="grid grid-cols-4 gap-3 ltr my-3">
              {timeline.doorCode.split('').map((digit, i) => (
                <div key={i} className="mono h-14 rounded-xl bg-[#0d1d44] border-2 border-[#FBBC05] flex items-center justify-center text-3xl font-black text-[#FBBC05] shadow-[0_0_15px_rgba(251,188,5,0.4)]">
                  {digit}
                </div>
              ))}
            </div>

            <div className="bar h-2">
              <i style={{ width: `${(timeline.doorCodeExpiresIn / 8) * 100}%`, background: '#FBBC05' }} />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 3: OPCACHE CONVEYOR & SESSIONS                                    */}
      {/* ========================================================================= */}
      {timeline.phase === 'STATION_3' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="pn h-[60px] flex-none px-5 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="mono font-extrabold text-[20px] text-white">503: OVERLOAD</div>
              <div className="text-xs text-[#8fa6d6]">STATION 3 · OPCACHE &amp; SESSIONS</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="mono text-xs font-bold text-[#FBBC05]">TYPE CONFUSION PREVENTED</span>
              <span className="ch border-[#FBBC05] text-[#FBBC05]">CVE-2026-109619</span>
            </div>
            <div className="mono pulse text-[28px] font-extrabold text-[#EA4335]">
              {timeline.overloadText}
            </div>
          </div>

          <div className="flex-1 flex gap-3 min-h-0">
            {/* Left: OPcache Conveyor Boxes */}
            <div className="pn flex-1 p-4 flex flex-col gap-3 border-[#FBBC05]/60">
              <div className="ttl text-[#FBBC05]">OPCACHE SHARED MEMORY CONVEYOR · FLAG MISMATCHED BOXES</div>
              
              <div className="flex-1 flex items-center justify-around gap-3 ltr bg-[#060c20]/60 p-4 rounded-xl border border-slate-800">
                {[
                  { id: 'box-10', label: 'scripts', content: 'scripts', ok: true },
                  { id: 'box-11', label: 'cached_ast', content: 'cached_ast', ok: true },
                  { id: 'box-12', label: 'papers', content: 'sharp_object', ok: false },
                  { id: 'box-13', label: 'user_tokens', content: 'user_tokens', ok: true },
                  { id: 'box-14', label: 'classes', content: 'corrupted_zval', ok: false }
                ].map((box, i) => (
                  <div 
                    key={box.id}
                    className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                      box.ok 
                        ? 'border-blue-500/40 bg-blue-950/20 text-blue-200'
                        : 'border-[#EA4335] bg-red-950/40 text-red-200 shadow-[0_0_15px_rgba(234,67,53,0.4)] animate-pulse'
                    }`}
                  >
                    <span className="mono font-black text-sm text-yellow-400">{box.id}</span>
                    <span className="text-[10px] text-slate-400 font-mono">LABEL: {box.label}</span>
                    <span className="text-[10px] font-mono font-bold">{box.ok ? `[OK: ${box.content}]` : `[MISMATCH: ${box.content}]`}</span>
                    <span className="text-[10px] mt-1 text-slate-300 font-mono">TYPE: flag {box.id}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-300 px-2">
                <span>LOCAL COUNTER: 1,482 zvals</span>
                <span className="text-[#EA4335] font-bold">SHARED COUNTER: 1,479 zvals (DISAGREE!)</span>
              </div>
            </div>

            {/* Right: Leaked Sessions Rotate */}
            <div className="pn w-[320px] p-4 flex flex-col gap-2.5">
              <div className="ttl">ACTIVE SESSIONS · PHPSESSID</div>
              <div className="text-xs text-slate-300">
                كوكيز معرّضة للتسريب: اكتب <code className="text-yellow-400 font-mono">rotate &lt;chars&gt;</code> لتجديدها
              </div>

              <div className="space-y-1.5 flex-1 overflow-auto ltr text-xs font-mono">
                <div className="p-2 rounded bg-red-950/40 border border-red-500/50 flex justify-between">
                  <span className="text-red-300">PHPSESSID=7f3a9c...</span>
                  <span className="text-[#ff8a80] font-bold">LEAKED</span>
                </div>
                <div className="p-2 rounded bg-[#0b1430] border border-slate-700 flex justify-between">
                  <span className="text-slate-300">PHPSESSID=a1b2c3...</span>
                  <span className="text-emerald-400 font-bold">SAFE</span>
                </div>
                <div className="p-2 rounded bg-red-950/40 border border-red-500/50 flex justify-between">
                  <span className="text-red-300">PHPSESSID=c4e908...</span>
                  <span className="text-[#ff8a80] font-bold">LEAKED</span>
                </div>
                <div className="p-2 rounded bg-[#0b1430] border border-slate-700 flex justify-between">
                  <span className="text-slate-300">PHPSESSID=88fa91...</span>
                  <span className="text-emerald-400 font-bold">SAFE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATION 4: THE FIX & METERS                                               */}
      {/* ========================================================================= */}
      {timeline.phase === 'STATION_4' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="pn h-[60px] flex-none px-5 flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="mono font-extrabold text-[20px] text-white">503: OVERLOAD</div>
              <div className="text-xs text-[#8fa6d6]">STATION 4 · THE FIX &amp; VERIFICATION</div>
            </div>
            <div className="flex items-center gap-3">
              <span className="mono text-xs font-bold text-[#34A853]">VENDOR PATCH LAB</span>
              <span className="ch border-[#34A853] text-[#34A853]">PHP 8.4.27</span>
            </div>
            <div className="mono pulse text-[28px] font-extrabold text-[#EA4335]">
              {timeline.overloadText}
            </div>
          </div>

          <div className="flex-1 flex gap-3 min-h-0">
            {/* Terminal Checklist & Status */}
            <div className="pn flex-1 p-4 flex flex-col gap-3 border-[#4285F4]/60">
              <div className="ttl text-[#8ab4ff]">REMEDIATION CHECKLIST (RUN IN TERMINAL)</div>
              
              <div className="space-y-2 ltr font-mono text-xs flex-1">
                <div className="p-3 rounded-xl bg-[#091124] border border-slate-800 flex items-center justify-between">
                  <span>1. BACKUP LOGS (backup logs)</span>
                  <span className="text-emerald-400 font-bold">EVIDENCE</span>
                </div>
                <div className="p-3 rounded-xl bg-[#091124] border border-slate-800 flex items-center justify-between">
                  <span>2. APPLY VENDOR PATCH (sudo apt install php8.4=8.4.27)</span>
                  <span className="text-yellow-400 font-bold">ROOT FIX</span>
                </div>
                <div className="p-3 rounded-xl bg-[#091124] border border-slate-800 flex items-center justify-between">
                  <span>3. RESTART ENGINE (sudo systemctl restart php-fpm)</span>
                  <span className="text-blue-400 font-bold">RELOAD</span>
                </div>
                <div className="p-3 rounded-xl bg-[#091124] border border-slate-800 flex items-center justify-between">
                  <span>4. FINAL VERIFICATION (verify)</span>
                  <span className="text-purple-400 font-bold">VERIFY</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-yellow-950/30 border border-yellow-500/40 text-xs text-yellow-200">
                ⚠️ تذكّر الفخ: تحديث ووردبريس أو إعادة التشغيل وحدها لا يحل ثغرة المحرك!
              </div>
            </div>

            {/* Meters Panel */}
            <div className="pn w-[320px] p-4 flex flex-col gap-3">
              <div className="ttl">DEFENSIVE METRICS</div>
              
              <div>
                <div className="flex justify-between text-xs font-mono font-bold ltr">
                  <span className="text-[#EA4335]">EXPOSURE</span>
                  <span>38%</span>
                </div>
                <div className="bar h-2.5 mt-1"><i style={{ width: '38%', background: '#EA4335' }} /></div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono font-bold ltr">
                  <span className="text-[#34A853]">AVAILABILITY</span>
                  <span>92%</span>
                </div>
                <div className="bar h-2.5 mt-1"><i style={{ width: '92%', background: '#34A853' }} /></div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono font-bold ltr">
                  <span className="text-[#4285F4]">INTEGRITY</span>
                  <span>96%</span>
                </div>
                <div className="bar h-2.5 mt-1"><i style={{ width: '96%', background: '#4285F4' }} /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 6: HALL OF DEFENDERS (screen-6-hall-of-defenders.html)             */}
      {/* ========================================================================= */}
      {timeline.phase === 'SECURED' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          
          {/* Header */}
          <div className="pn h-[70px] flex-none border-[#34A853] shadow-[0_0_30px_rgba(52,168,83,0.35)] flex items-center justify-between px-6 relative">
            <div className="flex items-center gap-3.5">
              <svg width="46" height="28" viewBox="0 0 46 28" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3 4 14" stroke="#4285F4"/>
                <path d="M4 14 15 25" stroke="#34A853"/>
                <path d="M31 3 42 14" stroke="#EA4335"/>
                <path d="M42 14 31 25" stroke="#FBBC05"/>
              </svg>
              <div className="mono font-extrabold text-2xl tracking-widest ltr text-white">
                HALL OF DEFENDERS
              </div>
            </div>

            <div className="mono text-[26px] font-extrabold text-[#7ee2a0] drop-shadow-[0_0_18px_#34A853] ltr">
              SYSTEM SECURED
            </div>

            <div className="text-xs text-[#8fa6d6] font-bold">
              بيانات حية من السيرفر
            </div>
          </div>

          {/* 2 Main Columns */}
          <div className="flex-1 flex gap-3.5 min-h-0 relative">
            
            {/* Left: Top Agents Leaderboard */}
            <div className="pn flex-[1.35] p-4 flex flex-col gap-2 ltr">
              <div className="mono text-xs font-extrabold text-[#8fa6d6] tracking-widest">
                TOP AGENTS
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {sortedAgents.slice(0, 7).map((agent, index) => {
                  const rankTitle = agent.score >= 800 ? 'ROOT' : agent.score >= 600 ? 'GUARDIAN' : agent.score >= 400 ? 'HUNTER' : agent.score >= 200 ? 'ANALYST' : 'ROOKIE';
                  const isTop1 = index === 0;
                  const isTop2 = index === 1;
                  const isTop3 = index === 2;

                  return (
                    <div 
                      key={agent.id || index}
                      className={`rq ${
                        isTop1 ? 'p-3 border-[#FBBC05] bg-[#2b2406] shadow-[0_0_20px_rgba(251,188,5,0.35)]' : 'p-2.5'
                      }`}
                    >
                      <span className="flex gap-3.5 items-center">
                        <b className={`text-lg ${isTop1 ? 'text-[#FBBC05]' : isTop2 ? 'text-slate-300' : isTop3 ? 'text-amber-600' : 'text-slate-500'}`}>
                          {index + 1}
                        </b>
                        <i 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ background: agent.squad === 'sentinels' ? '#4285F4' : agent.squad === 'vault' ? '#34A853' : '#FBBC05' }}
                        />
                        <b className="text-sm text-white">{agent.displayName}</b>
                        <span className={`text-[11px] font-extrabold ${isTop1 ? 'text-[#FBBC05]' : 'text-[#7ee2a0]'}`}>
                          {rankTitle}
                        </span>
                      </span>
                      <b className="text-base text-white">{agent.score}</b>
                    </div>
                  );
                })}
              </div>

              {/* Earned Badges Row */}
              <div className="mt-auto flex gap-2 flex-wrap pt-2">
                <span className="ch border-[#34A853] text-[#7ee2a0]">ZERO LEAK</span>
                <span className="ch border-[#4285F4] text-[#8ab4ff]">PATCH MASTER</span>
                <span className="ch border-[#FBBC05] text-[#FBBC05]">TRAP DODGER</span>
                <span className="ch border-[#EA4335] text-[#ff8a80]">COMBO BREAKER</span>
              </div>
            </div>

            {/* Right: Squads Average & Paper Bridge Card */}
            <div className="flex-1 flex flex-col gap-3.5">
              
              {/* Squad Leaderboard by Average */}
              <div className="pn p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="font-black text-base">ترتيب الفرق (متوسط الفرد)</div>
                  <span className="ch border-[#FBBC05] text-[#FBBC05] py-0.5 px-2.5">TOP SQUAD</span>
                </div>

                {squadAverages.map((sq, i) => (
                  <div key={sq.squad} className="flex items-center gap-2.5 ltr">
                    {i === 0 ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#FBBC05" aria-hidden="true">
                        <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/>
                      </svg>
                    ) : (
                      <span className="w-[22px]" />
                    )}
                    <b className="mono w-[90px] capitalize text-white">{sq.squad}</b>
                    <div className="bar flex-1 h-3.5">
                      <i 
                        style={{ 
                          width: `${Math.min(100, Math.max(10, (sq.avg / 1000) * 100))}%`, 
                          background: sq.squad === 'sentinels' ? '#4285F4' : sq.squad === 'vault' ? '#34A853' : '#FBBC05',
                          boxShadow: i === 0 ? '0 0 10px #4285F4' : 'none'
                        }} 
                      />
                    </div>
                    <b className="mono w-[80px] text-right text-white">
                      {sq.avg} <span className="text-[11px] text-[#8fa6d6]">x{sq.count}</span>
                    </b>
                  </div>
                ))}
              </div>

              {/* Paper Bridge Card with QR */}
              <div className="pn flex-1 p-4 flex items-center gap-4 border-[#4285F4] shadow-[0_0_28px_rgba(66,133,244,0.3)]">
                <div className="flex-1">
                  <div className="font-black text-lg leading-snug text-white">
                    النظام آمن... لكن القصة لم تنتهِ
                  </div>
                  <div className="text-xs text-[#9fb4e0] font-bold mt-1.5 leading-relaxed">
                    كيف اكتُشفت الثغرتان؟ ما دور الذكاء الاصطناعي؟ وكيف نحمي مواقعنا وسيرفراتنا؟
                  </div>
                  <a
                    href="https://github.com/ghaidtalsh2-max/overload503"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 h-[44px] rounded-xl bg-gradient-to-r from-[#4285F4] to-[#1a56c4] flex items-center justify-center font-black text-sm text-white shadow-[0_0_22px_rgba(66,133,244,0.6)] cursor-pointer no-underline active:scale-95 transition"
                  >
                    اقرأ ورقة PHP2Shell
                  </a>
                </div>

                <div className="w-[110px] h-[110px] rounded-xl bg-white flex items-center justify-center text-slate-800 font-extrabold text-xs shadow-lg">
                  <QrCode size={80} className="text-slate-800" />
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
