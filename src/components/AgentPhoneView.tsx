import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Heart, 
  Users, 
  Lock, 
  Unlock, 
  Layers, 
  Snowflake,
  RefreshCw,
  Box,
  Server,
  Sparkles
} from 'lucide-react';
import { Agent, EventState, Squad, StationId } from '../types/game';
import { SQUADS, STATIONS } from '../data/gameData';
import { sfx } from '../services/audioService';

interface AgentPhoneViewProps {
  agent: Agent;
  eventState: EventState;
  allAgents?: Agent[];
  onUpdateScore: (points: number, actionDescription: string) => void;
  onUpdateCombo: (combo: number) => void;
  onBetSubmitted: (choiceId: string, stake: number) => void;
  onSquadNodeAction?: (squad: Squad, nodeId: string, newStatus: 'patched' | 'restarted' | 'verified') => void;
  onDoorCodeUnlocked: () => void;
  onStartIncidentNow?: () => void;
  onPurgeHeap?: () => void;
}

interface ThreatItem {
  id: string;
  title: string;
  subtitle: string;
  isMalicious: boolean;
  cveTag?: string;
  points: number;
}

export const AgentPhoneView: React.FC<AgentPhoneViewProps> = ({
  agent,
  eventState,
  allAgents = [],
  onUpdateScore,
  onUpdateCombo,
  onBetSubmitted,
  onDoorCodeUnlocked,
  onStartIncidentNow,
  onPurgeHeap
}) => {
  // Door Code Keypad State
  const [doorCodeInput, setDoorCodeInput] = useState<string>('');
  const [doorCodeError, setDoorCodeError] = useState<boolean>(false);
  const [doorCodeSuccess, setDoorCodeSuccess] = useState<boolean>(false);

  // Active Threats Stream
  const [activeThreats, setActiveThreats] = useState<ThreatItem[]>([]);
  const [floatingPoints, setFloatingPoints] = useState<Array<{ id: string; text: string; x: number; y: number }>>([]);

  // Station 4: The Bet
  const [betStake, setBetStake] = useState<number>(100);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betSubmitted, setBetSubmitted] = useState<boolean>(false);

  const squadMeta = SQUADS[agent.squad] || SQUADS.sentinels;
  const isAlert = eventState.status === 'INCIDENT_ACTIVE' && (eventState.activeAlarm || eventState.currentStation >= 1);
  const isLobby = eventState.currentStation === 0 || eventState.status === 'STABLE';

  // Haptic feedback helper
  const triggerHaptic = (ms = 40) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  const showFloatingPoint = (text: string, e?: React.MouseEvent) => {
    const id = `fp_${Date.now()}_${Math.random()}`;
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY - 20 : window.innerHeight / 2;
    setFloatingPoints((prev) => [...prev, { id, text, x, y }]);
    setTimeout(() => {
      setFloatingPoints((prev) => prev.filter((p) => p.id !== id));
    }, 900);
  };

  // 1. Continuous Threat Stream Generator (Unified for ALL tracks)
  useEffect(() => {
    const spawnThreat = () => {
      const threatTypes: ThreatItem[] = [
        {
          id: `t_${Date.now()}_1`,
          title: 'POST /upload (128MB multipart)',
          subtitle: 'استنزاف ذاكرة الـ Heap وتجاوز الحد الأقصى',
          isMalicious: true,
          cveTag: 'CVE-2026-109618',
          points: 35
        },
        {
          id: `t_${Date.now()}_2`,
          title: 'Stale Pointer: 0x7f3a -> FREED',
          subtitle: 'مؤشر معلّق يشير لكتلة ذاكرة محررة (UAF)',
          isMalicious: true,
          cveTag: 'CVE-2026-109619',
          points: 40
        },
        {
          id: `t_${Date.now()}_3`,
          title: 'Cookie: PHPSESSID=7f3a9c1e... (4KB)',
          subtitle: 'تسريب محتويات الذاكرة داخل الجلسة',
          isMalicious: true,
          cveTag: 'LEAK',
          points: 30
        },
        {
          id: `t_${Date.now()}_4`,
          title: 'OPcache: Type Confusion Object',
          subtitle: 'ارتباك أنواع في كائنات Zend Engine',
          isMalicious: true,
          cveTag: 'CORRUPT',
          points: 45
        },
        {
          id: `t_${Date.now()}_5`,
          title: 'GET /static/style.css 200 OK',
          subtitle: 'طلب ملفات نظيف - حركة مرور سليمة',
          isMalicious: false,
          points: -15
        },
        {
          id: `t_${Date.now()}_6`,
          title: 'GET /api/v1/healthcheck 200',
          subtitle: 'فحص دوري للخادم - لا تعترضه!',
          isMalicious: false,
          points: -15
        }
      ];

      const item = threatTypes[Math.floor(Math.random() * threatTypes.length)];
      setActiveThreats((prev) => [...prev.slice(-3), { ...item, id: `threat_${Date.now()}_${Math.random()}` }]);
    };

    // Initial fill
    if (activeThreats.length === 0) {
      spawnThreat();
      spawnThreat();
    }

    const interval = setInterval(spawnThreat, isLobby ? 1800 : 1300);
    return () => clearInterval(interval);
  }, [isLobby]);

  // Threat interception handler
  const handleThreatClick = (threat: ThreatItem, e: React.MouseEvent) => {
    setActiveThreats((prev) => prev.filter((t) => t.id !== threat.id));
    triggerHaptic(50);

    if (threat.isMalicious) {
      sfx.unlock();
      const currentCombo = agent.combo || 1;
      const newCombo = Math.min(5, currentCombo + 1);
      const earned = threat.points * (newCombo >= 5 ? 3 : newCombo >= 3 ? 2 : 1);
      
      onUpdateCombo(newCombo);
      onUpdateScore(earned, `اعتراض: ${threat.title}`);
      showFloatingPoint(`+${earned} PTS 🔥 x${newCombo}`, e);
    } else {
      sfx.error();
      onUpdateCombo(1);
      onUpdateScore(threat.points, 'خطأ: اعتراض طلب سليم!');
      showFloatingPoint(`-15 خطأ ⚠️`, e);
    }
  };

  // Door Code Keypad Click Handler
  const handleKeypadPress = (key: string) => {
    triggerHaptic(30);

    if (key === 'مسح') {
      sfx.keyClick();
      setDoorCodeInput('');
      return;
    }

    if (key === 'تأكيد') {
      if (doorCodeInput === eventState.doorCode || doorCodeInput.length === 4) {
        if (doorCodeInput === eventState.doorCode) {
          setDoorCodeSuccess(true);
          sfx.unlock();
          sfx.chime();
          onUpdateScore(100, 'فك شفرة الباب الأمني بنجاح!');
          onDoorCodeUnlocked();
          setTimeout(() => {
            setDoorCodeSuccess(false);
            setDoorCodeInput('');
          }, 2000);
        } else {
          setDoorCodeError(true);
          sfx.error();
          setTimeout(() => {
            setDoorCodeError(false);
            setDoorCodeInput('');
          }, 1200);
        }
      }
      return;
    }

    if (doorCodeInput.length < 4) {
      sfx.keyClick();
      const next = doorCodeInput + key;
      setDoorCodeInput(next);

      if (next.length === 4) {
        if (next === eventState.doorCode) {
          setDoorCodeSuccess(true);
          sfx.unlock();
          sfx.chime();
          onUpdateScore(100, 'فك شفرة الباب الأمني بنجاح!');
          onDoorCodeUnlocked();
          setTimeout(() => {
            setDoorCodeSuccess(false);
            setDoorCodeInput('');
          }, 2000);
        } else {
          setDoorCodeError(true);
          sfx.error();
          setTimeout(() => {
            setDoorCodeError(false);
            setDoorCodeInput('');
          }, 1200);
        }
      }
    }
  };

  // Emergency Purge Button Handler
  const handlePurge = (e: React.MouseEvent) => {
    triggerHaptic(60);
    sfx.unlock();
    onUpdateScore(15, 'تطهير الذاكرة السريع (Emergency Purge)');
    showFloatingPoint('+15 تطهير 🛡️', e);
    if (onPurgeHeap) onPurgeHeap();
  };

  // Bet Submit Handler
  const handleSelectBet = (choiceId: string) => {
    if (betSubmitted) return;
    setSelectedBet(choiceId);
    setBetSubmitted(true);
    triggerHaptic(70);
    sfx.unlock();
    onBetSubmitted(choiceId, betStake);

    const isCorrect = choiceId === 'opt-a';
    if (isCorrect) {
      sfx.chime();
      onUpdateScore(betStake, 'رهان رابح: ترقية نواة PHP ومعالجة الـ Heap!');
    } else {
      sfx.error();
      onUpdateScore(-betStake, 'رهان خاسر: الخلل يكمن في محرك اللغة نفسه!');
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-between p-3 bg-[#03060f] relative overflow-x-hidden font-cairo ${isAlert ? 'alarm-vignette' : ''}`}>
      
      {/* Floating Point Indicators */}
      {floatingPoints.map((fp) => (
        <div
          key={fp.id}
          className="fixed pointer-events-none z-50 font-mono font-black text-sm px-2 py-1 rounded-full bg-black/80 border border-amber-400 text-amber-300 animate-bounce"
          style={{ left: fp.x - 40, top: fp.y }}
        >
          {fp.text}
        </div>
      ))}

      {/* Main Container - max-w-[440px] for phones */}
      <div className="w-full max-w-[440px] flex-1 flex flex-col justify-between z-10 gap-2.5">

        {/* 1. TOP HUD BAR: Identity + Live Points + Streak */}
        <header className="w-full rounded-2xl bg-[#070e24]/95 border border-[#4285F4]/30 p-3 shadow-[0_0_20px_rgba(66,133,244,0.15)] shrink-0">
          <div className="flex items-center justify-between gap-2">
            
            {/* Identity & Squad */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: squadMeta.color, color: squadMeta.color }} />
              <div className="text-right">
                <span className="font-black text-sm text-white block leading-tight">
                  {agent.displayName}
                </span>
                <span className="text-[11px] font-mono font-bold" style={{ color: squadMeta.color }}>
                  <bdi dir="ltr">{squadMeta.name} · {squadMeta.track}</bdi>
                </span>
              </div>
            </div>

            {/* Live Score + Streak */}
            <div className="flex items-center gap-2">
              {(agent.combo || 1) > 1 && (
                <div className="px-2 py-0.5 rounded-lg bg-red-950/80 border border-red-500/60 flex items-center gap-1 animate-pulse">
                  <Flame size={14} className="text-red-400" />
                  <span className="text-xs font-mono font-black text-red-300">x{agent.combo}</span>
                </div>
              )}
              <div className="px-3 py-1 rounded-xl bg-[#0c1a40] border border-[#4285F4]/50 text-right">
                <span className="text-[10px] font-mono text-slate-400 block leading-none">نقاط الدفاع</span>
                <span className="text-base font-mono font-black text-white">{agent.score || 0}</span>
              </div>
            </div>

          </div>

          {/* Server Health Bar */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-slate-400">صحة السيرفر المشتركة</span>
            <div className="flex-1 mx-2 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  eventState.sharedServerHealth > 50 ? 'bg-[#34A853]' : eventState.sharedServerHealth > 25 ? 'bg-[#FBBC05]' : 'bg-[#EA4335]'
                }`}
                style={{ width: `${Math.max(5, eventState.sharedServerHealth || 100)}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-white">{eventState.sharedServerHealth || 100}%</span>
          </div>
        </header>

        {/* 2. MAIN ACTIVE GAMEPLAY CONTENT */}
        <main className="w-full flex-1 flex flex-col justify-between gap-3 min-h-0">

          {/* LOBBY PHASE: INTERACTIVE WARMUP GAME */}
          {isLobby && (
            <div className="p-3.5 rounded-2xl bg-[#070e24]/90 border border-blue-500/30 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                <Sparkles size={13} className="text-emerald-400 animate-spin" />
                <span>تدريب ردود الأفعال • WARMUP COMBAT</span>
              </div>

              <div className="space-y-0.5">
                <h2 className="text-base font-black text-white">المس التهديدات قبل انطلاق الحادث الأمني!</h2>
                <p className="text-xs text-slate-300">
                  انقر على الباكتات الحمراء لرفع رصيدك وتدريب سرعة استجابتك.
                </p>
              </div>

              {/* Instant Start Override Button */}
              {onStartIncidentNow && (
                <button
                  onClick={onStartIncidentNow}
                  className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white font-black text-sm shadow-[0_0_20px_rgba(234,67,53,0.5)] active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap size={18} />
                  <span>⚡ إطلاق صافرة الإنذار وبدء الهجوم الآن!</span>
                </button>
              )}
            </div>
          )}

          {/* STATION 4 SPECIAL: THE BET (الرهان الأمني) */}
          {eventState.currentStation === 4 && (
            <div className="p-3.5 rounded-2xl bg-[#0b1430] border-2 border-[#FBBC05]/60 text-center space-y-2.5">
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-950/80 border border-amber-500 text-amber-300 text-xs font-mono">
                <Clock size={12} />
                <span>المحطة 4 • الرهان الأمني الأخير (THE BET)</span>
              </div>
              <h3 className="text-sm font-black text-white leading-snug">
                أين يكمن الحل الجذري لاحتواء ثغرات PHP2Shell؟
              </h3>

              {/* Stake Selector */}
              <div className="flex items-center justify-center gap-2 text-xs font-mono">
                <span>قيمة الرهان:</span>
                {[50, 100, 200].map((s) => (
                  <button
                    key={s}
                    disabled={betSubmitted}
                    onClick={() => setBetStake(s)}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer transition ${
                      betStake === s ? 'bg-amber-500 text-black border-amber-400' : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {s} PTS
                  </button>
                ))}
              </div>

              {/* 4 Betting Choices */}
              <div className="grid grid-cols-1 gap-2 text-right text-xs">
                {[
                  { id: 'opt-a', label: '🅰️ ترقية وتصحيح نواة PHP ومحرك Zend Engine (CVE Patch)', isCorrect: true },
                  { id: 'opt-b', label: '🅱️ تعديل ملف إعدادات الخادم php.ini وزيادة memory_limit', isCorrect: false },
                  { id: 'opt-c', label: '🅲 حذف ملفات الأكواد وإيقاف الخادم بالكامل', isCorrect: false },
                  { id: 'opt-d', label: '🅳 حظر عناوين الـ IP فقط عبر الجدار الناري WAF', isCorrect: false }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    disabled={betSubmitted}
                    onClick={() => handleSelectBet(opt.id)}
                    className={`p-2.5 rounded-xl border text-right font-bold transition cursor-pointer flex items-center justify-between ${
                      selectedBet === opt.id
                        ? opt.isCorrect
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-[0_0_15px_#34A853]'
                          : 'bg-red-950/80 border-red-500 text-red-200 shadow-[0_0_15px_#EA4335]'
                        : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedBet === opt.id && (opt.isCorrect ? '✅ رابح' : '❌ خاسر')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INTERACTIVE THREAT STREAM (Always Active for All Players!) */}
          <div className="flex-1 rounded-2xl bg-[#02050f] border border-slate-800 p-2.5 flex flex-col justify-end gap-2 min-h-[220px]">
            <div className="flex items-center justify-between px-1 text-[11px] font-mono text-slate-400">
              <span>⚠️ المس الهجمات الحمراء فقط:</span>
              <span className="text-amber-400 font-bold">نقاط مضاعفة مع الكومبو 🔥</span>
            </div>

            {activeThreats.map((threat) => (
              <button
                key={threat.id}
                onClick={(e) => handleThreatClick(threat, e)}
                className={`w-full min-h-[50px] p-2.5 rounded-xl border text-right font-mono text-xs flex items-center justify-between active:scale-95 transition cursor-pointer shadow-md ${
                  threat.isMalicious
                    ? 'border-red-500/80 bg-red-950/50 text-red-100 shadow-[0_0_15px_rgba(234,67,53,0.3)] animate-pulse'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 opacity-80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-cairo font-bold ${threat.isMalicious ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                    {threat.isMalicious ? 'هجوم ⚠️' : 'سليم ✅'}
                  </span>
                  {threat.cveTag && (
                    <span className="text-[10px] text-amber-300 border border-amber-500/40 px-1 rounded">
                      {threat.cveTag}
                    </span>
                  )}
                </div>
                <div className="text-left truncate mr-2">
                  <span className="font-bold block truncate text-xs"><bdi dir="ltr">{threat.title}</bdi></span>
                  <span className="text-[10px] text-slate-400 block truncate">{threat.subtitle}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 🚨 THE EMERGENCY PURGE BUTTON (Interactive Room Cooperation) */}
          <button
            onClick={handlePurge}
            className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white font-black text-sm active:scale-95 shadow-[0_0_25px_rgba(234,67,53,0.6)] border border-red-400 transition cursor-pointer flex items-center justify-center gap-2 animate-pulse"
          >
            <Shield size={20} className="animate-bounce" />
            <span>🚨 تطهير الذاكرة السريع • PURGE HEAP (+15 PTS)</span>
          </button>

          {/* 🔐 DOOR CODE AIRLOCK KEYPAD (Always Accessible on Screen) */}
          <div className="p-3 rounded-2xl bg-[#070e24] border border-[#FBBC05]/40 text-center space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Lock size={12} />
                <span>رمز الباب من الشاشة الكبيرة:</span>
              </span>
              <span className="text-slate-400">4 أرقام (+100 PTS)</span>
            </div>

            {/* Input Display */}
            <div className="flex items-center justify-center gap-2 font-mono dir-ltr py-0.5">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-11 h-12 rounded-xl border flex items-center justify-center text-xl font-black transition-all ${
                    doorCodeSuccess
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400 shadow-[0_0_15px_#34A853]'
                      : doorCodeError
                      ? 'border-red-500 bg-red-950/60 text-red-400 animate-shake'
                      : 'border-slate-700 bg-slate-900/90 text-white'
                  }`}
                >
                  {doorCodeInput[idx] || '_'}
                </div>
              ))}
            </div>

            {/* Keypad Grid (Min 48px touch targets) */}
            <div className="grid grid-cols-3 gap-1.5 max-w-[280px] mx-auto font-mono text-sm">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'مسح', '0', 'تأكيد'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleKeypadPress(btn)}
                  className={`min-h-[44px] rounded-xl font-bold active:scale-95 transition cursor-pointer border ${
                    btn === 'تأكيد'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : btn === 'مسح'
                      ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                      : 'bg-slate-900/90 text-white border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>

        </main>

      </div>
    </div>
  );
};
