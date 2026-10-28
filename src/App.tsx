import React, { useState, useEffect, useRef } from 'react';
import { Agent, EventState, KillFeedItem, Squad } from './types/game';
import { GameService, INITIAL_EVENT_STATE } from './services/firebase';
import { 
  initAudio, 
  setMuted, 
  isMuted, 
  sfx, 
  startHum, 
  stopHum, 
  startSiren, 
  stopSiren, 
  startHeartbeat, 
  stopHeartbeat, 
  stopAll 
} from './services/audioService';
import { deriveTimelineState, TimelineState } from './services/timelineService';
import { HostScreen } from './components/HostScreen';
import { AgentJoinView } from './components/AgentJoinView';
import { AgentPhoneView } from './components/AgentPhoneView';
import { ArcadeGameplayView } from './components/ArcadeGameplayView';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { CaseFileIntro } from './components/CaseFileIntro';

export function App() {
  const [eventState, setEventState] = useState<EventState>(INITIAL_EVENT_STATE);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('overload503_agent');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return null;
  });

  // URL query params
  const [urlParams] = useState(() => {
    if (typeof window !== 'undefined') return new URLSearchParams(window.location.search);
    return new URLSearchParams();
  });

  const [viewMode, setViewMode] = useState<'agent' | 'host'>(() => {
    const p = urlParams.get('screen') || urlParams.get('view');
    return p === 'host' ? 'host' : 'agent';
  });

  // Gameplay Mode: 'arcade' (visual, interactive, mini-games) vs 'terminal' (pure Linux hacker shell)
  const [gameplayMode, setGameplayMode] = useState<'arcade' | 'terminal'>('arcade');
  const [showBriefingModal, setShowBriefingModal] = useState<boolean>(false);

  const timeScale = Number(urlParams.get('timeScale') || urlParams.get('speed') || 1);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(isMuted());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string>('');

  // Clock state
  const [now, setNow] = useState<number>(Date.now());
  const lastPhaseRef = useRef<string | null>(null);

  // 1. Initial Cloud Sync Subscription
  useEffect(() => {
    const unsubAgents = GameService.subscribeToAgents((list) => {
      setAgents(list);
    });

    const unsubEvent = GameService.subscribeToEvent((state) => {
      setEventState(state);
    });

    return () => {
      unsubAgents();
      unsubEvent();
    };
  }, []);

  // 2. High frequency timer to drive timeline
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Calculate elapsed time from roundStartAt
  const elapsedSec = eventState.roundStartAt 
    ? ((now - eventState.roundStartAt) / 1000) * timeScale
    : -45; // in lobby by default

  const timeline: TimelineState = deriveTimelineState(elapsedSec, eventState.sharedServerHealth);

  // 3. Audio Triggers on Phase Transition
  useEffect(() => {
    if (lastPhaseRef.current === timeline.phase) return;
    lastPhaseRef.current = timeline.phase;

    if (timeline.phase === 'LOBBY') {
      startHum();
    } else if (timeline.phase === 'BREACH') {
      stopHum();
      sfx.glitch();
      startSiren();
    } else if (timeline.phase === 'SECURED') {
      stopAll();
      sfx.chime();
      startHum();
    }
  }, [timeline.phase]);

  // Handle Agent Registration
  const handleRegister = async (displayName: string, squad: Squad) => {
    setIsSubmitting(true);
    setRegisterError('');
    initAudio();
    sfx.unlock();

    const newAgent: Agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      normalizedName: displayName.toLowerCase().trim(),
      displayName: displayName.trim(),
      squad,
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

    try {
      await GameService.registerAgent(newAgent);
      setCurrentAgent(newAgent);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('overload503_agent', JSON.stringify(newAgent));
      }

      // If this is the first agent joining or previous round has ended, start fresh lobby countdown
      const isPastRound = eventState.roundStartAt && (Date.now() - eventState.roundStartAt > 260000);
      if (!eventState.roundStartAt || isPastRound || eventState.status === 'CONCLUDED') {
        const roundStart = Date.now() + 45000; // 45 seconds lobby
        GameService.startLobbyCountdown(roundStart);
      }
    } catch (err: any) {
      setRegisterError(err.message || 'فشل التسجيل، يرجى اختيار اسم آخر.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Score Updates
  const handleUpdateScore = (points: number, reason: string) => {
    if (!currentAgent) return;
    const nextScore = Math.max(0, currentAgent.score + points);
    const updated = { ...currentAgent, score: nextScore, lastActive: Date.now() };
    setCurrentAgent(updated);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('overload503_agent', JSON.stringify(updated));
    }
    GameService.updateAgent(currentAgent.id, { score: nextScore, lastActive: Date.now() });

    // Broadcast kill feed item
    GameService.postKillFeedItem({
      agentName: currentAgent.displayName,
      squad: currentAgent.squad,
      action: reason,
      points
    });
  };

  // Host Controls
  const handleStartNow = () => {
    initAudio();
    sfx.unlock();
    GameService.startIncidentNow();
  };

  const handlePauseResume = () => {
    sfx.keyClick();
    GameService.togglePause();
  };

  const handleSkipPhase = () => {
    sfx.whoosh();
    GameService.skipToNextPhase();
  };

  const handleEndGame = () => {
    sfx.chime();
    GameService.endGameNow();
  };

  const handleResetAgent = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('overload503_agent');
    }
    setCurrentAgent(null);
  };

  return (
    <div className="relative w-full min-h-screen bg-[#04070f] text-[#e8eefc] overflow-hidden">
      
      {/* Mission Instructions Modal */}
      <MissionBriefingModal
        isOpen={showBriefingModal}
        onClose={() => setShowBriefingModal(false)}
        onStartPlaying={() => {
          setShowBriefingModal(false);
          if (timeline.phase === 'LOBBY') {
            handleStartNow();
          }
        }}
      />

      {/* View Switcher Floating Badge (For events & pairing testing) */}
      <div className="fixed bottom-2 right-2 z-50 flex items-center gap-1.5 p-1 rounded-xl bg-[#070d1f]/95 border border-slate-700 shadow-2xl text-[10px] font-mono">
        <button
          onClick={() => setShowBriefingModal(true)}
          className="px-2.5 py-1 rounded-lg bg-blue-900/60 border border-blue-500/50 text-blue-300 hover:text-white transition cursor-pointer flex items-center gap-1 font-bold"
          title="شاهد تعليمات اللعبة والمهمة"
        >
          📖 <span>التعليمات</span>
        </button>

        <button
          onClick={() => setViewMode('agent')}
          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
            viewMode === 'agent' ? 'bg-[#4285F4] text-white font-bold shadow-[0_0_10px_rgba(66,133,244,0.5)]' : 'text-slate-400 hover:text-white'
          }`}
          title="شاشة اللاعب والتيرمينال (Player Terminal)"
        >
          📱 <span>AGENT VIEW</span>
        </button>
        <button
          onClick={() => setViewMode('host')}
          className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
            viewMode === 'host' ? 'bg-[#4285F4] text-white font-bold shadow-[0_0_10px_rgba(66,133,244,0.5)]' : 'text-slate-400 hover:text-white'
          }`}
          title="شاشة البروجكتر والعرض الرئيسية (Host Screen)"
        >
          🖥️ <span>HOST SCREEN</span>
        </button>

        {currentAgent && viewMode === 'agent' && (
          <button
            onClick={handleResetAgent}
            className="px-2 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition cursor-pointer ml-1"
            title="خروج وتبديل الحساب"
          >
            🔄 خروج
          </button>
        )}
      </div>

      {/* RENDER VIEW ACCORDING TO VIEW MODE */}
      {viewMode === 'host' ? (
        <HostScreen
          timeline={timeline}
          agents={agents}
          killFeed={killFeed}
          sharedHealth={eventState.sharedServerHealth}
          heapMemoryUsage={72}
          isMuted={isAudioMuted}
          onToggleMute={() => {
            const next = !isMuted();
            setMuted(next);
            setIsAudioMuted(next);
          }}
          onStartNow={handleStartNow}
          onPauseResume={handlePauseResume}
          onSkipPhase={handleSkipPhase}
          onEndGame={handleEndGame}
        />
      ) : !currentAgent ? (
        <CaseFileIntro
          onAcceptMission={handleRegister}
          isSubmitting={isSubmitting}
        />
      ) : (timeline.phase === 'LOBBY' || timeline.phase === 'BREACH') ? (
        <HostScreen
          timeline={timeline}
          agents={agents}
          killFeed={killFeed}
          sharedHealth={eventState.sharedServerHealth}
          heapMemoryUsage={72}
          isMuted={isAudioMuted}
          onToggleMute={() => {
            const next = !isMuted();
            setMuted(next);
            setIsAudioMuted(next);
          }}
          onStartNow={handleStartNow}
          onPauseResume={handlePauseResume}
          onSkipPhase={handleSkipPhase}
          onEndGame={handleEndGame}
        />
      ) : gameplayMode === 'arcade' ? (
        <ArcadeGameplayView
          agent={currentAgent}
          timeline={timeline}
          onUpdateScore={handleUpdateScore}
          onDoorCodeUnlocked={() => {
            GameService.updateAgent(currentAgent.id, { doorCodeUnlockedAt: Date.now() });
          }}
          onStartNow={handleStartNow}
          onResetAgent={handleResetAgent}
          onSwitchToTerminal={() => setGameplayMode('terminal')}
        />
      ) : (
        <AgentPhoneView
          agent={currentAgent}
          timeline={timeline}
          onUpdateScore={handleUpdateScore}
          onDoorCodeUnlocked={() => {
            GameService.updateAgent(currentAgent.id, { doorCodeUnlockedAt: Date.now() });
          }}
          onStartNow={handleStartNow}
          onResetAgent={handleResetAgent}
          onSwitchToArcade={() => setGameplayMode('arcade')}
        />
      )}

    </div>
  );
}

export default App;
