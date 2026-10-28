import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Flame, 
  Zap, 
  Target, 
  Scissors, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  Terminal, 
  HelpCircle, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Server, 
  Cpu, 
  Clock, 
  Lock, 
  Unlock,
  Award,
  Layers,
  ArrowRight,
  TrendingUp,
  Skull
} from 'lucide-react';
import { Agent, Squad } from '../types/game';
import { SQUADS } from '../data/gameData';
import { TimelineState } from '../services/timelineService';
import { sfx, isMuted, setMuted } from '../services/audioService';
import { MissionBriefingModal } from './MissionBriefingModal';

interface ArcadeGameplayViewProps {
  agent: Agent;
  timeline: TimelineState;
  onUpdateScore: (points: number, reason: string) => void;
  onDoorCodeUnlocked: () => void;
  onStartNow?: () => void;
  onResetAgent?: () => void;
  onSwitchToTerminal?: () => void;
}

interface ThreatPacket {
  id: string;
  code: string;
  type: string;
  threatLevel: 'high' | 'crit';
  points: number;
}

export const ArcadeGameplayView: React.FC<ArcadeGameplayViewProps> = ({
  agent,
  timeline,
  onUpdateScore,
  onDoorCodeUnlocked,
  onStartNow,
  onResetAgent,
  onSwitchToTerminal
}) => {
  // Modal State
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(isMuted());

  // Game Feedback Animations
  const [floatingPoints, setFloatingPoints] = useState<{ id: string; text: string; x: number; y: number }[]>([]);
  const [screenShake, setScreenShake] = useState<boolean>(false);
  const [comboStreak, setComboStreak] = useState<number>(1);
  const [actionNotice, setActionNotice] = useState<{ text: string; type: 'ok' | 'err' | 'warn' } | null>(null);

  // Station 1: Threats to Block
  const [threatPackets, setThreatPackets] = useState<ThreatPacket[]>([
    { id: 't1', code: '4129', type: 'Multipart OOM Flood', threatLevel: 'crit', points: 20 },
    { id: 't2', code: '7820', type: 'PHPSESSID Leak Spike', threatLevel: 'high', points: 20 },
    { id: 't3', code: '9014', type: 'Malformed Chunk Burst', threatLevel: 'crit', points: 20 },
    { id: 't4', code: '5531', type: 'Heap Overflow Attack', threatLevel: 'high', points: 20 }
  ]);
  const [blockedPacketsCount, setBlockedPacketsCount] = useState<number>(0);

  // Station 2: Pointer Laser Cutting
  const [pointerCleared, setPointerCleared] = useState<boolean>(false);
  const [heapGrid, setHeapGrid] = useState<number[]>([1, 1, 0, 1, 2, 1, 0, 1, 1, 0, 1, 1]); // 2 is corrupted 0x7f3a

  // Station 3: OPcache Detective
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [flaggedBox12, setFlaggedBox12] = useState<boolean>(false);
  const [sessionsRotated, setSessionsRotated] = useState<boolean>(false);

  // Station 4: Patch Battle
  const [patchApplied, setPatchApplied] = useState<boolean>(false);
  const [systemVerified, setSystemVerified] = useState<boolean>(false);
  const [trapWarning, setTrapWarning] = useState<string | null>(null);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sshConnecting, setSshConnecting] = useState<boolean>(false);

  // Door Code Input
  const [typedDoorCode, setTypedDoorCode] = useState<string>('');
  const [doorError, setDoorError] = useState<boolean>(false);

  const squadMeta = SQUADS[agent.squad] || SQUADS.sentinels;

  // Trigger floating point reward
  const triggerReward = (points: number, reason: string, e?: React.MouseEvent) => {
    sfx.powerup();
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;
    const floatId = `fl_${Date.now()}_${Math.random()}`;
    
    setFloatingPoints((prev) => [...prev, { id: floatId, text: `+${points} PTS!`, x, y }]);
    setTimeout(() => {
      setFloatingPoints((prev) => prev.filter((p) => p.id !== floatId));
    }, 1200);

    setComboStreak((prev) => Math.min(prev + 1, 5));
    onUpdateScore(points * comboStreak, reason);
  };

  // Trigger screen shake
  const triggerShake = () => {
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 400);
  };

  // 1. Handle Login action
  const handleQuickLogin = () => {
    setSshConnecting(true);
    sfx.keyClick();
    setTimeout(() => {
      setIsAuthenticated(true);
      setSshConnecting(false);
      sfx.unlock();
      triggerReward(30, 'SSH Root Authentication');
      setActionNotice({ text: 'تم منح صلاحيات الوصول الأمني بنجاح! ACCESS GRANTED', type: 'ok' });
    }, 600);
  };

  // 2. Handle Block Packet in Station 1
  const handleBlockPacket = (packet: ThreatPacket, e: React.MouseEvent) => {
    sfx.glitch();
    triggerShake();
    triggerReward(packet.points, `Blocked Threat ${packet.code}`, e);
    setThreatPackets((prev) => prev.filter((p) => p.id !== packet.id));
    setBlockedPacketsCount((prev) => prev + 1);

    // Auto replenish with new incoming threats for continuous arcade fun
    setTimeout(() => {
      const nextNum = Math.floor(1000 + Math.random() * 8999);
      const types = ['Heap Spill Payload', 'Buffer Injection', 'Multipart Exhaustion', 'Zend Memory Exploit'];
      const nextType = types[Math.floor(Math.random() * types.length)];
      setThreatPackets((prev) => [
        ...prev,
        { id: `t_${Date.now()}`, code: String(nextNum), type: nextType, threatLevel: 'high', points: 20 }
      ]);
    }, 1500);
  };

  // 3. Handle Pointer Cut in Station 2
  const handleCutPointer = (e: React.MouseEvent) => {
    if (pointerCleared) return;
    sfx.unlock();
    triggerShake();
    setPointerCleared(true);
    setHeapGrid((prev) => prev.map((val) => (val === 2 ? 1 : val)));
    triggerReward(50, 'Neutralized Use-After-Free Pointer 0x7f3a', e);
    setActionNotice({ text: 'تم قطع خيط الليزر وتصفير المؤشر المعلق بنجاح! Heap Stable', type: 'ok' });
  };

  // 4. Handle Flagging in Station 3
  const handleFlagBox12 = (e: React.MouseEvent) => {
    if (flaggedBox12) return;
    sfx.warn();
    setFlaggedBox12(true);
    triggerReward(40, 'Flagged OPcache Box 12 Malicious', e);
    setActionNotice({ text: 'تم كشف الصندوق المسموم رقم 12 وعزله من خط الكاش!', type: 'ok' });
  };

  const handleRotateSessions = (e: React.MouseEvent) => {
    if (sessionsRotated) return;
    sfx.whoosh();
    setSessionsRotated(true);
    triggerReward(40, 'Rotated Compromised User Sessions', e);
    setActionNotice({ text: 'تم تدوير جميع كوكيز الجلسات وإلغاء صلاحية الـ PHPSESSID المسربة!', type: 'ok' });
  };

  // 5. Handle Patch Battle in Station 4
  const handleWordPressTrap = () => {
    sfx.error();
    triggerShake();
    setTrapWarning('⚠️ تحذير: خطأ أمني! تحديث ووردبريس لا يحل المشكلة لأن الثغرة في محرك PHP نفسه! (-10 نقاط)');
    onUpdateScore(-10, 'WordPress Trap Penalty');
    setTimeout(() => setTrapWarning(null), 4000);
  };

  const handleApplyKernelPatch = (e: React.MouseEvent) => {
    if (patchApplied) return;
    sfx.powerup();
    setPatchApplied(true);
    triggerReward(80, 'Installed Secure PHP 8.4.27 Kernel', e);
    setActionNotice({ text: 'تم تنزيل ترقية النواة الآمنة PHP 8.4.27 بنجاح! Core Updated', type: 'ok' });
  };

  const handleVerifySystem = (e: React.MouseEvent) => {
    if (systemVerified) return;
    sfx.chime();
    setSystemVerified(true);
    triggerReward(100, 'System Integrity Verified Clean', e);
    setActionNotice({ text: 'تم فحص سلامة جميع الخدمات واستعادة الخادم بنجاح 100%! ALL SYSTEMS NOMINAL', type: 'ok' });
  };

  // 6. Handle Door Code Unlock
  const handleUnlockDoor = () => {
    if (typedDoorCode.trim() === timeline.doorCode) {
      sfx.unlock();
      onDoorCodeUnlocked();
      triggerReward(50, 'Door Code Unlocked');
      setTypedDoorCode('');
      setDoorError(false);
      setActionNotice({ text: 'تم فك قفل الباب الأمني بنجاح! الباب مفتوح', type: 'ok' });
    } else {
      sfx.error();
      triggerShake();
      setDoorError(true);
      setTimeout(() => setDoorError(false), 2000);
    }
  };

  return (
    <div 
      className={`min-h-screen w-full flex flex-col justify-between bg-[#04070f] relative overflow-x-hidden font-cairo select-none ${
        screenShake ? 'animate-shake' : ''
      }`}
    >
      {/* Instructions Modal */}
      <MissionBriefingModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onStartPlaying={() => {
          setShowHelpModal(false);
          if (timeline.phase === 'LOBBY' && onStartNow) {
            onStartNow();
          }
        }}
      />

      {/* Floating Score Rewards Animation */}
      {floatingPoints.map((item) => (
        <div
          key={item.id}
          className="fixed pointer-events-none z-50 font-black text-xl text-yellow-300 drop-shadow-[0_0_12px_#FBBC05] animate-float-up"
          style={{ left: item.x, top: item.y }}
        >
          {item.text}
        </div>
      ))}

      {/* ========================================================================= */}
      {/* TOP HUD: PLAYER CALLSIGN, HEALTH, SCORE & QUICK CONTROLS                  */}
      {/* ========================================================================= */}
      <header className="h-14 sm:h-16 flex-none px-3 sm:px-5 bg-[#060c20]/95 border-b border-slate-800 flex items-center justify-between z-20 shadow-lg">
        
        {/* Agent Info & Squad */}
        <div className="flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold shadow-md"
            style={{ background: `${squadMeta.color}25`, border: `1.5px solid ${squadMeta.color}` }}
          >
            {squadMeta.badge}
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-bold text-sm text-white">{agent.displayName}</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/50" style={{ color: squadMeta.color }}>
                {squadMeta.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
              <span>الرتبة:</span>
              <span className="font-mono text-emerald-400 font-bold">
                {agent.score >= 800 ? 'ROOT' : agent.score >= 500 ? 'GUARDIAN' : agent.score >= 200 ? 'HUNTER' : 'ANALYST'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Server Status & Countdown */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${timeline.activeAlarm ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
            <span className="font-mono text-base sm:text-lg font-black text-white tracking-wider">
              {timeline.phase === 'LOBBY' ? 'LOBBY' : `OVERLOAD :503`}
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-yellow-400">
            {timeline.overloadText}
          </span>
        </div>

        {/* Right: Score & Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Score & Combo */}
          <div className="text-right px-2.5 py-1 rounded-xl bg-black/60 border border-slate-700">
            <div className="flex items-center gap-1 font-mono font-black text-sm text-yellow-400">
              <Award size={14} className="text-yellow-400" />
              <span>{agent.score}</span>
              <span className="text-[10px] text-slate-400">PTS</span>
            </div>
            {comboStreak > 1 && (
              <span className="text-[9px] font-mono font-extrabold text-orange-400 animate-pulse block">
                COMBO x{comboStreak} 🔥
              </span>
            )}
          </div>

          {/* Help / Instructions Button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-300 hover:text-white hover:bg-blue-900 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="تعليمات المهمة وكيفية اللعب"
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">التعليمات</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={() => {
              const next = !isMuted();
              setMuted(next);
              setIsAudioMuted(next);
            }}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={isAudioMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
          >
            {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* SECONDARY ALERT BAR & LOBBY SKIP BANNER                                   */}
      {/* ========================================================================= */}
      {timeline.phase === 'LOBBY' && (
        <div className="h-10 flex-none px-4 bg-gradient-to-r from-blue-950/90 via-slate-900 to-emerald-950/90 border-b border-blue-500/30 flex items-center justify-between text-xs z-10">
          <div className="flex items-center gap-2 text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>في انتظار اكتمال الفرق وانطلاق الحادث (00:{String(Math.max(0, 45 - timeline.inPhaseSeconds)).padStart(2, '0')})</span>
          </div>
          {onStartNow && (
            <button
              onClick={onStartNow}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs shadow-[0_0_12px_rgba(52,168,83,0.4)] transition active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Zap size={14} fill="currentColor" />
              <span>⚡ ابدأ الهجوم فوراً (تخطي)</span>
            </button>
          )}
        </div>
      )}

      {/* Hazard Banner */}
      {timeline.activeAlarm && (
        <div className="haz h-9 flex-none flex items-center justify-center px-2 z-10">
          <div className="bg-[#150608] px-3 py-0.5 rounded-md flex items-center gap-2 text-xs font-black text-[#ff6b5e] border border-[#EA4335]">
            <span className="mono blink">BREACH ACTIVE</span>
            <span>·</span>
            <span>
              {timeline.phase === 'STATION_1' && 'المرحلة 1: صد وقصف طلبات استنزاف الذاكرة (CVE-2026-109618)'}
              {timeline.phase === 'STATION_2' && 'المرحلة 2: قص المؤشر المعلق Use-After-Free (CVE-2026-109619)'}
              {timeline.phase === 'STATION_3' && 'المرحلة 3: كشف صندوق OPcache المسموم وتدوير الجلسات'}
              {timeline.phase === 'STATION_4' && 'المرحلة 4: معركة الترقيع الأمني واستعادة النواة'}
              {timeline.phase === 'LOGIN' && 'المصادقة الأمنية: افتح بوابة السيرفر بكلمة المرور المؤقتة'}
              {timeline.phase === 'BREACH' && 'إنذار اختراق كلي: الخلل في مجمع الذاكرة!'}
            </span>
          </div>
        </div>
      )}

      {/* Quick Status Notice Toast */}
      {actionNotice && (
        <div className={`mx-3 sm:mx-5 my-1.5 p-2 rounded-xl text-center text-xs font-bold border transition animate-fade-in ${
          actionNotice.type === 'ok' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' : 'bg-red-950/80 border-red-500 text-red-200'
        }`}>
          {actionNotice.text}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN ARCADE INTERACTIVE STAGE                                             */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 max-w-4xl w-full mx-auto justify-center min-h-0 z-10 overflow-y-auto">

        {/* ------------------------------------------------------------------------- */}
        {/* SCENARIO 0: LOBBY / PRE-INCIDENT WAITING                                  */}
        {/* ------------------------------------------------------------------------- */}
        {timeline.phase === 'LOBBY' && (
          <div className="p-5 sm:p-7 rounded-2xl bg-[#071026]/90 border border-blue-500/30 text-center space-y-4 shadow-2xl my-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto text-3xl">
              🛡️
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              غرفة العمليات جاهزة — في انتظار بدء الحادث الأمني
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              السيرفر الآن يعمل بحالة مستقرة، ولكن مستشعرات الذكاء الاصطناعي ترصد هجوماً وشيكاً سيضرب نواة PHP!
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 max-w-md mx-auto">
              <button
                onClick={() => setShowHelpModal(true)}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <HelpCircle size={16} />
                <span>شاهد كيف تلعب (التعليمات)</span>
              </button>

              {onStartNow && (
                <button
                  onClick={onStartNow}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 text-black text-xs font-black shadow-[0_0_20px_rgba(52,168,83,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Zap size={16} fill="currentColor" />
                  <span>انطلق للهجوم فوراً الآن 🚀</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* SCENARIO 1: LOGIN / AUTHENTICATION GATEWAY                                */}
        {/* ------------------------------------------------------------------------- */}
        {(timeline.phase === 'LOGIN' || (!isAuthenticated && timeline.phase !== 'LOBBY')) && (
          <div className="p-5 sm:p-7 rounded-2xl bg-[#08122c]/95 border-2 border-[#4285F4]/60 text-center space-y-4 shadow-[0_0_40px_rgba(66,133,244,0.3)] my-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono text-xs">
              <Lock size={14} />
              <bdi dir="ltr">SSH SECURITY GATEWAY • PROD-04</bdi>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white">
              مطلوب مصادقة المسؤول الأمني (Authentication Required)
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
              السيرفر تحت ضغط استثنائي ومغلق! استخدم كلمة المرور المؤقتة المعتمدة للدخول:
            </p>

            {/* Credential Badge */}
            <div className="p-3 rounded-xl bg-black/70 border border-yellow-500/50 max-w-xs mx-auto text-center space-y-1">
              <span className="text-[10px] text-yellow-400 font-bold block">كلمة مرور السيرفر المؤقتة:</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest text-glow-yellow">
                Ov3r-503
              </span>
            </div>

            {/* Quick Connect Button */}
            <div className="pt-2">
              <button
                onClick={handleQuickLogin}
                disabled={sshConnecting || isAuthenticated}
                className="w-full max-w-md mx-auto min-h-[50px] rounded-xl bg-gradient-to-r from-[#4285F4] to-emerald-500 hover:brightness-110 text-white font-black text-sm shadow-[0_0_25px_rgba(66,133,244,0.4)] transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Unlock size={18} />
                <span>{sshConnecting ? 'جارِ الاتصال وفحص الصلاحيات...' : '🔑 تسجيل الدخول السريع (SSH CONNECT)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* SCENARIO 2: STATION 1 — THREAT BLASTER (Type or Click to Block)           */}
        {/* ------------------------------------------------------------------------- */}
        {isAuthenticated && timeline.phase === 'STATION_1' && (
          <div className="space-y-4 my-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Target className="text-red-400" />
                  <span>المحطة 1: صد وقصف طلبات الهجوم الساقطة</span>
                </h3>
                <p className="text-xs text-slate-300">
                  انقر فوراً على أي طلب لتفجيره وحظره، أو اكتب رمزه لمنع انهيار الذاكرة!
                </p>
              </div>
              <div className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                المحظور: {blockedPacketsCount} طلب
              </div>
            </div>

            {/* Falling Threat Packets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {threatPackets.map((pkt) => (
                <div
                  key={pkt.id}
                  onClick={(e) => handleBlockPacket(pkt, e)}
                  className="p-3.5 rounded-xl border-2 border-red-500/60 bg-gradient-to-r from-red-950/60 to-black hover:border-red-400 hover:shadow-[0_0_20px_rgba(234,67,53,0.4)] transition-all cursor-pointer flex items-center justify-between gap-3 active:scale-95 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-black text-red-400 group-hover:text-red-300">
                        #{pkt.code}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 font-bold uppercase">
                        {pkt.threatLevel}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-200">
                      {pkt.type}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target: /upload.php · Size: 84MB
                    </span>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-red-600 group-hover:bg-red-500 text-white font-black text-xs shadow-md transition shrink-0 flex items-center gap-1"
                  >
                    <Flame size={14} />
                    <span>حظر (BLOCK)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* SCENARIO 3: STATION 2 — MEMORY POINTER LASER CUT                          */}
        {/* ------------------------------------------------------------------------- */}
        {isAuthenticated && timeline.phase === 'STATION_2' && (
          <div className="space-y-4 my-auto">
            <div className="text-center sm:text-right">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                <Scissors className="text-yellow-400" />
                <span>المحطة 2: لغز قص المؤشر المعلق (Use-After-Free)</span>
              </h3>
              <p className="text-xs text-slate-300">
                كتلة الذاكرة <bdi dir="ltr" className="font-mono text-yellow-300 font-bold">0x7f3a</bdi> تم تحريرها ولكن المؤشر لا يزال معلقاً! المس المؤشر لقصه فوراً:
              </p>
            </div>

            {/* Heap Grid Visualizer */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#09152e] border border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
                <span>HEAP CHUNK ALLOCATION</span>
                <span className={pointerCleared ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold blink'}>
                  {pointerCleared ? 'POINTER NEUTRALIZED (STABLE)' : 'STALE POINTER: 0x7f3a ACTIVE'}
                </span>
              </div>

              {/* Memory Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 py-2">
                {heapGrid.map((type, idx) => {
                  const isCorrupted = type === 2;
                  return (
                    <div
                      key={idx}
                      onClick={(e) => isCorrupted && handleCutPointer(e)}
                      className={`h-12 rounded-lg border-2 transition flex flex-col items-center justify-center font-mono text-[10px] cursor-pointer ${
                        isCorrupted
                          ? 'bg-red-950/80 border-red-500 text-red-200 animate-pulse shadow-[0_0_15px_rgba(234,67,53,0.5)] scale-105'
                          : type === 1
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="font-bold">
                        {isCorrupted ? '0x7f3a' : `0x${(idx + 10).toString(16)}`}
                      </span>
                      <span className="text-[8px] opacity-75">
                        {isCorrupted ? 'CORRUPT' : type === 1 ? 'OK' : 'FREE'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <button
                onClick={handleCutPointer}
                disabled={pointerCleared}
                className={`w-full min-h-[48px] rounded-xl font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                  pointerCleared
                    ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-500 to-red-500 hover:brightness-110 text-black shadow-[0_0_20px_rgba(251,188,5,0.4)]'
                }`}
              >
                <Scissors size={18} />
                <span>
                  {pointerCleared ? '✓ تم قص المؤشر وتصفير الذاكرة بنجاح' : '✂️ اضغط هنا لقص مؤشر الذاكرة (CUT 0x7f3a)'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* SCENARIO 4: STATION 3 — OPCACHE DETECTIVE (Flag Box 12 & Rotate)          */}
        {/* ------------------------------------------------------------------------- */}
        {isAuthenticated && timeline.phase === 'STATION_3' && (
          <div className="space-y-4 my-auto">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Search className="text-purple-400" />
                <span>المحطة 3: ماسح الـ OPcache وتدوير الجلسات</span>
              </h3>
              <p className="text-xs text-slate-300">
                الهكر يتلاعب بأنواع البيانات (<bdi dir="ltr">Type Confusion</bdi>) في الصندوق رقم 12. اعزل الصندوق ودوّر كوكيز الجلسات:
              </p>
            </div>

            {/* OPcache Boxes Matrix */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-3 bg-[#0a1024] rounded-2xl border border-slate-700">
              {[...Array(16)].map((_, i) => {
                const boxNum = i + 1;
                const isMalicious = boxNum === 12;
                const isSelected = selectedBox === boxNum;

                return (
                  <div
                    key={boxNum}
                    onClick={(e) => {
                      setSelectedBox(boxNum);
                      if (isMalicious) handleFlagBox12(e);
                      else sfx.tick();
                    }}
                    className={`h-14 rounded-xl border-2 p-1 flex flex-col items-center justify-center cursor-pointer transition ${
                      isMalicious && flaggedBox12
                        ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                        : isMalicious
                        ? 'bg-red-950/60 border-red-500 text-red-300 animate-pulse'
                        : isSelected
                        ? 'bg-blue-950 border-blue-500 text-blue-200'
                        : 'bg-black/60 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold">#{boxNum}</span>
                    <span className="text-[8px] font-bold">
                      {isMalicious ? (flaggedBox12 ? 'FLAGGED' : 'INFECTED') : 'SAFE'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Dual Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleFlagBox12}
                disabled={flaggedBox12}
                className={`min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                  flaggedBox12
                    ? 'bg-purple-950/40 border border-purple-500 text-purple-300 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                }`}
              >
                <AlertTriangle size={16} />
                <span>{flaggedBox12 ? '✓ تم تمييز وعزل الصندوق #12' : '🚩 عزل الصندوق المسموم (#12)'}</span>
              </button>

              <button
                onClick={handleRotateSessions}
                disabled={sessionsRotated}
                className={`min-h-[48px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md ${
                  sessionsRotated
                    ? 'bg-emerald-950/40 border border-emerald-500 text-emerald-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(66,133,244,0.4)]'
                }`}
              >
                <RotateCw size={16} />
                <span>{sessionsRotated ? '✓ تم تدوير جميع الجلسات' : '🔄 تدوير الجلسات (ROTATE SESSIONS)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* SCENARIO 5: STATION 4 — THE PATCH BATTLE & VERIFICATION                   */}
        {/* ------------------------------------------------------------------------- */}
        {isAuthenticated && timeline.phase === 'STATION_4' && (
          <div className="space-y-4 my-auto">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Shield className="text-emerald-400" />
                <span>المحطة 4: معركة الترقيع الجذري وتأمين السيرفر</span>
              </h3>
              <p className="text-xs text-slate-300">
                اختر القرار الأمني الصحيح بحذر لإغلاق الثغرة نهائياً واستعادة السيرفر:
              </p>
            </div>

            {/* Trap Warning Alert if triggered */}
            {trapWarning && (
              <div className="p-3 rounded-xl bg-red-950 border-2 border-red-500 text-red-200 text-xs font-bold animate-shake">
                {trapWarning}
              </div>
            )}

            {/* Decision Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: The Trap */}
              <div 
                onClick={handleWordPressTrap}
                className="p-4 rounded-xl border-2 border-slate-800 bg-[#0d0914] hover:border-red-500/60 transition cursor-pointer space-y-1 active:scale-98 group"
              >
                <span className="text-[10px] text-red-400 font-bold block">الخيار (أ)</span>
                <h4 className="font-bold text-xs text-white group-hover:text-red-300">
                  🔴 تحديث WordPress إلى أحدث نسخة
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  تحديث سكربت التطبيق فقط وترك نواة PHP كما هي.
                </p>
              </div>

              {/* Option B: The Root Fix */}
              <div 
                onClick={handleApplyKernelPatch}
                className={`p-4 rounded-xl border-2 transition cursor-pointer space-y-1 active:scale-98 group ${
                  patchApplied
                    ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                    : 'border-[#34A853]/60 bg-[#06150e] hover:border-[#34A853]'
                }`}
              >
                <span className="text-[10px] text-emerald-400 font-bold block">الخيار (ب) - الحل الجذري</span>
                <h4 className="font-bold text-xs text-white group-hover:text-emerald-300">
                  🟢 ترقية نواة PHP إلى 8.4.27 (sudo apt install)
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ترقية محرك اللغة نفسه وإصلاح الخلل في هياكل الذاكرة والـ Heap.
                </p>
              </div>
            </div>

            {/* Final Verify Button */}
            <button
              onClick={handleVerifySystem}
              disabled={systemVerified || !patchApplied}
              className={`w-full min-h-[50px] rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95 ${
                systemVerified
                  ? 'bg-emerald-600 text-black cursor-not-allowed shadow-[0_0_20px_rgba(52,168,83,0.5)]'
                  : patchApplied
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-black shadow-[0_0_25px_rgba(52,168,83,0.4)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={18} />
              <span>
                {systemVerified 
                  ? '✓ تم التحقق واستعادة السيرفر بنجاح 100%' 
                  : patchApplied 
                  ? '🛡️ فحص سلامة النظام وتأكيد التعافي (VERIFY SYSTEM)' 
                  : 'طبق ترقية النواة أولاً لتفعيل الفحص النهائي'}
              </span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* SCENARIO 6: DOOR CODE ROTATION CHALLENGE (Between Stations)                */}
        {/* ------------------------------------------------------------------------- */}
        {isAuthenticated && timeline.phase.startsWith('DOOR') && (
          <div className="p-5 sm:p-7 rounded-2xl bg-[#140b28]/95 border-2 border-purple-500/60 text-center space-y-4 shadow-[0_0_40px_rgba(168,85,247,0.3)] my-auto">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center mx-auto text-2xl">
              🔐
            </div>
            <h3 className="text-xl font-black text-white">
              بوابة الأمان المغلقة — فك قفل المحطة التالية
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              أدخل رمز المرور الأمني الظاهر على شاشة المضيف (<bdi dir="ltr" className="font-mono text-yellow-300 font-bold">{timeline.doorCode}</bdi>) لفتح الباب:
            </p>

            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                type="text"
                value={typedDoorCode}
                onChange={(e) => setTypedDoorCode(e.target.value)}
                placeholder="أدخل رمز 4 أرقام"
                maxLength={4}
                className="flex-1 bg-black/70 border border-slate-700 rounded-xl px-3 py-2 text-center font-mono text-lg font-bold text-white outline-none focus:border-purple-500"
              />
              <button
                onClick={handleUnlockDoor}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
              >
                فك القفل
              </button>
            </div>

            {doorError && (
              <span className="text-red-400 text-xs font-bold block animate-shake">
                رمز غير صحيح، انظر للرمز الظاهر في الشاشة الكبيرة!
              </span>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------------- */}
        {/* SCENARIO 7: SECURED / HALL OF DEFENDERS CELEBRATION                       */}
        {/* ------------------------------------------------------------------------- */}
        {timeline.phase === 'SECURED' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#071f14]/95 border-2 border-emerald-500/80 text-center space-y-4 shadow-[0_0_50px_rgba(52,168,83,0.4)] my-auto animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              🏆
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white">
              تم إنقاذ السيرفر بنجاح تام! ALL SYSTEMS SECURED
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 max-w-md mx-auto leading-relaxed">
              تهانينا يا <strong className="text-emerald-300">{agent.displayName}</strong>! نجحت كتيبتك في تطهير الذاكرة وترقية النواة وصنع الفارق في النتيجة العامة.
            </p>

            <div className="p-4 rounded-xl bg-black/60 border border-slate-700 max-w-sm mx-auto flex items-center justify-around font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">مجموع نقاطك</span>
                <span className="text-2xl font-black text-yellow-400">{agent.score}</span>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 block">الرتبة النهائية</span>
                <span className="text-lg font-black text-emerald-400">
                  {agent.score >= 800 ? 'ROOT' : agent.score >= 500 ? 'GUARDIAN' : 'HUNTER'}
                </span>
              </div>
            </div>

            {onStartNow && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onStartNow}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-black font-black text-sm shadow-[0_0_25px_rgba(52,168,83,0.4)] transition flex items-center justify-center gap-2 cursor-pointer mx-auto active:scale-95"
                >
                  <RotateCw size={18} />
                  <span>🎮 العب جولة جديدة وتحدَّ نفسك (PLAY AGAIN)</span>
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* BOTTOM CONTROL FOOTER & TERMINAL SWITCHER                                 */}
      {/* ========================================================================= */}
      <footer className="h-12 flex-none px-4 bg-[#050a1b] border-t border-slate-800 flex items-center justify-between text-xs font-mono z-20">
        
        {/* Terminal Switcher */}
        {onSwitchToTerminal && (
          <button
            onClick={onSwitchToTerminal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b1638] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition cursor-pointer text-xs"
          >
            <Terminal size={14} className="text-[#34A853]" />
            <span>💻 فتح شاشة التيرمينال (Terminal)</span>
          </button>
        )}

        <div className="flex items-center gap-3">
          {onResetAgent && (
            <button
              onClick={onResetAgent}
              className="text-red-400 hover:text-red-300 transition text-[11px]"
            >
              🔄 خروج وتبديل الحساب
            </button>
          )}

          <span className="text-slate-500 text-[10px]">
            Google DGoC | TU · OVERLOAD503
          </span>
        </div>

      </footer>

    </div>
  );
};
