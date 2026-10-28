import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Terminal as TerminalIcon, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Layers, 
  Cpu, 
  Flame, 
  Volume2, 
  VolumeX, 
  Clock,
  Sparkles,
  RefreshCw,
  Box,
  KeyRound
} from 'lucide-react';
import { Agent, EventState, Squad } from '../types/game';
import { SQUADS } from '../data/gameData';
import { TimelineState } from '../services/timelineService';
import { sfx, isMuted, setMuted } from '../services/audioService';
import { 
  TerminalState, 
  createInitialTerminalState, 
  executeCommand, 
  TerminalOutputLine 
} from '../engine/terminalEngine';

interface AgentPhoneViewProps {
  agent: Agent;
  timeline: TimelineState;
  onUpdateScore: (points: number, reason: string) => void;
  onDoorCodeUnlocked: () => void;
}

export const AgentPhoneView: React.FC<AgentPhoneViewProps> = ({
  agent,
  timeline,
  onUpdateScore,
  onDoorCodeUnlocked
}) => {
  // Engine State
  const [engineState, setEngineState] = useState<TerminalState>(createInitialTerminalState);
  const [outputLines, setOutputLines] = useState<TerminalOutputLine[]>([
    { id: 'l0', type: 'dim', text: 'OVERLOAD503 Incident Shell v2.4 initialized.' },
    { id: 'l1', type: 'warn', text: 'CRITICAL ALERT: Unauthorized heap memory disruption detected.' },
    { id: 'l2', type: 'tip', text: 'الثغرتان في ذاكرة PHP نفسها: اكتب ssh soc@prod-04 لتسجيل الدخول.' }
  ]);

  // Terminal Input & History
  const [inputText, setInputText] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isMutedLocal, setIsMutedLocal] = useState<boolean>(isMuted());
  const [floatingPoints, setFloatingPoints] = useState<{ id: string; text: string; x: number; y: number }[]>([]);
  
  // Door Code input state
  const [typedDoorCode, setTypedDoorCode] = useState<string>('');
  const [doorError, setDoorError] = useState<boolean>(false);

  // Layout Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const outputContainerRef = useRef<HTMLDivElement>(null);
  const [viewportBottomOffset, setViewportBottomOffset] = useState<number>(0);

  const squadMeta = SQUADS[agent.squad] || SQUADS.sentinels;

  // 1. Mobile Visual Viewport adjustment (avoids keyboard hiding input)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const handleResize = () => {
      const vv = window.visualViewport!;
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setViewportBottomOffset(Math.max(0, offset));
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // 2. Auto-scroll terminal output to bottom
  useEffect(() => {
    if (outputContainerRef.current) {
      outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
    }
  }, [outputLines]);

  // 3. Audio Triggers on Timeline Phase change
  useEffect(() => {
    if (timeline.phase === 'BREACH') {
      sfx.glitch();
      sfx.warn();
    } else if (timeline.phase === 'LOGIN') {
      sfx.keyClick();
    } else if (timeline.phase.startsWith('DOOR')) {
      sfx.warn();
    } else if (timeline.phase === 'SECURED') {
      sfx.chime();
    }
  }, [timeline.phase]);

  // 4. Handle Submitting Command
  const handleCommandSubmit = (commandToRun?: string) => {
    const raw = commandToRun !== undefined ? commandToRun : inputText;
    if (!raw.trim()) return;

    // Check door code match first if in DOOR phase
    if (timeline.phase.startsWith('DOOR') && raw.trim() === timeline.doorCode) {
      sfx.unlock();
      onDoorCodeUnlocked();
      onUpdateScore(50, 'Door code unlocked');
      setOutputLines((prev) => [
        ...prev,
        { id: `d_${Date.now()}`, type: 'ok', text: `CORRIDOR DOOR UNLOCKED: Code ${raw.trim()} accepted! (+50 PTS)` }
      ]);
      setInputText('');
      return;
    }

    const prevScore = engineState.score;
    const result = executeCommand(raw, engineState, timeline.currentStation);
    setEngineState(result.nextState);
    setOutputLines((prev) => [...prev, ...result.lines]);

    // Track score diff and bubble to host/cloud
    const scoreDiff = result.nextState.score - prevScore;
    if (scoreDiff !== 0) {
      onUpdateScore(scoreDiff, raw);
    }

    // SFX
    if (result.sfxTrigger && sfx[result.sfxTrigger]) {
      sfx[result.sfxTrigger]();
    } else {
      sfx.keyClick();
    }

    // Add to history
    setHistory((prev) => [raw, ...prev]);
    setHistoryIdx(-1);
    setInputText('');
  };

  // Keyboard navigation for terminal (Enter, Tab, ArrowUp, ArrowDown)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommandSubmit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Auto-complete suggestion
      const closest = getSuggestedChips()[0];
      if (closest) setInputText(closest);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(nextIdx);
        setInputText(history[nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputText(history[nextIdx] || '');
      } else {
        setHistoryIdx(-1);
        setInputText('');
      }
    }
  };

  // Get Suggested Chips based on station and state
  const getSuggestedChips = (): string[] => {
    if (!engineState.login) {
      return ['ssh soc@prod-04', 'Ov3r-503', 'help'];
    }
    if (timeline.phase === 'STATION_1') {
      return ['req-4821', 'req-4822', 'req-4824', 'logs', 'iptables -A INPUT -s 203.0.113.77 -j DROP'];
    }
    if (timeline.phase === 'STATION_2') {
      return ['clear 0x7f3a', 'heap', 'freeze', 'inspect pointer'];
    }
    if (timeline.phase === 'STATION_3') {
      return ['flag box-12', 'flag box-14', 'rotate 7f3a', 'rotate all'];
    }
    if (timeline.phase === 'STATION_4') {
      return ['sudo apt install php8.4=8.4.27', 'backup logs', 'sudo systemctl restart php-fpm', 'verify', 'update wordpress'];
    }
    if (timeline.phase.startsWith('DOOR')) {
      return [timeline.doorCode, 'status'];
    }
    return ['logs', 'heap', 'php -v', 'status', 'verify'];
  };

  return (
    <div 
      className={`min-h-screen w-full relative flex flex-col justify-between font-cairo select-none overflow-hidden ${
        timeline.activeAlarm ? 'vig' : ''
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 0,#10224d 0,#070d1f 55%,#04070f 100%)',
        color: '#e8eefc',
        direction: 'rtl',
        paddingBottom: `${viewportBottomOffset}px`
      }}
    >
      {/* Scanline pattern */}
      <div className="sc" />

      {/* TOP HEADER */}
      <header className="pn h-[54px] flex-none px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const next = !isMutedLocal;
              setMuted(next);
              setIsMutedLocal(next);
            }} 
            className="p-1.5 rounded-lg bg-[#0b1430] border border-[#2b3a66] text-slate-300 hover:text-white"
          >
            {isMutedLocal ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <div className="mono font-bold text-xs px-2 py-0.5 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300">
            PTS {engineState.score}
          </div>
        </div>

        {/* AUTHORITATIVE OVERLOAD COUNTDOWN */}
        <div className="flex items-center gap-2">
          <span className="mono pulse text-2xl font-extrabold text-[#EA4335] leading-none drop-shadow-[0_0_12px_#EA4335]">
            {timeline.overloadText}
          </span>
          <span className="mono font-extrabold text-sm text-white">503: OVERLOAD</span>
        </div>

        <div className="flex items-center gap-2">
          <span 
            className="w-2.5 h-2.5 rounded-full" 
            style={{ background: squadMeta.color }} 
          />
          <span className="mono text-xs font-bold text-slate-200">
            {agent.displayName}
          </span>
        </div>
      </header>

      {/* BREACH / HAZARD BANNER */}
      {timeline.activeAlarm && (
        <div className="haz h-8 flex-none flex items-center justify-center px-2 z-10">
          <div className="bg-[#150608] px-3 py-0.5 rounded-md flex items-center gap-2 text-xs font-black text-[#ff6b5e] border border-[#EA4335]">
            <span className="mono blink">BREACH ACTIVE</span>
            <span>·</span>
            <span>
              {timeline.phase === 'STATION_1' && 'المرحلة 1: استنزاف الذاكرة (CVE-2026-109618)'}
              {timeline.phase === 'STATION_2' && 'المرحلة 2: المؤشر المعلق Use-After-Free (CVE-2026-109619)'}
              {timeline.phase === 'STATION_3' && 'المرحلة 3: تعارض أنواع OPcache وتدوير الجلسات'}
              {timeline.phase === 'STATION_4' && 'المرحلة 4: معمل الترقيع وتأمين النواة'}
              {timeline.phase === 'LOGIN' && 'جلسة الحادث: المصادقة بكلمة المرور المؤقتة'}
              {timeline.phase === 'BREACH' && 'إنذار اختراق كلي: الخلل في مجمع الذاكرة!'}
            </span>
          </div>
        </div>
      )}

      {/* MAIN CONTENT: 2-COLUMN ON LAPTOP (>=1024px), SINGLE-COLUMN ON MOBILE */}
      <main className="flex-1 flex flex-col lg:flex-row gap-3 p-3 min-h-0 z-10 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* COLUMN 1: INTERACTIVE REAL TERMINAL (Left on Laptop, Primary on Mobile)  */}
        {/* ========================================================================= */}
        <section className="pn flex-1 flex flex-col min-h-0 border-[#34A853]/60 relative shadow-[0_0_20px_rgba(52,168,83,0.15)]">
          
          {/* Terminal Window Header */}
          <div className="h-8 flex-none px-3 bg-[#07140f] border-b border-[#34A853]/40 flex items-center justify-between ltr">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA4335]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#FBBC05]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#34A853]" />
              <span className="mono text-[11px] font-bold text-[#7ee2a0] ml-2">soc@prod-04:~$</span>
            </div>
            <div className="mono text-[10px] text-slate-400">
              {engineState.login ? 'AUTHENTICATED' : 'AUTH REQUIRED'}
            </div>
          </div>

          {/* Terminal Output Area */}
          <div 
            ref={outputContainerRef}
            className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed space-y-1.5 ltr text-left bg-[#040814]/90"
          >
            {outputLines.map((line) => {
              let color = 'text-slate-300';
              if (line.type === 'cmd') color = 'text-[#7ee2a0] font-bold';
              else if (line.type === 'ok') color = 'text-[#7ee2a0]';
              else if (line.type === 'warn') color = 'text-[#FBBC05]';
              else if (line.type === 'err') color = 'text-[#ff6b5e] font-bold';
              else if (line.type === 'tip') {
                return (
                  <div key={line.id} className="tip rtl text-right my-1 text-xs">
                    {line.text}
                  </div>
                );
              }

              return (
                <div key={line.id} className={`break-words whitespace-pre-wrap ${color}`}>
                  {line.text}
                </div>
              );
            })}
          </div>

          {/* SUGGESTED COMMAND CHIPS (PINNED ABOVE INPUT FOR MOBILE TAPPING) */}
          <div className="flex items-center gap-1.5 p-1.5 overflow-x-auto ltr border-t border-slate-800 bg-[#060c1d] flex-none">
            <span className="text-[10px] font-mono text-slate-400 font-bold shrink-0">CHIPS:</span>
            {getSuggestedChips().map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setInputText(chip);
                  handleCommandSubmit(chip);
                }}
                className="ch border-[#4285F4] text-[#8ab4ff] hover:bg-blue-900/40 active:scale-95 transition min-h-[36px] py-1 px-2.5 text-xs font-mono shrink-0 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* REAL COMMAND INPUT FORM */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleCommandSubmit();
            }}
            className="h-12 flex-none px-3 bg-[#060e22] border-t border-[#34A853]/40 flex items-center gap-2 ltr"
          >
            <span className="mono text-xs font-extrabold text-[#7ee2a0] shrink-0">
              {engineState.passwordMode ? 'password:' : 'soc@prod-04:~$'}
            </span>

            <input
              ref={inputRef}
              type={engineState.passwordMode ? 'password' : 'text'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              inputMode="text"
              placeholder={engineState.passwordMode ? 'enter masked password...' : 'type command (e.g. logs, clear 0x7f3a, req-4821)...'}
              className="flex-1 bg-transparent border-0 outline-none text-white font-mono text-xs sm:text-sm placeholder:text-slate-500"
            />

            <button
              type="submit"
              className="w-9 h-8 rounded-lg bg-[#34A853] text-[#04110a] flex items-center justify-center font-bold active:scale-95 transition cursor-pointer shrink-0"
              aria-label="Send Command"
            >
              <Send size={14} />
            </button>
          </form>

        </section>

        {/* ========================================================================= */}
        {/* COLUMN 2: LIVE VISUAL PANEL (Right on Laptop, Supplementary on Mobile)   */}
        {/* ========================================================================= */}
        <section className="pn w-full lg:w-[380px] p-3 flex flex-col gap-3 flex-none overflow-y-auto">
          
          {/* TICKET #503 (Authentication Credential) */}
          <div className="p-3 rounded-xl border border-[#FBBC05] bg-[#2b2406]/60 flex items-center justify-between">
            <div>
              <div className="ttl text-[#FBBC05]">TICKET #503 CREDENTIAL</div>
              <div className="text-xs text-slate-300 font-bold mt-0.5">كلمة مرور السيرفر المؤقتة:</div>
            </div>
            <div className="mono font-extrabold text-lg text-[#FBBC05] px-2.5 py-1 rounded bg-[#0b1430] border border-[#FBBC05]/40">
              {engineState.tempPassword}
            </div>
          </div>

          {/* STATION 1 VISUAL: Falling Requests Monitor */}
          {timeline.phase === 'STATION_1' && (
            <div className="p-3 rounded-xl border border-[#EA4335]/50 bg-[#091124] space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#ff8a80] font-bold">FALLING REQUESTS STREAM</span>
                <span className="text-slate-400">TYPE ID TO BLOCK</span>
              </div>
              <div className="space-y-1.5 ltr font-mono text-xs">
                {engineState.fallingRequests.slice(0, 4).map((r) => (
                  <div 
                    key={r.id} 
                    onClick={() => handleCommandSubmit(r.id)}
                    className={`p-2 rounded-lg border flex justify-between items-center cursor-pointer transition active:scale-95 ${
                      r.blocked 
                        ? 'border-[#34A853] bg-emerald-950/30 text-[#7ee2a0] line-through'
                        : 'border-[#EA4335] bg-red-950/30 text-red-200 hover:border-red-400'
                    }`}
                  >
                    <span>{r.path}</span>
                    <span className="ch border-current text-[10px]">{r.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATION 2 VISUAL: Memory Blocks & Clear Pointer */}
          {timeline.phase === 'STATION_2' && (
            <div className="p-3 rounded-xl border border-[#EA4335]/50 bg-[#091124] space-y-2.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#ff8a80] font-bold">HEAP MEMORY AUDIT</span>
                <span className="text-yellow-400">0x7f3a</span>
              </div>
              
              {/* 12 Memory Cells */}
              <div className="grid grid-cols-6 gap-1 ltr">
                <div className="mc m text-[9px] h-9">a1</div>
                <div className="mc m text-[9px] h-9">b7</div>
                <div className={`mc h-9 text-[9px] ${engineState.stalePointerCleared ? 'm' : 'x'}`}>
                  {engineState.stalePointerCleared ? 'CLEARED' : '0x7f3a'}
                </div>
                <div className="mc m text-[9px] h-9">c2</div>
                <div className="mc m text-[9px] h-9">9e</div>
                <div className="mc m text-[9px] h-9">d4</div>
              </div>

              <button
                disabled={engineState.stalePointerCleared}
                onClick={() => handleCommandSubmit('clear 0x7f3a')}
                className={`w-full min-h-[44px] rounded-xl font-mono font-bold text-xs tracking-wider transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  engineState.stalePointerCleared
                    ? 'bg-emerald-950 border border-emerald-500 text-emerald-300'
                    : 'bg-gradient-to-r from-[#EA4335] to-[#c5221f] text-white shadow-[0_0_15px_#EA4335]'
                }`}
              >
                {engineState.stalePointerCleared ? 'POINTER CLEARED (SAFE) ✓' : 'CLEAR THE POINTER (clear 0x7f3a)'}
              </button>
            </div>
          )}

          {/* STATION 3 VISUAL: OPcache Boxes & Sessions */}
          {timeline.phase === 'STATION_3' && (
            <div className="p-3 rounded-xl border border-[#FBBC05]/50 bg-[#091124] space-y-2">
              <div className="ttl text-[#FBBC05]">OPCACHE CONVEYOR (FLAG MISMATCH)</div>
              <div className="space-y-1.5 ltr font-mono text-xs">
                {engineState.opcacheBoxes.map((box) => (
                  <div 
                    key={box.id}
                    onClick={() => handleCommandSubmit(`flag ${box.id}`)}
                    className={`p-2 rounded-lg border flex justify-between items-center cursor-pointer active:scale-95 transition ${
                      box.flagged
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-300'
                        : box.mismatched
                        ? 'border-red-500 bg-red-950/30 text-red-200'
                        : 'border-slate-800 bg-[#060c20]'
                    }`}
                  >
                    <span>{box.id}: {box.label} → {box.content}</span>
                    <span className="text-[10px] text-yellow-400">{box.flagged ? 'FLAGGED ✓' : 'FLAG'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATION 4 VISUAL: Patch Status */}
          {timeline.phase === 'STATION_4' && (
            <div className="p-3 rounded-xl border border-[#4285F4]/50 bg-[#091124] space-y-2 text-xs font-mono">
              <div className="ttl text-[#8ab4ff]">RUNTIME PATCH STATUS</div>
              <div className="p-2 rounded bg-[#060c1d] border border-slate-800 flex justify-between">
                <span>PHP RUNTIME:</span>
                <span className={engineState.patchApplied ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {engineState.phpVersion}
                </span>
              </div>
              <div className="p-2 rounded bg-[#060c1d] border border-slate-800 flex justify-between">
                <span>SERVICES:</span>
                <span className={engineState.servicesRestarted ? 'text-emerald-400 font-bold' : 'text-yellow-400 font-bold'}>
                  {engineState.servicesRestarted ? 'RELOADED' : 'UNPATCHED'}
                </span>
              </div>
              <button
                onClick={() => handleCommandSubmit('verify')}
                className="w-full mt-2 min-h-[44px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold cursor-pointer active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <span>VERIFY INCIDENT CONTAINMENT</span>
              </button>
            </div>
          )}

          {/* DOOR CODE QUICK INPUT (If Door Active) */}
          {timeline.phase.startsWith('DOOR') && (
            <div className="p-3 rounded-xl border border-[#FBBC05] bg-[#2b2406]/60 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#FBBC05] font-bold">ROTATING DOOR PIN</span>
                <span className="text-white">0:0{timeline.doorCodeExpiresIn}</span>
              </div>
              <div className="flex gap-2 ltr">
                <input
                  type="text"
                  maxLength={4}
                  value={typedDoorCode}
                  onChange={(e) => setTypedDoorCode(e.target.value)}
                  placeholder={timeline.doorCode}
                  className="flex-1 min-h-[40px] px-3 bg-[#0b1430] border border-[#FBBC05]/60 rounded-lg text-white font-mono text-center text-lg font-bold outline-none"
                />
                <button
                  onClick={() => handleCommandSubmit(typedDoorCode)}
                  className="px-4 rounded-lg bg-[#FBBC05] text-[#150608] font-bold text-xs font-mono cursor-pointer active:scale-95"
                >
                  UNLOCK
                </button>
              </div>
            </div>
          )}

          {/* SYSTEM METRICS BARS */}
          <div className="space-y-2 pt-1 text-xs">
            <div>
              <div className="flex justify-between mono font-bold ltr text-[11px]">
                <span className="text-[#EA4335]">EXPOSURE</span>
                <span>{engineState.exposure}%</span>
              </div>
              <div className="bar h-2 mt-0.5"><i style={{ width: `${engineState.exposure}%`, background: '#EA4335' }} /></div>
            </div>
            <div>
              <div className="flex justify-between mono font-bold ltr text-[11px]">
                <span className="text-[#34A853]">AVAILABILITY</span>
                <span>{engineState.availability}%</span>
              </div>
              <div className="bar h-2 mt-0.5"><i style={{ width: `${engineState.availability}%`, background: '#34A853' }} /></div>
            </div>
          </div>

        </section>

      </main>

    </div>
  );
};
