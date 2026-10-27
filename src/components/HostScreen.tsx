import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  FastForward, 
  Flame, 
  Zap, 
  QrCode, 
  Users, 
  X,
  UserX,
  Radio
} from 'lucide-react';
import { EventState, Agent, StationId, KillFeedItem } from '../types/game';
import { STATIONS } from '../data/gameData';
import { sfx } from '../services/audioService';

interface HostScreenProps {
  eventState: EventState;
  agents: Agent[];
  killFeed: KillFeedItem[];
  lobbyRemaining: number | null; // null if waiting for players
  onStartNow: () => void;
  onPauseResume: () => void;
  onSkipStation: () => void;
  onToggleAutopilot: () => void;
  onTriggerAttackWave: () => void;
  onTriggerPowerFlicker: () => void;
  onEndIncident: () => void;
  onResetEvent: () => void;
  onToggleRegistration: () => void;
  onKickAgent: (agentId: string) => void;
  onTriggerRandomEvent: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HostScreen: React.FC<HostScreenProps> = ({
  eventState,
  agents,
  killFeed,
  lobbyRemaining,
  onStartNow,
  onPauseResume,
  onSkipStation,
  onToggleAutopilot,
  onTriggerAttackWave,
  onTriggerPowerFlicker,
  onEndIncident,
  onResetEvent,
  onToggleRegistration,
  onKickAgent,
  onTriggerRandomEvent,
  isMuted,
  onToggleMute
}) => {
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showKickModal, setShowKickModal] = useState<boolean>(false);

  const isLobby = !eventState.roundStartAt || eventState.status === 'STABLE';
  const doorDigits = (eventState.doorCode || '4821').split('');
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gdg.tu/503';

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentStation = (eventState.currentStation || 1) as StationId;
  const stationInfo = STATIONS[currentStation] || STATIONS[1];

  // Threat Level indicator bars
  const threatLevel = eventState.threatLevel || 1;

  // Health vignette level
  const isVignette = !isLobby && eventState.activeAlarm;

  return (
    <div 
      className={`min-h-screen w-full relative select-none font-cairo flex flex-col justify-between overflow-hidden ${
        isVignette ? 'vig' : ''
      }`}
      style={{
        padding: '12px 16px',
        background: 'radial-gradient(ellipse at 50% 0,#10224d 0,#070d1f 55%,#04070f 100%)',
        color: '#e8eefc',
        gap: '10px',
        direction: 'rtl'
      }}
    >
      {/* Subtle Scanlines Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 4px)',
          pointerEvents: 'none',
          zIndex: 1
        }} 
      />

      {/* 1. TOP HUD BAR (Exact Reference Styling) */}
      <div 
        className="pn"
        style={{
          height: '60px',
          flex: 'none',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Right side in RTL (Visually Left in LTR): Google Chevrons + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="46" height="28" viewBox="0 0 46 28" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3 4 14" stroke="#4285F4" />
            <path d="M4 14 15 25" stroke="#34A853" />
            <path d="M31 3 42 14" stroke="#EA4335" />
            <path d="M42 14 31 25" stroke="#FBBC05" />
          </svg>
          <div style={{ lineHeight: 1.1 }}>
            <div className="mono ltr" style={{ fontWeight: 800, fontSize: '20px', letterSpacing: '1px' }}>
              503: OVERLOAD
            </div>
            <div style={{ fontSize: '11px', color: '#8fa6d6', fontWeight: 700 }}>
              Google DGoC | TU · Be Googley
            </div>
          </div>
        </div>

        {/* Center: Dynamic Countdown or Nominal State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isLobby ? (
            lobbyRemaining !== null ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: lobbyRemaining <= 10 ? '#FBBC05' : '#7ee2a0', letterSpacing: '2px' }}>
                  INCIDENT IN
                </span>
                <span className={`mono pulse ${lobbyRemaining <= 3 ? 'text-[#EA4335]' : lobbyRemaining <= 10 ? 'text-[#FBBC05]' : 'text-[#34A853]'}`} style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1, textShadow: lobbyRemaining <= 10 ? '0 0 16px #FBBC05' : '0 0 16px #34A853' }}>
                  00:{String(lobbyRemaining).padStart(2, '0')}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono" style={{ fontSize: '15px', fontWeight: 800, color: '#7ee2a0' }}>
                  ALL SYSTEMS NOMINAL
                </span>
                <span style={{ fontSize: '11px', color: '#8fa6d6', background: 'rgba(16,34,77,0.8)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(66,133,244,0.3)' }}>
                  بانتظار انضمام أول عميل...
                </span>
              </div>
            )
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span className="mono" style={{ fontSize: '12px', fontWeight: 800, color: '#ff8a80', letterSpacing: '2px' }}>
                {eventState.sharedServerHealth === 0 ? 'SYSTEM OVERLOAD' : eventState.sharedServerHealth < 20 ? 'CRITICAL BREACH' : 'OVERLOAD IN'}
              </span>
              <span className="mono pulse" style={{ fontSize: '40px', fontWeight: 800, color: '#EA4335', lineHeight: 1, textShadow: '0 0 18px #EA4335' }}>
                {formatTime(eventState.totalTimeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Left side in RTL (Visually Right): Threat Level, Link badge, Agents Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="mono" style={{ fontSize: '10px', color: '#8fa6d6', fontWeight: 800, letterSpacing: '1px' }}>
              THREAT LEVEL
            </div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
              <i style={{ width: '16px', height: '9px', borderRadius: '2px', background: threatLevel >= 1 ? '#34A853' : '#1d2c4d' }} />
              <i style={{ width: '16px', height: '9px', borderRadius: '2px', background: threatLevel >= 2 ? '#FBBC05' : '#1d2c4d' }} />
              <i style={{ width: '16px', height: '9px', borderRadius: '2px', background: threatLevel >= 3 ? '#FBBC05' : '#1d2c4d' }} />
              <i style={{ width: '16px', height: '9px', borderRadius: '2px', background: threatLevel >= 4 ? '#EA4335' : '#1d2c4d' }} />
              <i className={threatLevel >= 5 ? 'blink' : ''} style={{ width: '16px', height: '9px', borderRadius: '2px', background: threatLevel >= 5 ? '#EA4335' : '#1d2c4d' }} />
            </div>
          </div>

          {/* Direct Link Badge (Zero PIN) */}
          <div 
            onClick={() => setShowQrModal(true)}
            className="mono cursor-pointer hover:border-blue-400 transition"
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              background: '#0b1430',
              border: '1px solid #2b3a66',
              fontWeight: 800,
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="عرض رمز الاستجابة السريعة ورابط الانضمام"
          >
            <QrCode size={14} className="text-[#4285F4]" />
            <span className="text-blue-300">gdg.tu/503</span>
          </div>

          {/* Live Agent Count */}
          <div style={{ padding: '6px 12px', borderRadius: '10px', background: '#12275a', color: '#9fc0ff', fontWeight: 800, fontSize: '13px' }}>
            {agents.length} لاعب
          </div>
        </div>
      </div>

      {/* 2. HAZARD STRIP (Visible during Breach & Incident) */}
      {!isLobby && (
        <div className="haz" style={{ height: '38px', flex: 'none', borderRadius: '12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ background: '#150608', padding: '4px 22px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 900, fontSize: '15px', color: '#ff6b5e', border: '1px solid #EA4335' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b5e" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3 2 21h20L12 3z" />
              <path d="M12 10v5" />
              <path d="M12 18v.01" />
            </svg>
            <span className="mono blink" style={{ letterSpacing: '1px' }}>BREACH DETECTED</span>
            <span>الغرفة {currentStation} · {stationInfo.arabicName}</span>
            <span className="mono" style={{ color: '#FBBC05' }}>{stationInfo.cveId || 'CVE-2026-109618'}</span>
          </div>
        </div>
      )}

      {/* 3. MAIN 3-COLUMN OPERATIONS ROW (Exact Reference Proportions & SVG) */}
      <div style={{ flex: 1, display: 'flex', gap: '12px', minHeight: 0, position: 'relative', zIndex: 2 }}>

        {/* COLUMN 1: 4 Station Cards & Server Room (250px) */}
        <div style={{ width: '250px', flex: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Station 1 */}
          <div 
            className="pn" 
            style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              borderColor: currentStation > 1 ? '#34A853' : currentStation === 1 ? '#EA4335' : 'rgba(66,133,244,.35)',
              boxShadow: currentStation === 1 ? '0 0 20px rgba(234,67,53,.4)' : undefined
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStation > 1 ? '#34A853' : currentStation === 1 ? '#EA4335' : '#12275a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentStation > 1 ? (
                <CheckCircle2 size={16} className="text-black" />
              ) : currentStation === 1 ? (
                <span className="mono font-black text-black text-xs">1</span>
              ) : (
                <span className="mono font-bold text-slate-400 text-xs">1</span>
              )}
            </div>
            <div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '12px' }}>1 · MEMORY VAULT</div>
              <div style={{ fontSize: '10px', color: currentStation > 1 ? '#7ee2a0' : currentStation === 1 ? '#ff8a80' : '#8fa6d6', fontWeight: 700 }}>
                {currentStation > 1 ? 'UNLOCKED' : currentStation === 1 ? 'ALERT · ACTIVE' : 'LOCKED'}
              </div>
            </div>
          </div>

          {/* Station 2 */}
          <div 
            className={`pn ${currentStation === 2 ? 'pulse' : ''}`}
            style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              border: currentStation === 2 ? '2px solid #EA4335' : currentStation > 2 ? '1px solid #34A853' : '1px solid rgba(66,133,244,.35)',
              opacity: currentStation < 2 ? 0.65 : 1
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStation > 2 ? '#34A853' : currentStation === 2 ? '#EA4335' : '#12275a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentStation > 2 ? (
                <CheckCircle2 size={16} className="text-black" />
              ) : currentStation === 2 ? (
                <span className="mono font-black text-black text-xs">2</span>
              ) : (
                <Lock size={14} className="text-slate-400" />
              )}
            </div>
            <div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '12px' }}>2 · DANGLING CORRIDOR</div>
              <div style={{ fontSize: '10px', color: currentStation > 2 ? '#7ee2a0' : currentStation === 2 ? '#ff8a80' : '#8fa6d6', fontWeight: 700 }}>
                {currentStation > 2 ? 'UNLOCKED' : currentStation === 2 ? 'ALERT · ACTIVE' : 'LOCKED'}
              </div>
            </div>
          </div>

          {/* Station 3 */}
          <div 
            className={`pn ${currentStation === 3 ? 'pulse' : ''}`}
            style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              border: currentStation === 3 ? '2px solid #EA4335' : currentStation > 3 ? '1px solid #34A853' : '1px solid rgba(66,133,244,.35)',
              opacity: currentStation < 3 ? 0.65 : 1
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStation > 3 ? '#34A853' : currentStation === 3 ? '#EA4335' : '#12275a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentStation > 3 ? (
                <CheckCircle2 size={16} className="text-black" />
              ) : currentStation === 3 ? (
                <span className="mono font-black text-black text-xs">3</span>
              ) : (
                <Lock size={14} className="text-slate-400" />
              )}
            </div>
            <div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '12px' }}>3 · PATCH LAB</div>
              <div style={{ fontSize: '10px', color: currentStation > 3 ? '#7ee2a0' : currentStation === 3 ? '#ff8a80' : '#8fa6d6', fontWeight: 700 }}>
                {currentStation > 3 ? 'UNLOCKED' : currentStation === 3 ? 'ALERT · ACTIVE' : 'LOCKED'}
              </div>
            </div>
          </div>

          {/* Station 4 */}
          <div 
            className={`pn ${currentStation === 4 ? 'pulse' : ''}`}
            style={{ 
              padding: '8px 12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              border: currentStation === 4 ? '2px solid #EA4335' : currentStation > 4 ? '1px solid #34A853' : '1px solid rgba(66,133,244,.35)',
              opacity: currentStation < 4 ? 0.65 : 1
            }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: currentStation > 4 ? '#34A853' : currentStation === 4 ? '#EA4335' : '#12275a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentStation > 4 ? (
                <CheckCircle2 size={16} className="text-black" />
              ) : currentStation === 4 ? (
                <span className="mono font-black text-black text-xs">4</span>
              ) : (
                <Lock size={14} className="text-slate-400" />
              )}
            </div>
            <div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '12px' }}>4 · CORE REBOOT</div>
              <div style={{ fontSize: '10px', color: currentStation > 4 ? '#7ee2a0' : currentStation === 4 ? '#ff8a80' : '#8fa6d6', fontWeight: 700 }}>
                {currentStation > 4 ? 'UNLOCKED' : currentStation === 4 ? 'ALERT · ACTIVE' : 'LOCKED'}
              </div>
            </div>
          </div>

          {/* SERVER ROOM · LIVE with 5 Racks */}
          <div className="pn" style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#8fa6d6', letterSpacing: '1px' }}>
              SERVER ROOM · LIVE
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'stretch', justifyContent: 'center', direction: 'ltr' }}>
              <div style={{ width: '38px', borderRadius: '5px', background: 'linear-gradient(#13224a,#0a1432)', border: '1px solid #2b3a66', display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                <div className="led" style={{ background: 'repeating-linear-gradient(#34A853 0 5px,transparent 5px 12px)' }} />
              </div>
              <div style={{ width: '38px', borderRadius: '5px', background: 'linear-gradient(#13224a,#0a1432)', border: '1px solid #2b3a66', display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                <div className="led blink" style={{ background: 'repeating-linear-gradient(#4285F4 0 5px,transparent 5px 12px)' }} />
              </div>
              <div style={{ width: '38px', borderRadius: '5px', background: !isLobby ? 'linear-gradient(#2a0d12,#12060a)' : 'linear-gradient(#13224a,#0a1432)', border: !isLobby ? '1px solid #EA4335' : '1px solid #2b3a66', boxShadow: !isLobby ? '0 0 14px rgba(234,67,53,.6)' : undefined, display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                <div className="led blink" style={{ background: !isLobby ? 'repeating-linear-gradient(#EA4335 0 5px,transparent 5px 12px)' : 'repeating-linear-gradient(#34A853 0 5px,transparent 5px 12px)' }} />
              </div>
              <div style={{ width: '38px', borderRadius: '5px', background: 'linear-gradient(#13224a,#0a1432)', border: '1px solid #2b3a66', display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                <div className="led" style={{ background: 'repeating-linear-gradient(#FBBC05 0 5px,transparent 5px 12px)' }} />
              </div>
              <div style={{ width: '38px', borderRadius: '5px', background: 'linear-gradient(#13224a,#0a1432)', border: '1px solid #2b3a66', display: 'flex', justifyContent: 'center', padding: '6px 0' }}>
                <div className="led blink" style={{ background: 'repeating-linear-gradient(#34A853 0 5px,transparent 5px 12px)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: PHP ENGINE · HEAP MEMORY (Flex 1) */}
        <div className="pn" style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', direction: 'ltr', borderColor: !isLobby ? '#EA4335' : 'rgba(66,133,244,.35)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="mono" style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '1px' }}>
              PHP ENGINE · HEAP MEMORY <span style={{ color: '#ff8a80' }}>· USE-AFTER-FREE</span>
            </div>
            <div className="mono blink" style={{ fontSize: '11px', fontWeight: 800, color: '#FBBC05' }}>
              ● LIVE
            </div>
          </div>

          {/* SVG Diagram with Pointer & Request #2 */}
          <svg width="100%" height="110" viewBox="0 0 604 110" aria-label="Use After Free Stale Pointer" role="img">
            <rect x="2" y="4" width="200" height="36" rx="8" fill="#2a0d12" stroke="#EA4335" strokeWidth="2" />
            <text x="102" y="19" textAnchor="middle" fill="#ff8a80" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono">global_backtrace_ptr</text>
            <text x="102" y="33" textAnchor="middle" fill="#ffb3ab" fontSize="10" fontFamily="JetBrains Mono">= 0x7f3a (STALE)</text>

            <rect x="402" y="4" width="200" height="36" rx="8" fill="#2b2406" stroke="#FBBC05" strokeWidth="2" />
            <text x="502" y="19" textAnchor="middle" fill="#FBBC05" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono">NEW REQUEST #2</text>
            <text x="502" y="33" textAnchor="middle" fill="#ffe08a" fontSize="10" fontFamily="JetBrains Mono">reuses the freed block</text>

            <path className="dash" d="M102 40 C102 80 230 70 307 105" fill="none" stroke="#EA4335" strokeWidth="2.5" />
            <path className="dash" d="M502 40 C502 80 410 70 307 105" fill="none" stroke="#FBBC05" strokeWidth="2.5" />
            <path d="M301 97 307 108 313 97" fill="#fff" />
          </svg>

          {/* 12 Memory Blocks (Exact match) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px', marginTop: '-4px' }}>
            <div className="mc m">a1</div>
            <div className="mc m">b7</div>
            <div className="mc e" />
            <div className="mc m">c2</div>
            <div className="mc m">9e</div>
            <div className="mc m">d4</div>
            <div className="mc x">FREED</div>
            <div className="mc m">f0</div>
            <div className="mc e" />
            <div className="mc m">3c</div>
            <div className="mc m">e8</div>
            <div className="mc e" />
          </div>

          <div className="mono" style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, color: '#ff8a80' }}>
            ▲ 0x7f3a · PHP still trusts this address
          </div>

          {/* 3 Step Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', direction: 'rtl' }}>
            <div style={{ borderRadius: '10px', padding: '8px 10px', background: '#2a0d12', border: '1px solid #EA4335' }}>
              <div className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#ff8a80', direction: 'ltr', textAlign: 'right' }}>
                1 · OOM FATAL ERROR
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '3px', lineHeight: 1.4 }}>
                الذاكرة نفدت والطلب انهار فجأة بتنظيف ناقص.
              </div>
            </div>

            <div style={{ borderRadius: '10px', padding: '8px 10px', background: '#2b2406', border: '1px solid #FBBC05' }}>
              <div className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#FBBC05', direction: 'ltr', textAlign: 'right' }}>
                2 · STALE POINTER
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '3px', lineHeight: 1.4 }}>
                بقي مؤشر قديم يشير لمكان تم تحريره.
              </div>
            </div>

            <div style={{ borderRadius: '10px', padding: '8px 10px', background: '#0d1d44', border: '1px solid #4285F4' }}>
              <div className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#8ab4ff', direction: 'ltr', textAlign: 'right' }}>
                3 · REUSE → TRUST
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '3px', lineHeight: 1.4 }}>
                طلب جديد يشغل المكان وPHP تثق بالمؤشر القديم.
              </div>
            </div>
          </div>

          {/* Interactive Button & Door Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', direction: 'rtl', marginTop: 'auto' }}>
            <button 
              onClick={() => {
                sfx.glitch();
                onTriggerAttackWave();
              }}
              style={{
                flex: 1,
                height: '46px',
                border: 0,
                borderRadius: '12px',
                background: 'linear-gradient(90deg,#EA4335,#c5221f)',
                color: '#fff',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 800,
                fontSize: '16px',
                letterSpacing: '1px',
                boxShadow: '0 0 24px rgba(234,67,53,.7)',
                cursor: 'pointer'
              }}
            >
              CLEAR THE POINTER
            </button>

            <div style={{ width: '180px' }}>
              <div className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#ff8a80', direction: 'ltr', textAlign: 'right' }}>
                NEXT REQUEST IN 0:0{eventState.doorCodeExpiresIn}
              </div>
              <div style={{ height: '8px', borderRadius: '5px', background: '#0b1430', marginTop: '4px', overflow: 'hidden' }}>
                <i style={{ display: 'block', width: `${(eventState.doorCodeExpiresIn / 8) * 100}%`, height: '100%', background: '#EA4335', boxShadow: '0 0 10px #EA4335', transition: 'width 0.9s linear' }} />
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 3: TERMINAL & DOOR CODE (330px) */}
        <div style={{ width: '330px', flex: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Terminal */}
          <div className="pn" style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px', direction: 'ltr', borderColor: '#34A853' }}>
            <div className="mono" style={{ fontSize: '11px', fontWeight: 800, color: '#7ee2a0', letterSpacing: '1px' }}>
              TERMINAL · /var/log/php
            </div>
            
            <div className="mono" style={{ fontSize: '11px', lineHeight: 1.6, color: '#9fb4e0' }}>
              <div>14:02:11 POST /upload multipart 200</div>
              <div style={{ color: '#ff6b5e', fontWeight: 800 }}>14:02:12 FATAL memory size exhausted</div>
              <div style={{ color: '#FBBC05' }}>14:02:12 WARN ptr 0x7f3a not cleared</div>
              <div>14:02:13 GET /index.php <span style={{ color: '#ff6b5e', fontWeight: 800 }}>500</span></div>
              <div style={{ color: '#ff6b5e', fontWeight: 800 }}>14:02:13 Set-Cookie: PHPSESSID=</div>
              <div style={{ color: '#ff6b5e', wordBreak: 'break-all' }}>7f3a9c1e5b02d4a87e6f10c3b9a2…</div>
              <div style={{ color: '#ff6b5e', fontWeight: 800 }} className="blink">14:02:14 ALERT block reused</div>
              <div style={{ color: '#7ee2a0' }}>&gt; awaiting response<span className="blink">█</span></div>
            </div>

            <div style={{ marginTop: 'auto', fontSize: '10px', color: '#8fa6d6', direction: 'rtl', fontWeight: 700 }}>
              رموز وبيانات وهمية للمحاكاة فقط.
            </div>
          </div>

          {/* Door Code Panel with 4 Boxes */}
          <div className="pn" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px', borderColor: '#FBBC05' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 900, fontSize: '14px' }}>رمز الباب</div>
              <div className="mono" style={{ fontWeight: 800, fontSize: '14px', color: '#FBBC05' }}>
                0:0{eventState.doorCodeExpiresIn}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', direction: 'ltr' }}>
              <div className="mono" style={{ height: '48px', borderRadius: '10px', background: '#0d1d44', border: '2px solid #4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#8ab4ff', boxShadow: '0 0 10px rgba(66,133,244,.5)' }}>
                {doorDigits[0]}
              </div>
              <div className="mono" style={{ height: '48px', borderRadius: '10px', background: '#0d1d44', border: '2px solid #4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#8ab4ff', boxShadow: '0 0 10px rgba(66,133,244,.5)' }}>
                {doorDigits[1]}
              </div>
              <div className="mono" style={{ height: '48px', borderRadius: '10px', background: '#0d1d44', border: '2px solid #4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#8ab4ff', boxShadow: '0 0 10px rgba(66,133,244,.5)' }}>
                {doorDigits[2]}
              </div>
              <div className="mono" style={{ height: '48px', borderRadius: '10px', background: '#0d1d44', border: '2px solid #4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#8ab4ff', boxShadow: '0 0 10px rgba(66,133,244,.5)' }}>
                {doorDigits[3]}
              </div>
            </div>

            <div style={{ height: '6px', borderRadius: '4px', background: '#0b1430', overflow: 'hidden' }}>
              <i style={{ display: 'block', width: `${(eventState.doorCodeExpiresIn / 8) * 100}%`, height: '100%', background: '#FBBC05', boxShadow: '0 0 10px #FBBC05', transition: 'width 0.9s linear' }} />
            </div>
          </div>

        </div>

      </div>

      {/* 4. HOST OVERRIDES PANEL (Compact, Bottom Bar matching Requirement 6) */}
      <footer 
        className="pn"
        style={{
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          zIndex: 2,
          background: 'rgba(8, 14, 32, 0.95)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          
          {/* Autopilot ON / OFF Toggle */}
          <button
            onClick={onToggleAutopilot}
            className="cursor-pointer"
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: eventState.autopilot ? '1px solid #34A853' : '1px solid #64748b',
              background: eventState.autopilot ? 'rgba(52,168,83,0.2)' : 'rgba(100,116,139,0.2)',
              color: eventState.autopilot ? '#7ee2a0' : '#94a3b8',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="تبديل وضع الطيار الآلي"
          >
            <Radio size={12} className={eventState.autopilot ? 'animate-pulse text-[#34A853]' : ''} />
            <span>AUTOPILOT: {eventState.autopilot ? 'ON' : 'OFF'}</span>
          </button>

          {/* Pause / Resume Override */}
          <button
            onClick={onPauseResume}
            className="cursor-pointer"
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#e2e8f0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            {eventState.status === 'PAUSED' ? <Play size={12} className="text-[#34A853]" /> : <Pause size={12} className="text-amber-400" />}
            <span>{eventState.status === 'PAUSED' ? 'RESUME' : 'PAUSE'}</span>
          </button>

          {/* Skip Station Override */}
          <button
            onClick={onSkipStation}
            className="cursor-pointer"
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #3b82f6',
              background: 'rgba(59,130,246,0.2)',
              color: '#93c5fd',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FastForward size={12} />
            <span>SKIP STATION</span>
          </button>

          {/* Start Now Override (If in lobby) */}
          {isLobby && (
            <button
              onClick={onStartNow}
              className="cursor-pointer animate-pulse"
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                border: '1px solid #EA4335',
                background: 'rgba(234,67,53,0.3)',
                color: '#ff8a80',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Flame size={12} />
              <span>START NOW</span>
            </button>
          )}

          {/* End & Results Override */}
          {!isLobby && (
            <button
              onClick={onEndIncident}
              className="cursor-pointer"
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid #991b1b',
                background: 'rgba(153,27,27,0.3)',
                color: '#fca5a5',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '11px',
                fontWeight: 800
              }}
            >
              END &amp; RESULTS
            </button>
          )}

          {/* Registration Open/Close Toggle */}
          <button
            onClick={onToggleRegistration}
            className="cursor-pointer"
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: eventState.registrationOpen ? '#7ee2a0' : '#f87171',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px'
            }}
          >
            REG: {eventState.registrationOpen ? 'OPEN' : 'CLOSED'}
          </button>

          {/* Kick Agent Dialog Trigger */}
          <button
            onClick={() => setShowKickModal(true)}
            className="cursor-pointer"
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#94a3b8',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <UserX size={11} />
            <span>KICK ({agents.length})</span>
          </button>

          {/* Trigger Random Event */}
          <button
            onClick={onTriggerRandomEvent}
            className="cursor-pointer"
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid #7c3aed',
              background: 'rgba(124,58,237,0.2)',
              color: '#c4b5fd',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Zap size={11} />
            <span>RANDOM EVENT</span>
          </button>

          {/* Reset Event */}
          <button
            onClick={onResetEvent}
            className="cursor-pointer"
            style={{
              padding: '4px 8px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#94a3b8',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px'
            }}
          >
            RESET
          </button>
        </div>

        {/* Speed & Mute */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {eventState.timeScale && eventState.timeScale > 1 && (
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#eab308', color: '#000', fontFamily: 'JetBrains Mono, monospace', fontWeight: 900 }}>
              {eventState.timeScale}X DEV SPEED
            </span>
          )}

          <button
            onClick={onToggleMute}
            className="cursor-pointer"
            style={{
              padding: '5px 8px',
              borderRadius: '8px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: isMuted ? '#f87171' : '#e2e8f0',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>
      </footer>

      {/* QR Code Modal */}
      {showQrModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="pn" style={{ maxWidth: '360px', width: '100%', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '14px', background: '#070e24', borderColor: '#4285F4' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
              <span className="mono" style={{ fontSize: '12px', color: '#4285F4', fontWeight: 800 }}>JOIN OPERATIONS</span>
              <button onClick={() => setShowQrModal(false)} className="cursor-pointer" style={{ color: '#94a3b8', background: 'transparent', border: 0 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '14px', background: '#fff', borderRadius: '16px', margin: '0 auto', width: '180px', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '4px solid #000' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '32px', height: '32px', background: '#000' }} />
                <div style={{ width: '32px', height: '32px', background: '#000' }} />
              </div>
              <div className="mono" style={{ textAlign: 'center', fontWeight: 900, fontSize: '11px', color: '#000' }}>
                SCAN TO JOIN
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ width: '32px', height: '32px', background: '#000' }} />
                <div style={{ width: '16px', height: '16px', background: '#000', margin: 'auto' }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>رابط الانضمام للعملاء:</div>
              <div className="mono ltr" style={{ padding: '8px', borderRadius: '8px', background: '#020617', border: '1px solid #3b82f6', color: '#93c5fd', fontSize: '13px', userSelect: 'all' }}>
                {currentUrl}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                بدون PIN — اكتب اسمك واختر كتيبتك للانضمام فوراً.
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="cursor-pointer"
              style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '12px', border: 0 }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Kick Agent Modal */}
      {showKickModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '16px' }}>
          <div className="pn" style={{ maxWidth: '400px', width: '100%', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#070e24', borderColor: '#EA4335' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
              <span className="mono" style={{ fontSize: '12px', color: '#EA4335', fontWeight: 800 }}>KICK AGENT FROM EVENT</span>
              <button onClick={() => setShowKickModal(false)} className="cursor-pointer" style={{ color: '#94a3b8', background: 'transparent', border: 0 }}>
                <X size={18} />
              </button>
            </div>

            {agents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '12px' }}>
                لا يوجد عملاء مسجلين حالياً.
              </div>
            ) : (
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {agents.map((ag) => (
                  <div key={ag.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '8px', background: '#020617', border: '1px solid #1e293b' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '12px', color: '#fff' }}>{ag.displayName}</div>
                      <div className="mono" style={{ fontSize: '10px', color: '#64748b' }}>{ag.squad} • {ag.score} PTS</div>
                    </div>
                    <button
                      onClick={() => {
                        onKickAgent(ag.id);
                        sfx.error();
                      }}
                      className="cursor-pointer"
                      style={{ padding: '4px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', color: '#fca5a5', fontSize: '11px', fontWeight: 800 }}
                    >
                      طرد
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowKickModal(false)}
              className="cursor-pointer"
              style={{ width: '100%', padding: '8px', borderRadius: '8px', background: '#334155', color: '#fff', fontSize: '12px', border: 0 }}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
