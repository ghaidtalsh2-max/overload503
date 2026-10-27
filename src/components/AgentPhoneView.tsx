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
  Server
} from 'lucide-react';
import { Agent, EventState, Squad, StationId } from '../types/game';
import { SQUADS, STATIONS, THE_BET_OPTIONS } from '../data/gameData';
import { audio } from '../services/audioService';

interface AgentPhoneViewProps {
  agent: Agent;
  eventState: EventState;
  allAgents?: Agent[];
  onUpdateScore: (points: number, actionDescription: string) => void;
  onUpdateCombo: (combo: number) => void;
  onBetSubmitted: (choiceId: string, stake: number) => void;
  onSquadNodeAction: (squad: Squad, nodeId: string, newStatus: 'patched' | 'restarted' | 'verified') => void;
  onDoorCodeUnlocked: () => void;
}

export const AgentPhoneView: React.FC<AgentPhoneViewProps> = ({
  agent,
  eventState,
  allAgents = [],
  onUpdateScore,
  onUpdateCombo,
  onBetSubmitted,
  onSquadNodeAction,
  onDoorCodeUnlocked
}) => {
  const [doorCodeInput, setDoorCodeInput] = useState<string>('');
  const [doorCodeError, setDoorCodeError] = useState<boolean>(false);
  const [doorCodeSuccess, setDoorCodeSuccess] = useState<boolean>(false);

  // Station 1: Falling Requests Game State
  const [s1Requests, setS1Requests] = useState<Array<{
    id: string;
    text: string;
    isSuspicious: boolean;
  }>>([]);
  const [bossHp, setBossHp] = useState<number>(5);
  const [bossActive, setBossActive] = useState<boolean>(false);

  // Station 2: Laser Lines Game State
  const [s2Lasers, setS2Lasers] = useState<Array<{
    id: string;
    addr: string;
    targetBlock: string;
    cut: boolean;
  }>>([]);
  const [freezeActive, setFreezeActive] = useState<boolean>(false);
  const [freezeUsed, setFreezeUsed] = useState<boolean>(false);

  // Station 3: Conveyor Boxes Game State
  const [s3Boxes, setS3Boxes] = useState<Array<{
    id: string;
    label: string;
    content: string;
    isTypeConfusion: boolean;
  }>>([]);

  // Station 4: The Bet & Squad Battle
  const [betStake, setBetStake] = useState<number>(100);
  const [selectedBet, setSelectedBet] = useState<string | null>(null);
  const [betSubmitted, setBetSubmitted] = useState<boolean>(false);

  const squadMeta = SQUADS[agent.squad];
  const stationMeta = STATIONS[eventState.currentStation];
  const isAlert = eventState.status === 'INCIDENT_ACTIVE' && eventState.activeAlarm;

  // Haptic Feedback helper
  const triggerHaptic = (ms: number = 50) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  // Squad counts for lobby
  const squadCounts = {
    sentinels: allAgents.filter((a) => a.squad === 'sentinels').length,
    neural: allAgents.filter((a) => a.squad === 'neural').length,
    vault: allAgents.filter((a) => a.squad === 'vault').length
  };

  // Station 1 Loop (Requests raining down)
  useEffect(() => {
    if (eventState.currentStation !== 1 || eventState.subphase !== 'FIX') {
      setS1Requests([]);
      setBossActive(false);
      return;
    }

    const timer = setInterval(() => {
      const isSuspicious = Math.random() > 0.45;
      const suspiciousTexts = [
        'POST /upload (multipart 128MB)',
        'GET /index.php 500 (OOM Fatal)',
        'Cookie: PHPSESSID=7f3a... > 4KB',
        'POST /avatar (upload_progress leak)'
      ];
      const cleanTexts = [
        'GET /static/style.css 200',
        'GET /api/v1/user 200',
        'POST /login 200 (Clean)',
        'GET /favicon.ico 200'
      ];

      setS1Requests((prev) => {
        const text = isSuspicious 
          ? suspiciousTexts[Math.floor(Math.random() * suspiciousTexts.length)]
          : cleanTexts[Math.floor(Math.random() * cleanTexts.length)];

        return [...prev.slice(-4), { id: `req_${Date.now()}_${Math.random()}`, text, isSuspicious }];
      });

      if (eventState.subphaseTimeRemaining <= 10 && !bossActive) {
        setBossActive(true);
      }
    }, 1300);

    return () => clearInterval(timer);
  }, [eventState.currentStation, eventState.subphase, eventState.subphaseTimeRemaining]);

  const handleSliceRequest = (reqId: string, isSuspicious: boolean) => {
    setS1Requests((prev) => prev.filter((r) => r.id !== reqId));
    triggerHaptic(40);

    if (isSuspicious) {
      audio.playUnlockClick();
      const newCombo = Math.min(5, (agent.combo || 1) + 1);
      const pts = 25 * (newCombo >= 5 ? 5 : newCombo >= 3 ? 3 : newCombo >= 2 ? 2 : 1);
      onUpdateCombo(newCombo);
      onUpdateScore(pts, 'اعتراض طلب multipart مشبوه');
    } else {
      audio.playGlitch();
      onUpdateCombo(1);
      onUpdateScore(-15, 'خطأ: اعتراض طلب بريء!');
    }
  };

  const handleTapBoss = () => {
    triggerHaptic(60);
    audio.playUnlockClick();
    if (bossHp > 1) {
      setBossHp((h) => h - 1);
    } else {
      setBossActive(false);
      audio.playSuccessChime();
      onUpdateScore(100, 'تدمير الكوكيز الضخم PHPSESSID Boss!');
    }
  };

  // Station 2 Loop
  useEffect(() => {
    if (eventState.currentStation !== 2 || eventState.subphase !== 'FIX') {
      setS2Lasers([]);
      return;
    }

    const interval = setInterval(() => {
      if (freezeActive) return;
      const addrs = ['0x7f3a', '0x9c1e', '0xd4a8', '0x10c3'];
      const blocks = ['FREED #05', 'FREED #07', 'FREED #02'];

      setS2Lasers((prev) => [
        ...prev.slice(-3),
        {
          id: `laser_${Date.now()}_${Math.random()}`,
          addr: addrs[Math.floor(Math.random() * addrs.length)],
          targetBlock: blocks[Math.floor(Math.random() * blocks.length)],
          cut: false
        }
      ]);
    }, 1500);

    return () => clearInterval(interval);
  }, [eventState.currentStation, eventState.subphase, freezeActive]);

  const handleCutLaser = (id: string) => {
    setS2Lasers((prev) => prev.map((l) => (l.id === id ? { ...l, cut: true } : l)));
    triggerHaptic(50);
    audio.playUnlockClick();

    const newCombo = Math.min(5, (agent.combo || 1) + 1);
    const pts = 30 * (newCombo >= 5 ? 5 : newCombo >= 3 ? 3 : newCombo >= 2 ? 2 : 1);
    onUpdateCombo(newCombo);
    onUpdateScore(pts, 'قطع مؤشر معلق (Dangling Pointer)');
  };

  const handleActivateFreeze = () => {
    if (freezeUsed) return;
    setFreezeUsed(true);
    setFreezeActive(true);
    audio.playUnlockClick();
    triggerHaptic(100);

    setTimeout(() => {
      setFreezeActive(false);
    }, 3000);
  };

  // Station 3 Loop
  useEffect(() => {
    if (eventState.currentStation !== 3 || eventState.subphase !== 'FIX') {
      setS3Boxes([]);
      return;
    }

    const interval = setInterval(() => {
      const items = [
        { label: 'PAPERS (وثائق)', content: '📄 ملف نصي عادي', isConfusion: false },
        { label: 'SCRIPT (برمجي)', content: '📜 كود نظيف', isConfusion: false },
        { label: 'PAPERS (وثائق)', content: '🗡️ أداة حادة (Exploit)', isConfusion: true },
        { label: 'IMAGE (صورة)', content: '💣 تنفيذ أوامر (Shell)', isConfusion: true }
      ];

      const item = items[Math.floor(Math.random() * items.length)];
      setS3Boxes((prev) => [
        ...prev.slice(-3),
        {
          id: `box_${Date.now()}_${Math.random()}`,
          label: item.label,
          content: item.content,
          isTypeConfusion: item.isConfusion
        }
      ]);
    }, 1600);

    return () => clearInterval(interval);
  }, [eventState.currentStation, eventState.subphase]);

  const handleTapBox = (boxId: string, isTypeConfusion: boolean) => {
    setS3Boxes((prev) => prev.filter((b) => b.id !== boxId));
    triggerHaptic(40);

    if (isTypeConfusion) {
      audio.playUnlockClick();
      const newCombo = Math.min(5, (agent.combo || 1) + 1);
      const pts = 35 * (newCombo >= 5 ? 5 : newCombo >= 3 ? 2 : 1);
      onUpdateCombo(newCombo);
      onUpdateScore(pts, 'كشف ارتباك أنواع في OPcache');
    } else {
      audio.playGlitch();
      onUpdateCombo(1);
      onUpdateScore(-20, 'خطأ: رفض كائن مطابق وسليم!');
    }
  };

  // Station 4 Handlers
  const handleSubmitBet = (optionId: string) => {
    if (betSubmitted) return;
    setSelectedBet(optionId);
    setBetSubmitted(true);
    triggerHaptic(60);
    audio.playUnlockClick();
    onBetSubmitted(optionId, betStake);

    const isCorrect = optionId === 'opt-a';
    if (isCorrect) {
      audio.playSuccessChime();
      onUpdateScore(betStake, 'رهان صحيح: ترقية نواة PHP وإعادة تشغيل الخدمات!');
    } else {
      audio.playGlitch();
      onUpdateScore(-betStake, 'رهان خاطئ: الخلل في لغة PHP وليس الإضافات!');
    }
  };

  const handleNodeAction = (nodeId: string, currentStatus: string) => {
    triggerHaptic(40);
    audio.playUnlockClick();

    let nextStatus: 'patched' | 'restarted' | 'verified' = 'patched';
    let pts = 20;

    if (currentStatus === 'vulnerable') {
      nextStatus = 'patched';
      pts = 25;
    } else if (currentStatus === 'patched') {
      nextStatus = 'restarted';
      pts = 30;
    } else if (currentStatus === 'restarted') {
      nextStatus = 'verified';
      pts = 45;
    } else {
      return;
    }

    onSquadNodeAction(agent.squad, nodeId, nextStatus);
    onUpdateScore(pts, `تأمين عقدة في كتيبة ${squadMeta.name}`);
  };

  // Door Code Handler
  const handleDoorCodeDigit = (digit: string) => {
    if (doorCodeInput.length < 4) {
      triggerHaptic(30);
      audio.playUnlockClick();
      const updated = doorCodeInput + digit;
      setDoorCodeInput(updated);

      if (updated.length === 4) {
        if (updated === eventState.doorCode) {
          setDoorCodeSuccess(true);
          setDoorCodeError(false);
          audio.playSuccessChime();
          onUpdateScore(50, 'فك شفرة الباب الأمني بنجاح!');
          onDoorCodeUnlocked();
          setTimeout(() => {
            setDoorCodeSuccess(false);
            setDoorCodeInput('');
          }, 2000);
        } else {
          setDoorCodeError(true);
          audio.playGlitch();
          setTimeout(() => {
            setDoorCodeError(false);
            setDoorCodeInput('');
          }, 1000);
        }
      }
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-between p-3 bg-[#03060f] relative overflow-x-hidden font-cairo ${isAlert ? 'alarm-vignette' : ''}`}>
      
      {/* Centered Phone Column: max-w-[420px] */}
      <div className="w-full max-w-[420px] flex-1 flex flex-col justify-between z-10">

        {/* 1. TOP MINI STATUS BAR (One compact row without clipping) */}
        <header className="w-full rounded-2xl bg-[#070e24]/95 border border-[#4285F4]/30 p-2.5 shadow-[0_0_20px_rgba(66,133,244,0.15)] shrink-0">
          <div className="flex items-center justify-between gap-2">
            
            {/* Left: Agent Identity & Squad Badge */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: squadMeta.color }} />
              <div className="text-right truncate">
                <span className="font-bold text-xs text-white block truncate leading-tight">
                  {agent.displayName}
                </span>
                <span className="text-[10px] font-mono" style={{ color: squadMeta.color }}>
                  <bdi dir="ltr">{squadMeta.name} · {squadMeta.track}</bdi>
                </span>
              </div>
            </div>

            {/* Right: Score, Combo & Health */}
            <div className="flex items-center gap-3 shrink-0">
              {agent.combo > 1 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#EA4335]/20 border border-[#EA4335] text-[#EA4335] font-black font-mono text-[11px] animate-pulse">
                  x{agent.combo}
                </span>
              )}

              <div className="text-left font-mono leading-none">
                <div className="text-sm font-black text-white">{agent.score}</div>
                <div className="text-[9px] text-slate-400">PTS</div>
              </div>

              {/* Server Health Mini Meter */}
              <div className="flex flex-col items-end gap-1 w-16">
                <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400">
                  <Heart size={10} className={eventState.sharedServerHealth < 30 ? 'text-red-500 animate-ping' : 'text-emerald-400'} />
                  <span>{eventState.sharedServerHealth}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      eventState.sharedServerHealth > 50
                        ? 'bg-[#34A853]'
                        : eventState.sharedServerHealth > 25
                        ? 'bg-[#FBBC05]'
                        : 'bg-[#EA4335]'
                    }`}
                    style={{ width: `${Math.max(0, eventState.sharedServerHealth)}%` }}
                  />
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* 2. DYNAMIC MAIN STAGE CONTENT */}
        <main className="w-full flex-1 flex flex-col justify-center my-3 min-h-0">

          {/* STAGE 0: LOBBY ("ALL SYSTEMS NOMINAL") */}
          {eventState.currentStation === 0 && (
            <div className="space-y-3.5 text-center my-auto py-2">
              <div className="w-16 h-16 rounded-full bg-blue-950/40 border border-[#4285F4]/40 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(66,133,244,0.3)]">
                <Shield size={32} className="text-[#4285F4] animate-pulse" />
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                  <CheckCircle2 size={13} />
                  <span>ALL SYSTEMS NOMINAL</span>
                </div>
                <h2 className="text-lg font-black text-white">غرفة الانتظار العملياتية</h2>
                <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                  أهلاً بك أيها العميل. الحادث الأمني سيبدأ فور إعطاء إشارة الانطلاق من شاشة المضيف.
                </p>
              </div>

              {/* 3 Squad Pills Live Agent Count */}
              <div className="grid grid-cols-3 gap-2">
                {(['sentinels', 'neural', 'vault'] as Squad[]).map((sq) => {
                  const meta = SQUADS[sq];
                  const count = squadCounts[sq];

                  return (
                    <div
                      key={sq}
                      className="p-2.5 rounded-xl border bg-[#060c1d] flex flex-col items-center justify-center gap-1"
                      style={{ borderColor: `${meta.color}50` }}
                    >
                      <span className="text-base">{meta.badge}</span>
                      <span className="font-mono text-[11px] font-bold text-white">
                        <bdi dir="ltr">{meta.name}</bdi>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 border border-slate-800 text-slate-300">
                        <bdi dir="ltr">{count} عملاء</bdi>
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* PHP Educational Explanation Card */}
              <div className="p-3.5 rounded-xl bg-[#070e24]/80 border border-slate-800 text-right space-y-1.5">
                <span className="text-[11px] font-mono text-[#4285F4] font-bold block">
                  كيف تعمل لغة PHP ولماذا يهمنا الأمر؟
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  خادم الويب يستلم طلب المتصفح ويمرره لمحرك PHP ليحجز ذاكرة الـ Heap ويستعلم من قاعدة البيانات ويعيد كود HTML.
                </p>
                <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded-lg border border-amber-500/30 leading-snug">
                  حوالي 70% من مواقع الويب تعمل بلغة PHP. ثغرات PHP2Shell تقع في محرك اللغة نفسه أسفل كود المواقع!
                </div>
              </div>
            </div>
          )}

          {/* INTER-STATION: ROTATING DOOR CODE SCREEN */}
          {eventState.subphase === 'DOOR_CODE' && (
            <div className="cyber-panel p-4 border-[#FBBC05]/50 bg-[#070e24]/95 text-center space-y-3.5 my-auto">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono">
                <Lock size={13} />
                <span>SECURITY AIRLOCK • DOOR CODE</span>
              </div>

              <h3 className="text-base font-bold text-white">أدخل رمز الباب الأمني</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                انظر إلى شاشة العرض الرئيسية وأدخل الرمز المكون من 4 أرقام لفتح المحطة التالية.
              </p>

              {/* Display digits */}
              <div className="flex items-center justify-center gap-2 font-mono dir-ltr">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-12 h-14 rounded-xl border flex items-center justify-center text-2xl font-black transition-all ${
                      doorCodeSuccess
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400 shadow-[0_0_15px_#34A853]'
                        : doorCodeError
                        ? 'border-red-500 bg-red-950/40 text-red-400 animate-shake'
                        : 'border-slate-700 bg-slate-900/80 text-white'
                    }`}
                  >
                    {doorCodeInput[idx] || '_'}
                  </div>
                ))}
              </div>

              {/* 0-9 Keypad with min 48px touch targets */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1 font-mono">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'مسح', '0', 'تأكيد'].map((btn) => (
                  <button
                    key={btn}
                    onClick={() => {
                      if (btn === 'مسح') setDoorCodeInput('');
                      else if (btn === 'تأكيد') {
                        if (doorCodeInput.length === 4) handleDoorCodeDigit('');
                      } else {
                        handleDoorCodeDigit(btn);
                      }
                    }}
                    className="min-h-[48px] rounded-xl bg-slate-900/90 border border-slate-800 text-white font-bold text-lg active:scale-95 hover:bg-slate-800 transition cursor-pointer"
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STATION 1 TASK: THE REQUEST (CVE-2026-109618) */}
          {eventState.currentStation === 1 && eventState.subphase === 'FIX' && (
            <div className="flex-1 flex flex-col justify-between py-1 space-y-2">
              <div className="text-center space-y-0.5 shrink-0">
                <span className="text-[11px] font-mono text-[#EA4335] font-bold">
                  <bdi dir="ltr">CVE-2026-109618 • OOM &amp; PHPSESSID LEAK</bdi>
                </span>
                <h3 className="text-xs font-bold text-white">
                  المس الطلبات المشبوهة فقط قبل وصولها لذاكرة الـ Heap!
                </h3>
              </div>

              {/* Falling Requests Container */}
              <div className="flex-1 rounded-2xl bg-[#02050f] border border-slate-800 p-2.5 flex flex-col justify-end gap-2 min-h-[280px]">
                {bossActive ? (
                  <div className="m-auto text-center space-y-2.5 p-4 rounded-2xl bg-red-950/60 border-2 border-[#EA4335] shadow-[0_0_30px_rgba(234,67,53,0.4)]">
                    <div className="text-xs font-mono text-red-300 font-bold animate-pulse">
                      ⚠️ CRITICAL BOSS: OVERSIZED PHPSESSID
                    </div>
                    <div className="font-mono text-xs text-slate-300 break-all p-2 rounded bg-black/60 border border-red-900">
                      PHPSESSID=7f3a9c1e5b02d4a87e6f10c3b9a2... (4096 BYTES)
                    </div>
                    <button
                      onClick={handleTapBoss}
                      className="w-full min-h-[48px] rounded-xl bg-[#EA4335] text-white font-black text-sm active:scale-95 shadow-[0_0_20px_#EA4335] transition cursor-pointer"
                    >
                      انقر لتكسير الكوكيز المسرب! (متبقي {bossHp} نقرات)
                    </button>
                  </div>
                ) : (
                  s1Requests.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => handleSliceRequest(req.id, req.isSuspicious)}
                      className={`w-full min-h-[48px] p-2.5 rounded-xl border text-right font-mono text-xs flex items-center justify-between active:scale-95 transition cursor-pointer ${
                        req.isSuspicious
                          ? 'border-red-500/80 bg-red-950/40 text-red-200 shadow-[0_0_12px_rgba(234,67,53,0.2)]'
                          : 'border-slate-700 bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/50 border border-slate-700 font-cairo">
                        {req.isSuspicious ? 'مشبوه ⚠️' : 'سليم ✅'}
                      </span>
                      <span className="truncate ml-2"><bdi dir="ltr">{req.text}</bdi></span>
                    </button>
                  ))
                )}

                {s1Requests.length === 0 && !bossActive && (
                  <div className="text-center py-12 text-slate-500 text-xs font-mono">
                    جاري رصد تدفق طلبات الـ HTTP...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATION 2 TASK: THE MEMORY (USE-AFTER-FREE) */}
          {eventState.currentStation === 2 && eventState.subphase === 'FIX' && (
            <div className="flex-1 flex flex-col justify-between py-1 space-y-2">
              <div className="text-center space-y-0.5 shrink-0">
                <span className="text-[11px] font-mono text-[#4285F4] font-bold">
                  <bdi dir="ltr">CVE-2026-109619 • USE-AFTER-FREE (UAF)</bdi>
                </span>
                <h3 className="text-xs font-bold text-white">
                  اقطع خيوط الليزر (المؤشرات المعلقة) قبل أن يعيد طلب جديد حجز الكتلة!
                </h3>
              </div>

              <div className="flex-1 rounded-2xl bg-[#02050f] border border-slate-800 p-2.5 flex flex-col justify-center gap-2.5 min-h-[280px]">
                {s2Lasers.map((laser) => (
                  <div
                    key={laser.id}
                    className={`p-3 rounded-xl border transition-all ${
                      laser.cut
                        ? 'border-emerald-500/50 bg-emerald-950/30 opacity-60'
                        : 'border-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(234,67,53,0.3)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 text-xs font-mono">
                      <span className="text-slate-400">TARGET: {laser.targetBlock}</span>
                      <span className="text-red-400 font-bold">{laser.addr} (STALE)</span>
                    </div>

                    {laser.cut ? (
                      <div className="text-center text-xs text-emerald-400 font-bold py-1">
                        تم قطع المؤشر وتصفيره بنجاح! ✂️
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCutLaser(laser.id)}
                        className="w-full min-h-[48px] rounded-lg bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold text-xs active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>اقطع المؤشر المعلق فوراً!</span>
                        <Zap size={14} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Freeze Power-up Button */}
                <button
                  onClick={handleActivateFreeze}
                  disabled={freezeUsed}
                  className={`w-full min-h-[48px] rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    freezeUsed
                      ? 'border-slate-800 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                      : 'border-cyan-500 bg-cyan-950/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95'
                  }`}
                >
                  <Snowflake size={16} />
                  <span>{freezeUsed ? 'تم استخدام التجميد' : 'تفعيل تجميد الوقت (3 ثوانٍ) ❄️'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STATION 3 TASK: OPCACHE TYPE CONFUSION */}
          {eventState.currentStation === 3 && eventState.subphase === 'FIX' && (
            <div className="flex-1 flex flex-col justify-between py-1 space-y-2">
              <div className="text-center space-y-0.5 shrink-0">
                <span className="text-[11px] font-mono text-[#FBBC05] font-bold">
                  <bdi dir="ltr">CVE-2026-109619 • OPCACHE TYPE CONFUSION</bdi>
                </span>
                <h3 className="text-xs font-bold text-white">
                  انقر على الصناديق التي تختلف محتوياتها عن الملصق!
                </h3>
              </div>

              <div className="flex-1 rounded-2xl bg-[#02050f] border border-slate-800 p-2.5 space-y-2 flex flex-col justify-center min-h-[280px]">
                {s3Boxes.map((box) => (
                  <div
                    key={box.id}
                    onClick={() => handleTapBox(box.id, box.isTypeConfusion)}
                    className={`min-h-[52px] p-3 rounded-xl border flex items-center justify-between cursor-pointer active:scale-95 transition ${
                      box.isTypeConfusion
                        ? 'border-amber-500 bg-amber-950/40 shadow-[0_0_15px_rgba(251,188,5,0.2)]'
                        : 'border-slate-700 bg-slate-900/70'
                    }`}
                  >
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">المحتوى:</span>
                      <span className="text-xs font-bold text-white">{box.content}</span>
                    </div>

                    <div className="text-left font-mono">
                      <span className="text-[10px] text-slate-400 block">الملصق:</span>
                      <span className="text-xs text-amber-300 font-bold">{box.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STATION 4 TASK: THE FIX (THE BET & SQUAD BATTLE) */}
          {eventState.currentStation === 4 && eventState.subphase === 'FIX' && (
            <div className="flex-1 flex flex-col justify-between py-1 space-y-2">
              {!betSubmitted ? (
                <div className="space-y-3">
                  <div className="text-center space-y-0.5">
                    <span className="text-xs font-mono text-[#34A853] font-bold">THE BET • الرهان الأمني</span>
                    <h3 className="text-xs font-bold text-white leading-relaxed">
                      أين يكمن الحل الجذري لإيقاف استغلال ثغرات PHP2Shell؟
                    </h3>
                  </div>

                  {/* Stake Selector */}
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs text-slate-400">قيمة الرهان:</span>
                    {[100, 200, 300].map((val) => (
                      <button
                        key={val}
                        onClick={() => setBetStake(val)}
                        className={`min-h-[36px] px-3 py-1 rounded-lg font-mono text-xs font-bold transition cursor-pointer ${
                          betStake === val
                            ? 'bg-[#4285F4] text-white shadow-[0_0_10px_#4285F4]'
                            : 'bg-slate-900 border border-slate-700 text-slate-400'
                        }`}
                      >
                        {val} PTS
                      </button>
                    ))}
                  </div>

                  {/* Bet Options */}
                  <div className="space-y-2">
                    {THE_BET_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleSubmitBet(opt.id)}
                        className="w-full min-h-[48px] p-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-right active:scale-95 hover:border-[#4285F4] transition space-y-0.5 cursor-pointer"
                      >
                        <div className="text-xs font-bold text-white">{opt.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono"><bdi dir="ltr">{opt.subtitle}</bdi></div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Phase 2: SQUAD BATTLE */
                <div className="space-y-2.5">
                  <div className="text-center space-y-0.5">
                    <span className="text-xs font-mono text-[#4285F4] font-bold">
                      SQUAD BATTLE • خوادم كتيبة {squadMeta.name}
                    </span>
                    <p className="text-xs text-slate-300">
                      انقر على عقد خوادم كتيبتك لتطبيق الترقيع وإعادة التشغيل فوراً!
                    </p>
                  </div>

                  <div className="space-y-2">
                    {eventState.squadBattle[agent.squad]?.map((node) => (
                      <div
                        key={node.id}
                        className="min-h-[48px] p-2.5 rounded-xl border border-slate-800 bg-[#02050e] flex items-center justify-between"
                      >
                        <button
                          onClick={() => handleNodeAction(node.id, node.status)}
                          disabled={node.status === 'verified'}
                          className={`min-h-[38px] px-3 py-1 rounded-lg text-xs font-mono font-bold transition active:scale-95 cursor-pointer ${
                            node.status === 'vulnerable'
                              ? 'bg-red-950 border border-red-500 text-red-300'
                              : node.status === 'patched'
                              ? 'bg-amber-950 border border-amber-500 text-amber-300'
                              : node.status === 'restarted'
                              ? 'bg-blue-950 border border-blue-500 text-blue-300'
                              : 'bg-emerald-950 border border-emerald-500 text-emerald-300 cursor-default'
                          }`}
                        >
                          {node.status === 'vulnerable'
                            ? 'ترقيع (Patch)'
                            : node.status === 'patched'
                            ? 'إعادة تشغيل (Restart)'
                            : node.status === 'restarted'
                            ? 'تحقق (Verify)'
                            : 'مؤمن بالكامل ✅'}
                        </button>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-white block">{node.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{node.version}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>

        {/* 3. FOOTER TAKEAWAY BANNER (Clean, no broken letter-spacing) */}
        {stationMeta?.takeawaySentence && (
          <footer className="w-full p-2.5 rounded-xl bg-[#070e24]/90 border border-slate-800 text-center text-xs text-slate-300 shrink-0">
            <span className="text-[10px] text-[#4285F4] font-mono font-bold ml-1">خلاصة:</span>
            <span>{stationMeta.takeawaySentence}</span>
          </footer>
        )}

      </div>

    </div>
  );
};
