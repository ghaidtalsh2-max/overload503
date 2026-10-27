import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Terminal as TerminalIcon, 
  Zap, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Clock, 
  Server,
  Layers,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Agent, EventState, Squad } from './types/game';
import { SQUADS } from './data/gameData';
import { 
  initAudio, 
  setMuted, 
  isMuted, 
  sfx, 
  startSiren, 
  stopSiren, 
  startHeartbeat, 
  stopHeartbeat, 
  startHum, 
  stopHum, 
  stopAll 
} from './services/audioService';
import { GameService } from './services/firebase';
import { InteractiveTerminal } from './components/InteractiveTerminal';
import { MemoryVisualizer } from './components/MemoryVisualizer';
import { StageDecisions } from './components/StageDecisions';
import { LeaderboardView } from './components/LeaderboardView';

const TOTAL_MISSION_SECONDS = 180; // 3 minutes strictly

export const App: React.FC = () => {
  // Game Lifecycle: 'LOBBY' | 'PLAYING' | 'CONCLUDED'
  const [gameState, setGameState] = useState<'LOBBY' | 'PLAYING' | 'CONCLUDED'>('LOBBY');
  
  // Player State
  const [nickname, setNickname] = useState<string>('');
  const [selectedSquad, setSelectedSquad] = useState<Squad>('sentinels');
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [score, setScore] = useState<number>(0);
  const [correctDecisionsCount, setCorrectDecisionsCount] = useState<number>(0);
  const [totalDecisionsCount, setTotalDecisionsCount] = useState<number>(0);
  const [investigationCategories, setInvestigationCategories] = useState<Set<string>>(new Set());

  // Mission State
  const [currentStage, setCurrentStage] = useState<number>(1); // 1, 2, 3, 4
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_MISSION_SECONDS);
  const [missionOutcome, setMissionOutcome] = useState<'SECURED' | 'TIMEOUT'>('TIMEOUT');
  const [pointerCleared, setPointerCleared] = useState<boolean>(false);
  const [patchDeployed, setPatchDeployed] = useState<boolean>(false);

  // Global Leaderboard & Cloud State
  const [agentsList, setAgentsList] = useState<Agent[]>([]);

  // Mobile View Tabs
  const [activeMobileTab, setActiveMobileTab] = useState<'terminal' | 'memory' | 'decisions'>('memory');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // 1. Initial Cloud Sync Subscription
  useEffect(() => {
    const unsub = GameService.subscribeToAgents((list) => {
      setAgentsList(list);
    });
    return () => unsub();
  }, []);

  // 2. Authoritative 180s Mission Countdown
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    startSiren();

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleMissionTimeout();
          return 0;
        }

        // Final 30s tension: start heartbeat
        if (prev === 31) {
          startHeartbeat(110);
        }

        // Warning sound in last 10s
        if (prev <= 10 && prev > 1) {
          sfx.warn();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopSiren();
      stopHeartbeat();
    };
  }, [gameState]);

  // Handle start mission
  const handleStartMission = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nickname.trim() || `Agent_${Math.floor(100 + Math.random() * 900)}`;
    initAudio();
    sfx.unlock();

    const newAgent: Agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      normalizedName: cleanName.toLowerCase(),
      displayName: cleanName,
      squad: selectedSquad,
      score: 0,
      combo: 1,
      highestCombo: 1,
      badges: [],
      stationScores: {
        station1: 0,
        station2: 0,
        station3: 0,
        station4: 0,
      },
      joinedAt: Date.now(),
      lastActive: Date.now()
    };

    setCurrentAgent(newAgent);
    setScore(0);
    setCorrectDecisionsCount(0);
    setTotalDecisionsCount(0);
    setSecondsRemaining(TOTAL_MISSION_SECONDS);
    setCurrentStage(1);
    setPointerCleared(false);
    setPatchDeployed(false);
    setInvestigationCategories(new Set());
    setGameState('PLAYING');

    await GameService.registerAgent(newAgent);
  };

  // Timeout handler
  const handleMissionTimeout = () => {
    stopAll();
    sfx.error();
    setMissionOutcome('TIMEOUT');
    setGameState('CONCLUDED');
    finalizeAgentScore(score, 'TIMEOUT');
  };

  // Finalize & submit score to cloud leaderboard
  const finalizeAgentScore = async (finalScore: number, outcome: 'SECURED' | 'TIMEOUT') => {
    if (!currentAgent) return;
    const timeSpent = TOTAL_MISSION_SECONDS - secondsRemaining;
    const updated: Partial<Agent> = {
      score: Math.max(0, finalScore),
      lastActive: Date.now()
    };
    await GameService.updateAgent(currentAgent.id, updated);
  };

  // Investigation commands score (+10 pts per category, awarded only once)
  const handleInvestigationCommand = (category: string, points: number) => {
    if (investigationCategories.has(category)) return;

    setInvestigationCategories((prev) => new Set([...prev, category]));
    setScore((s) => {
      const next = s + points;
      if (currentAgent) GameService.updateAgent(currentAgent.id, { score: next });
      return next;
    });
  };

  // Stage decision handler (+100 for correct, -20 pts and -10s for incorrect)
  const handleDecisionOutcome = (isCorrect: boolean, pts: number, penaltySec = 0) => {
    setTotalDecisionsCount((c) => c + 1);
    if (isCorrect) {
      setCorrectDecisionsCount((c) => c + 1);
    } else if (penaltySec > 0) {
      setSecondsRemaining((s) => Math.max(5, s - penaltySec));
    }

    setScore((s) => {
      const next = Math.max(0, s + pts);
      if (currentAgent) GameService.updateAgent(currentAgent.id, { score: next });
      return next;
    });
  };

  // Clear pointer interactive action in Stage 2
  const handleClearPointer = () => {
    if (pointerCleared) return;
    setPointerCleared(true);
    setScore((s) => {
      const next = s + 100;
      if (currentAgent) GameService.updateAgent(currentAgent.id, { score: next });
      return next;
    });
    sfx.unlock();
  };

  // Deploy patch in Stage 3
  const handleDeployPatch = () => {
    setPatchDeployed(true);
    setScore((s) => {
      const next = s + 100;
      if (currentAgent) GameService.updateAgent(currentAgent.id, { score: next });
      return next;
    });
  };

  // Advance stage
  const handleAdvanceStage = () => {
    sfx.tick();
    if (currentStage < 4) {
      setCurrentStage((s) => s + 1);
    } else {
      // Completed Stage 4 -> VICTORY!
      stopAll();
      sfx.chime();
      startHum();
      const timeBonus = Math.floor(secondsRemaining * 1.5);
      const finalScore = score + 150 + timeBonus;
      setScore(finalScore);
      setMissionOutcome('SECURED');
      setGameState('CONCLUDED');
      finalizeAgentScore(finalScore, 'SECURED');
    }
  };

  // Play Again handler
  const handlePlayAgain = () => {
    stopAll();
    sfx.keyClick();
    setGameState('LOBBY');
  };

  // Audio mute toggle
  const handleToggleMute = () => {
    const next = !isMuted();
    setMuted(next);
    setIsAudioMuted(next);
  };

  // Format time mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Threat level calculation based on time remaining
  const threatLevel = secondsRemaining <= 30 ? 5 : secondsRemaining <= 70 ? 4 : secondsRemaining <= 120 ? 3 : 2;

  return (
    <div className={`min-h-screen w-full bg-[#04070f] text-[#e8eefc] flex flex-col font-cairo select-none ${secondsRemaining <= 30 && gameState === 'PLAYING' ? 'vig' : ''}`}>
      
      {/* 1. LOBBY / REGISTRATION SCREEN */}
      {gameState === 'LOBBY' && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 rounded-2xl pn border border-[#4285F4]/40 bg-[#070d1f]/95 shadow-[0_0_35px_rgba(66,133,244,0.2)] text-center space-y-4">
            
            {/* Header Branding */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <svg width="42" height="26" viewBox="0 0 46 28" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3 4 14" stroke="#4285F4" />
                  <path d="M4 14 15 25" stroke="#34A853" />
                  <path d="M31 3 42 14" stroke="#EA4335" />
                  <path d="M42 14 31 25" stroke="#FBBC05" />
                </svg>
                <h1 className="mono font-black text-2xl tracking-wider text-white ltr">503: OVERLOAD</h1>
              </div>
              <p className="text-xs font-mono font-bold text-[#8fa6d6]">
                "180 Seconds. Two Vulnerabilities. One Mission."
              </p>
            </div>

            {/* Incident Alert Brief */}
            <div className="p-3 rounded-xl bg-[#2a0d12]/70 border border-[#EA4335]/60 text-right space-y-1">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#ff8a80]">
                <span>🚨 أزمة تشغيلية طارئة</span>
                <span>PHP 8.3 WORKER OOM</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                تم رصد انهيار مفاجئ في خوادم المعالجة، وخلل في مجمع الذاكرة يهدد باختراق الموقع. مهمتك هي قيادة الاستجابة، التحقيق في السجلات والتيرمينال، واحتواء الثغرات قبل نفاد الـ 180 ثانية!
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleStartMission} className="space-y-3 pt-1 text-right">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  اسم العميل (Callsign):
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="مثال: Tariq_Cyber, Sarah_Sec"
                  className="w-full h-11 px-3 rounded-xl bg-[#040817] border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-[#4285F4]"
                />
              </div>

              {/* Squad Selection */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  اختر كتيبتك / مسارك:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sentinels', 'neural', 'vault'] as Squad[]).map((sq) => {
                    const meta = SQUADS[sq];
                    const isSelected = selectedSquad === sq;
                    return (
                      <button
                        key={sq}
                        type="button"
                        onClick={() => setSelectedSquad(sq)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-[#4285F4] bg-[#0c1a40] text-white shadow-md'
                            : 'border-slate-800 bg-[#060c1d] text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-base">{meta.badge}</span>
                        <span className="font-mono text-[11px] font-bold"><bdi dir="ltr">{meta.name}</bdi></span>
                        <span className="text-[9px] text-slate-400 font-cairo">{meta.track}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <button
                type="submit"
                className="w-full min-h-[48px] rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-red-600 text-white font-black text-sm tracking-wider shadow-[0_0_25px_rgba(234,67,53,0.6)] active:scale-95 hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2 animate-pulse mt-2"
              >
                <Zap size={18} />
                <span>بدء مهمة الاستجابة للحادث (180 ثانية)</span>
              </button>
            </form>

            <div className="text-[11px] text-slate-400 font-mono pt-1">
              Google DGoC | TU · Be Googley
            </div>
          </div>
        </div>
      )}

      {/* 2. PLAYING OPERATIONS ROOM (Desktop & Mobile) */}
      {gameState === 'PLAYING' && (
        <div className="flex-1 flex flex-col gap-2 p-2 sm:p-3 max-w-[1440px] w-full mx-auto">
          
          {/* TOP HUD BAR (Matches Approved Reference) */}
          <header className="pn h-[60px] px-3 sm:px-5 flex items-center justify-between shrink-0 rounded-2xl border border-[#4285F4]/35 bg-[#0a1228]/90">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <svg width="38" height="24" viewBox="0 0 46 28" fill="none" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3 4 14" stroke="#4285F4" />
                <path d="M4 14 15 25" stroke="#34A853" />
                <path d="M31 3 42 14" stroke="#EA4335" />
                <path d="M42 14 31 25" stroke="#FBBC05" />
              </svg>
              <div className="leading-tight">
                <div className="mono font-black text-base sm:text-lg text-white ltr">503: OVERLOAD</div>
                <div className="text-[10px] text-[#8fa6d6] font-bold hidden sm:block">Google DGoC | TU · Incident Response</div>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-2">
              <span className="mono text-[10px] sm:text-xs font-black text-[#ff8a80] tracking-wider hidden sm:inline">OVERLOAD IN</span>
              <span className={`mono font-black text-2xl sm:text-3xl leading-none text-[#EA4335] text-shadow-red ${secondsRemaining <= 30 ? 'pulse' : ''}`}>
                {formatTime(secondsRemaining)}
              </span>
            </div>

            {/* Threat Level + Score + Audio Mute */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Threat Bars */}
              <div className="text-center hidden sm:block">
                <div className="mono text-[9px] text-[#8fa6d6] font-bold tracking-wider">THREAT LEVEL</div>
                <div className="flex gap-1 mt-1">
                  <i className={`w-3.5 h-2 rounded-xs ${threatLevel >= 1 ? 'bg-[#34A853]' : 'bg-slate-800'}`} />
                  <i className={`w-3.5 h-2 rounded-xs ${threatLevel >= 2 ? 'bg-[#FBBC05]' : 'bg-slate-800'}`} />
                  <i className={`w-3.5 h-2 rounded-xs ${threatLevel >= 3 ? 'bg-[#FBBC05]' : 'bg-slate-800'}`} />
                  <i className={`w-3.5 h-2 rounded-xs ${threatLevel >= 4 ? 'bg-[#EA4335]' : 'bg-slate-800'}`} />
                  <i className={`w-3.5 h-2 rounded-xs ${threatLevel >= 5 ? 'bg-[#EA4335] blink' : 'bg-slate-800'}`} />
                </div>
              </div>

              {/* Score Badge */}
              <div className="px-2.5 py-1 rounded-xl bg-[#0b1430] border border-[#2b3a66] mono font-black text-xs sm:text-sm text-white">
                {score} PTS
              </div>

              {/* Audio Toggle */}
              <button
                onClick={handleToggleMute}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                title={isAudioMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
              >
                {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          </header>

          {/* HAZARD ALARM STRIP */}
          <div className="haz h-9 rounded-xl flex items-center justify-center shrink-0">
            <div className="bg-[#150608] px-3 sm:px-5 py-1 rounded-lg flex items-center gap-2 sm:gap-3 font-black text-xs sm:text-sm text-[#ff6b5e] border border-[#EA4335]">
              <AlertTriangle size={15} />
              <span className="mono blink tracking-wider">BREACH ACTIVE</span>
              <span>
                {currentStage === 1 && 'المرحلة 1 · استنزاف الذاكرة وانهيار المعالجة (OOM Fatal)'}
                {currentStage === 2 && 'المرحلة 2 · مؤشر معلّق يشير لذاكرة محرّرة (Use-After-Free)'}
                {currentStage === 3 && 'المرحلة 3 · نشر وترقيع النواة بحزمة الأمان (Patch Lab)'}
                {currentStage === 4 && 'المرحلة 4 · الإغلاق الأمني التام ومطابقة الثغرات (Lockdown)'}
              </span>
              <span className="mono text-[#FBBC05] hidden sm:inline">
                {currentStage === 1 ? 'CVE-2026-109618' : 'CVE-2026-109619'}
              </span>
            </div>
          </div>

          {/* MOBILE NAVIGATION TABS (Visible only on small screens) */}
          <div className="flex sm:hidden items-center gap-1 p-1 rounded-xl bg-[#070e24] border border-slate-800 shrink-0 text-xs font-bold">
            <button
              onClick={() => setActiveMobileTab('memory')}
              className={`flex-1 py-1.5 rounded-lg transition ${activeMobileTab === 'memory' ? 'bg-[#EA4335] text-white shadow' : 'text-slate-400'}`}
            >
              🧠 فحص الذاكرة
            </button>
            <button
              onClick={() => setActiveMobileTab('terminal')}
              className={`flex-1 py-1.5 rounded-lg transition ${activeMobileTab === 'terminal' ? 'bg-[#34A853] text-white shadow' : 'text-slate-400'}`}
            >
              💻 التيرمينال
            </button>
            <button
              onClick={() => setActiveMobileTab('decisions')}
              className={`flex-1 py-1.5 rounded-lg transition ${activeMobileTab === 'decisions' ? 'bg-[#4285F4] text-white shadow' : 'text-slate-400'}`}
            >
              🛡️ القرار الأمني
            </button>
          </div>

          {/* MAIN GRID: DESKTOP 3-COLUMNS / MOBILE TABBED */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
            
            {/* LEFT COLUMN: Mission Stages & Server Rack (Desktop Only: 3 cols) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col gap-2.5">
              
              {/* 4 Station Progress Cards */}
              <div className="pn p-3 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 block pb-1 border-b border-slate-800">
                  INCIDENT TIMELINE
                </span>

                {/* Stage 1 */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${currentStage === 1 ? 'border-[#EA4335] bg-[#2a0d12]/70 pulse' : currentStage > 1 ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-slate-800 opacity-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${currentStage > 1 ? 'bg-emerald-500 text-black' : currentStage === 1 ? 'bg-[#EA4335] text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {currentStage > 1 ? '✓' : '1'}
                  </span>
                  <div>
                    <div className="mono font-bold text-xs">1 · MEMORY VAULT</div>
                    <div className="text-[10px] text-slate-400">OOM Fatal Exhaustion</div>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${currentStage === 2 ? 'border-[#EA4335] bg-[#2a0d12]/70 pulse' : currentStage > 2 ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-slate-800 opacity-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${currentStage > 2 ? 'bg-emerald-500 text-black' : currentStage === 2 ? 'bg-[#EA4335] text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {currentStage > 2 ? '✓' : '2'}
                  </span>
                  <div>
                    <div className="mono font-bold text-xs">2 · DANGLING CORRIDOR</div>
                    <div className="text-[10px] text-slate-400">Use-After-Free Stale Ptr</div>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${currentStage === 3 ? 'border-[#4285F4] bg-[#0c1a40]/70 pulse' : currentStage > 3 ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-slate-800 opacity-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${currentStage > 3 ? 'bg-emerald-500 text-black' : currentStage === 3 ? 'bg-[#4285F4] text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {currentStage > 3 ? '✓' : '3'}
                  </span>
                  <div>
                    <div className="mono font-bold text-xs">3 · PATCH LAB</div>
                    <div className="text-[10px] text-slate-400">Vendor CVE Remediation</div>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${currentStage === 4 ? 'border-[#FBBC05] bg-[#2b2406]/70 pulse' : 'border-slate-800 opacity-50'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${currentStage === 4 ? 'bg-[#FBBC05] text-black' : 'bg-slate-800 text-slate-400'}`}>
                    4
                  </span>
                  <div>
                    <div className="mono font-bold text-xs">4 · FINAL LOCKDOWN</div>
                    <div className="text-[10px] text-slate-400">CVE Classification</div>
                  </div>
                </div>
              </div>

              {/* Server Room Rack */}
              <div className="pn flex-1 p-3 rounded-2xl border border-slate-800 flex flex-col gap-2">
                <span className="mono text-[10px] font-bold text-[#8fa6d6] tracking-wider">SERVER RACK · LIVE</span>
                <div className="flex-1 flex gap-2 justify-center items-stretch ltr">
                  {[1, 2, 3, 4, 5].map((rack) => (
                    <div key={rack} className="w-8 rounded-lg bg-[#0b1430] border border-slate-800 flex justify-center py-2">
                      <div className={`led ${rack === 3 ? 'blink bg-red-500' : rack === 2 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: '5px', borderRadius: '2px' }} />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* CENTER COLUMN: Memory Visualizer & Stage Decisions (Desktop: 5 cols, Mobile: active tab) */}
            <div className={`lg:col-span-5 flex-col gap-3 ${activeMobileTab !== 'terminal' ? 'flex' : 'hidden lg:flex'}`}>
              
              {/* Memory Visualizer (Shown if on memory tab or desktop) */}
              <div className={activeMobileTab === 'decisions' ? 'hidden sm:block' : 'block'}>
                <MemoryVisualizer
                  stage={currentStage}
                  pointerCleared={pointerCleared}
                  onClearPointer={handleClearPointer}
                />
              </div>

              {/* Stage Decisions (Shown if on decisions tab or desktop) */}
              <div className={activeMobileTab === 'memory' ? 'hidden sm:block' : 'block'}>
                <StageDecisions
                  currentStage={currentStage}
                  onDecisionOutcome={handleDecisionOutcome}
                  onAdvanceStage={handleAdvanceStage}
                  patchDeployed={patchDeployed}
                  onDeployPatch={handleDeployPatch}
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Interactive Terminal (Desktop: 4 cols, Mobile: active tab) */}
            <div className={`lg:col-span-4 flex-col min-h-[300px] ${activeMobileTab === 'terminal' ? 'flex' : 'hidden lg:flex'}`}>
              <InteractiveTerminal
                currentStage={currentStage}
                onInvestigationCommand={handleInvestigationCommand}
                patchDeployed={patchDeployed}
                onDeployPatch={handleDeployPatch}
              />
            </div>

          </div>

        </div>
      )}

      {/* 3. CONCLUDED / LEADERBOARD SCREEN */}
      {gameState === 'CONCLUDED' && currentAgent && (
        <div className="flex-1 flex items-center justify-center p-3">
          <LeaderboardView
            agents={agentsList}
            currentAgent={currentAgent}
            missionOutcome={missionOutcome}
            timeElapsed={TOTAL_MISSION_SECONDS - secondsRemaining}
            accuracy={totalDecisionsCount > 0 ? Math.round((correctDecisionsCount / totalDecisionsCount) * 100) : 100}
            onPlayAgain={handlePlayAgain}
          />
        </div>
      )}

    </div>
  );
};

export default App;

