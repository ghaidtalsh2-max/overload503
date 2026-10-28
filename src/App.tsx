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

      // If this is the first agent joining, auto-start the lobby countdown
      if (!eventState.roundStartAt) {
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

  return (
    <div className="relative w-full min-h-screen bg-[#04070f] text-[#e8eefc] overflow-hidden">
      
      {/* View Switcher Floating Badge (For events & pairing testing) */}
      <div className="fixed bottom-2 right-2 z-50 flex items-center gap-1.5 p-1 rounded-xl bg-[#070d1f]/90 border border-slate-700 shadow-lg text-[10px] font-mono">
        <button
          onClick={() => setViewMode('agent')}
          className={`px-2 py-1 rounded-lg transition cursor-pointer ${
            viewMode === 'agent' ? 'bg-[#4285F4] text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          📱 AGENT VIEW
        </button>
        <button
          onClick={() => setViewMode('host')}
          className={`px-2 py-1 rounded-lg transition cursor-pointer ${
            viewMode === 'host' ? 'bg-[#4285F4] text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          🖥️ HOST SCREEN
        </button>
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
        <AgentJoinView
          onRegister={handleRegister}
          agents={agents}
          isSubmitting={isSubmitting}
          errorMessage={registerError}
        />
      ) : (
        <AgentPhoneView
          agent={currentAgent}
          timeline={timeline}
          onUpdateScore={handleUpdateScore}
          onDoorCodeUnlocked={() => {
            GameService.updateAgent(currentAgent.id, { doorCodeUnlockedAt: Date.now() });
          }}
        />
      )}

    </div>
  );
}

export default App;
