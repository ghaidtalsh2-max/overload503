import React, { useState, useEffect, useRef } from 'react';
import { EventState, Agent, KillFeedItem, StationId, Squad, Subphase } from './types/game';
import { GameService, INITIAL_EVENT_STATE, getServerNow } from './services/firebase';
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
import { deriveTimelineState, TOTAL_ROUND_SECONDS, TimelineState } from './services/timelineService';
import { HostScreen } from './components/HostScreen';
import { AgentJoinView } from './components/AgentJoinView';
import { AgentPhoneView } from './components/AgentPhoneView';
import { HallOfDefenders } from './components/HallOfDefenders';

export function App() {
  const [eventState, setEventState] = useState<EventState>(INITIAL_EVENT_STATE);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [killFeed, setKillFeed] = useState<KillFeedItem[]>([]);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  // Read URL query params
  const [urlParams] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  const isHostMode = urlParams.get('screen') === 'host' || urlParams.get('view') === 'host';
  const timeScale = Number(urlParams.get('timeScale') || urlParams.get('speed') || 1);

  const [mutedState, setMutedState] = useState<boolean>(isMuted());
  const [registerSubmitting, setRegisterSubmitting] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string>('');
  const [lobbyRemaining, setLobbyRemaining] = useState<number | null>(null);

  // Audio trigger tracking refs to avoid duplicate fire
  const lastSubphaseRef = useRef<Subphase | null>(null);
  const lastStationRef = useRef<number | null>(null);
  const lastPhaseRef = useRef<string | null>(null);
  const lastLobbySecondBeepRef = useRef<number | null>(null);

  // 1. Initial Subscriptions to Firebase / Local Reactive Bus
  useEffect(() => {
    let savedId = '';
    try {
      savedId = sessionStorage.getItem('ovl2_agent_id') || localStorage.getItem('ovl2_agent_id') || '';
    } catch {}
    if (savedId) {
      setCurrentAgentId(savedId);
    }

    const unsubEvent = GameService.subscribeToEvent((state) => {
      setEventState(state);
    });

    const unsubAgents = GameService.subscribeToAgents((list) => {
      setAgents(list);
    });

    const unsubKillFeed = GameService.subscribeToKillFeed((items) => {
      setKillFeed(items);
    });

    return () => {
      unsubEvent();
      unsubAgents();
      unsubKillFeed();
      stopAll();
    };
  }, []);

  // 2. Authoritative Autopilot & Central Clock Derivation Loop (Runs on Host or Fallback)
  useEffect(() => {
    const effectiveTimeScale = eventState.timeScale && eventState.timeScale > 1 ? eventState.timeScale : timeScale;

    const timer = setInterval(() => {
      const now = getServerNow();

      // CASE A: LOBBY (roundStartAt is null)
      if (!eventState.roundStartAt) {
        if (agents.length >= 1) {
          // If lobby timer hasn't started yet, host client starts it
          let lobbyStart = eventState.lobbyStartAt;
          if (!lobbyStart && isHostMode) {
            lobbyStart = now;
            GameService.updateEventState({ lobbyStartAt: lobbyStart });
          }

          const lobbyDuration = Number(import.meta.env.VITE_LOBBY_SECONDS || 45);
          const elapsedLobby = lobbyStart ? ((now - lobbyStart) / 1000) * effectiveTimeScale : 0;
          const remaining = Math.max(0, Math.ceil(lobbyDuration - elapsedLobby));
          setLobbyRemaining(remaining);

          // T-10s to T-3s: Soft warn beep each second
          if (remaining <= 10 && remaining > 3) {
            if (lastLobbySecondBeepRef.current !== remaining) {
              lastLobbySecondBeepRef.current = remaining;
              sfx.warn();
            }
          }
          // T-3s to T-1s: Glitch burst
          if (remaining <= 3 && remaining > 0) {
            if (lastLobbySecondBeepRef.current !== remaining) {
              lastLobbySecondBeepRef.current = remaining;
              sfx.glitch();
            }
          }

          // T-0s: Automatic breach launch!
          if (remaining === 0 && isHostMode && eventState.autopilot) {
            startSiren();
            GameService.updateEventState({
              roundStartAt: now,
              status: 'INCIDENT_ACTIVE',
              activeAlarm: true,
              threatLevel: 4,
              currentStation: 1
            });
          }
        } else {
          setLobbyRemaining(null);
        }
        return;
      }

      // CASE B: INCIDENT / SECURED (roundStartAt is active)
      let elapsedSec = 0;
      if (eventState.status === 'PAUSED') {
        elapsedSec = eventState.pausedOffsetSec;
      } else {
        const rawElapsed = (now - eventState.roundStartAt) / 1000;
        elapsedSec = (rawElapsed * effectiveTimeScale) + (eventState.pausedOffsetSec || 0);
      }

      const timeline = deriveTimelineState(elapsedSec, eventState.sharedServerHealth);

      // Heartbeat sound in last 10s of any station or if health is critical
      if (timeline.last10SecondsPulse && !eventState.status.includes('PAUSED')) {
        startHeartbeat(100);
      } else {
        stopHeartbeat();
      }

      // Detect milestone changes to fire sound triggers
      if (timeline.phase !== lastPhaseRef.current) {
        if (timeline.phase === 'BREACH') {
          startSiren();
          sfx.glitch();
        } else if (timeline.phase === 'DOOR') {
          sfx.unlock();
        } else if (timeline.phase === 'SECURED') {
          stopSiren();
          stopHeartbeat();
          sfx.chime();
          startHum();
        }
        lastPhaseRef.current = timeline.phase;
      }

      if (timeline.currentStation !== lastStationRef.current) {
        lastStationRef.current = timeline.currentStation;
      }

      if (timeline.subphase !== lastSubphaseRef.current) {
        if (timeline.subphase === 'BREAK') {
          sfx.warn();
        }
        lastSubphaseRef.current = timeline.subphase;
      }

      // Scripted event sounds
      if (timeline.scriptedEvent === 'ATTACK_WAVE') {
        sfx.glitch();
      } else if (timeline.scriptedEvent === 'POWER_FLICKER') {
        sfx.error();
      } else if (timeline.scriptedEvent === 'FREEZE_SPAWN') {
        sfx.powerup();
      }

      // Sync state back if host
      if (isHostMode) {
        const shouldConclude = timeline.phase === 'SECURED' && eventState.status !== 'CONCLUDED';
        
        GameService.updateEventState({
          currentStation: timeline.currentStation,
          subphase: timeline.subphase,
          subphaseTimeRemaining: timeline.stationTimeRemaining,
          totalTimeRemaining: timeline.totalTimeRemaining,
          threatLevel: timeline.threatLevel,
          activeAlarm: timeline.activeAlarm,
          doorCode: timeline.doorCode,
          doorCodeExpiresIn: timeline.doorCodeExpiresIn,
          scriptedEvent: timeline.scriptedEvent,
          status: shouldConclude ? 'CONCLUDED' : eventState.status
        });

        // Auto-loop for event booths (40s after results screen)
        if (eventState.autoLoop && timeline.phase === 'SECURED' && elapsedSec >= TOTAL_ROUND_SECONDS + 40) {
          GameService.resetEvent();
          stopAll();
          startHum();
        }
      }

    }, 250);

    return () => clearInterval(timer);
  }, [isHostMode, eventState.roundStartAt, eventState.lobbyStartAt, eventState.status, eventState.pausedOffsetSec, eventState.autopilot, agents.length, timeScale]);

  // Current logged in agent object
  const currentAgent = agents.find((a) => a.id === currentAgentId);

  // Agent Registration Handler
  const handleRegisterAgent = async (displayName: string, squad: Squad) => {
    initAudio();
    setRegisterSubmitting(true);
    setRegisterError('');

    try {
      const normalized = await GameService.reserveAgentName(displayName);
      const agentId = await GameService.ensureAgentAuth();

      const newAgent: Agent = {
        id: agentId,
        normalizedName: normalized,
        displayName: displayName.trim(),
        squad,
        score: 0,
        combo: 1,
        highestCombo: 1,
        badges: [],
        stationScores: { station1: 0, station2: 0, station3: 0, station4: 0 },
        joinedAt: Date.now(),
        lastActive: Date.now()
      };

      await GameService.registerAgent(newAgent);
      setCurrentAgentId(agentId);
      sfx.unlock();

      // If this is the first agent, trigger lobby countdown
      if (!eventState.lobbyStartAt) {
        GameService.updateEventState({ lobbyStartAt: getServerNow() });
      }

      GameService.publishKillFeedItem({
        agentName: newAgent.displayName,
        squad: newAgent.squad,
        action: 'انضم إلى غرفة العمليات',
        points: 0
      });
    } catch (err: any) {
      setRegisterError(err.message || 'حدث خطأ أثناء التسجيل');
      sfx.error();
    } finally {
      setRegisterSubmitting(false);
    }
  };

  // Agent Score Update
  const handleUpdateScore = (points: number, actionDescription: string) => {
    if (!currentAgent) return;

    const newScore = Math.max(0, Math.min(1000, currentAgent.score + points));
    const newCombo = currentAgent.combo;
    const newHighestCombo = Math.max(currentAgent.highestCombo || 1, newCombo);

    const updatedBadges = [...(currentAgent.badges || [])];
    if (newCombo >= 5 && !updatedBadges.includes('COMBO_BREAKER')) updatedBadges.push('COMBO_BREAKER');
    if (eventState.currentStation === 1 && newScore >= 200 && !updatedBadges.includes('ZERO_LEAK')) updatedBadges.push('ZERO_LEAK');
    if (eventState.currentStation === 2 && newScore >= 400 && !updatedBadges.includes('POINTER_CUTTER')) updatedBadges.push('POINTER_CUTTER');

    GameService.updateAgent(currentAgent.id, {
      score: newScore,
      highestCombo: newHighestCombo,
      badges: updatedBadges
    });

    GameService.publishKillFeedItem({
      agentName: currentAgent.displayName,
      squad: currentAgent.squad,
      action: actionDescription,
      points
    });

    if (points > 0) {
      sfx.tick(newCombo);
      GameService.updateEventState({
        sharedServerHealth: Math.min(100, eventState.sharedServerHealth + 1),
        exposedSitesCount: Math.max(10000, eventState.exposedSitesCount - 850)
      });
    } else if (points < 0) {
      sfx.error();
      GameService.updateEventState({
        sharedServerHealth: Math.max(0, eventState.sharedServerHealth - 3),
        exposedSitesCount: eventState.exposedSitesCount + 2400
      });
    }
  };

  const handleUpdateCombo = (combo: number) => {
    if (!currentAgent) return;
    GameService.updateAgent(currentAgent.id, {
      combo,
      highestCombo: Math.max(currentAgent.highestCombo || 1, combo)
    });
  };

  const handleBetSubmitted = (choiceId: string, stake: number) => {
    if (!currentAgent) return;
    sfx.keyClick();
    const updatedBadges = [...(currentAgent.badges || [])];
    if (choiceId === 'opt-a' && !updatedBadges.includes('PATCH_MASTER')) {
      updatedBadges.push('PATCH_MASTER');
    }

    GameService.updateAgent(currentAgent.id, {
      betChoice: choiceId,
      betStake: stake,
      badges: updatedBadges
    });

    const stats = { ...eventState.betStatistics };
    if (choiceId === 'opt-a') stats.optionA += 1;
    if (choiceId === 'opt-b') stats.optionB += 1;
    if (choiceId === 'opt-c') stats.optionC += 1;
    if (choiceId === 'opt-d') stats.optionD += 1;

    GameService.updateEventState({ betStatistics: stats });
  };

  const handleSquadNodeAction = (squad: Squad, nodeId: string, newStatus: 'patched' | 'restarted' | 'verified') => {
    sfx.keyClick();
    const squadNodes = [...(eventState.squadBattle[squad] || [])];
    const nodeIdx = squadNodes.findIndex((n) => n.id === nodeId);
    if (nodeIdx >= 0) {
      squadNodes[nodeIdx] = { ...squadNodes[nodeIdx], status: newStatus };
      const allVerified = squadNodes.every((n) => n.status === 'verified');
      const winning = allVerified && !eventState.squadBattle.winningSquad ? squad : eventState.squadBattle.winningSquad;

      GameService.updateEventState({
        squadBattle: {
          ...eventState.squadBattle,
          [squad]: squadNodes,
          winningSquad: winning
        }
      });
    }
  };

  const handleDoorCodeUnlocked = () => {
    if (!currentAgent) return;
    sfx.unlock();
    GameService.updateAgent(currentAgent.id, {
      doorCodeUnlockedAt: Date.now(),
      score: currentAgent.score + 50
    });
  };

  // HOST OVERRIDE HANDLERS (Requirement 1 & 6)
  const handleStartNow = () => {
    initAudio();
    startSiren();
    GameService.updateEventState({
      roundStartAt: getServerNow(),
      status: 'INCIDENT_ACTIVE',
      activeAlarm: true,
      threatLevel: 4,
      currentStation: 1,
      pausedAt: null,
      pausedOffsetSec: 0
    });
  };

  const handlePauseResume = () => {
    initAudio();
    sfx.keyClick();
    const now = getServerNow();
    if (eventState.status === 'PAUSED') {
      // Resume: reconstruct roundStartAt from pausedOffsetSec
      const effectiveScale = eventState.timeScale || timeScale || 1;
      const newStartAt = now - (eventState.pausedOffsetSec / effectiveScale * 1000);
      GameService.updateEventState({
        status: 'INCIDENT_ACTIVE',
        roundStartAt: newStartAt,
        pausedAt: null
      });
    } else {
      // Pause
      let currentOffset = eventState.pausedOffsetSec;
      if (eventState.roundStartAt) {
        const effectiveScale = eventState.timeScale || timeScale || 1;
        currentOffset = ((now - eventState.roundStartAt) / 1000) * effectiveScale + eventState.pausedOffsetSec;
      }
      GameService.updateEventState({
        status: 'PAUSED',
        pausedAt: now,
        pausedOffsetSec: currentOffset
      });
    }
  };

  const handleSkipStation = () => {
    initAudio();
    sfx.unlock();
    const now = getServerNow();
    const effectiveScale = eventState.timeScale || timeScale || 1;
    // Station starts: St1=8s, St2=56s, St3=104s, St4=152s, St5=210s
    const milestones = [8, 56, 104, 152, 210];
    let currentElapsed = 0;
    if (eventState.roundStartAt) {
      currentElapsed = ((now - eventState.roundStartAt) / 1000) * effectiveScale + eventState.pausedOffsetSec;
    }
    const nextMilestone = milestones.find((m) => m > currentElapsed + 1) || 210;
    const newStartAt = now - (nextMilestone / effectiveScale * 1000);

    GameService.updateEventState({
      roundStartAt: newStartAt,
      pausedOffsetSec: 0,
      pausedAt: null,
      status: nextMilestone >= 210 ? 'CONCLUDED' : 'INCIDENT_ACTIVE'
    });
  };

  const handleToggleAutopilot = () => {
    sfx.keyClick();
    GameService.updateEventState({ autopilot: !eventState.autopilot });
  };

  const handleTriggerAttackWave = () => {
    sfx.glitch();
    sfx.warn();
    GameService.updateEventState({
      threatLevel: 5,
      sharedServerHealth: Math.max(10, eventState.sharedServerHealth - 20),
      exposedSitesCount: eventState.exposedSitesCount + 85000,
      activeAlarm: true
    });
  };

  const handleTriggerPowerFlicker = () => {
    sfx.glitch();
    GameService.updateEventState({ powerFlicker: true });
    setTimeout(() => {
      GameService.updateEventState({ powerFlicker: false });
    }, 1500);
  };

  const handleEndIncident = () => {
    initAudio();
    stopSiren();
    stopHeartbeat();
    sfx.chime();
    startHum();
    const now = getServerNow();
    const effectiveScale = eventState.timeScale || timeScale || 1;
    GameService.updateEventState({
      roundStartAt: now - (TOTAL_ROUND_SECONDS / effectiveScale * 1000),
      status: 'CONCLUDED',
      currentStation: 5,
      activeAlarm: false
    });
  };

  const handleResetEvent = async () => {
    sfx.keyClick();
    stopAll();
    await GameService.resetEvent();
  };

  const handleToggleRegistration = () => {
    sfx.keyClick();
    GameService.updateEventState({ registrationOpen: !eventState.registrationOpen });
  };

  const handleKickAgent = async (agentId: string) => {
    sfx.error();
    await GameService.deleteAgent(agentId);
  };

  const handleTriggerRandomEvent = () => {
    if (Math.random() > 0.5) {
      handleTriggerAttackWave();
    } else {
      handleTriggerPowerFlicker();
    }
  };

  const handleToggleMute = () => {
    const next = !mutedState;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <div className="min-h-screen bg-[#04070f] text-slate-100 flex flex-col font-cairo">
      
      {/* Discreet LOCAL DEV MODE Switcher (Only visible in agent view for local testing) */}
      {!isHostMode && (
        <div className="fixed bottom-2 left-2 z-50 flex items-center gap-1.5 p-1 rounded-lg bg-black/80 border border-slate-800 text-[10px] font-mono backdrop-blur-md opacity-40 hover:opacity-100 transition-opacity shadow-lg">
          <span className="text-slate-400 px-1 font-bold">LOCAL DEV MODE:</span>
          <button
            onClick={() => {
              window.history.replaceState(null, '', '?screen=host');
              window.location.reload();
            }}
            className="px-2 py-0.5 rounded transition cursor-pointer text-slate-400 hover:text-white"
          >
            HOST SCREEN
          </button>
        </div>
      )}

      {/* VIEWPORT ROUTING */}
      {isHostMode ? (
        eventState.currentStation === 5 || eventState.status === 'CONCLUDED' ? (
          <HallOfDefenders
            agents={agents}
            isHost={true}
            onReset={handleResetEvent}
          />
        ) : (
          <HostScreen
            eventState={eventState}
            agents={agents}
            killFeed={killFeed}
            lobbyRemaining={lobbyRemaining}
            onStartNow={handleStartNow}
            onPauseResume={handlePauseResume}
            onSkipStation={handleSkipStation}
            onToggleAutopilot={handleToggleAutopilot}
            onTriggerAttackWave={handleTriggerAttackWave}
            onTriggerPowerFlicker={handleTriggerPowerFlicker}
            onEndIncident={handleEndIncident}
            onResetEvent={handleResetEvent}
            onToggleRegistration={handleToggleRegistration}
            onKickAgent={handleKickAgent}
            onTriggerRandomEvent={handleTriggerRandomEvent}
            isMuted={mutedState}
            onToggleMute={handleToggleMute}
          />
        )
      ) : (
        !currentAgent ? (
          <AgentJoinView
            onRegister={handleRegisterAgent}
            agents={agents}
            isSubmitting={registerSubmitting}
            errorMessage={registerError}
          />
        ) : eventState.currentStation === 5 || eventState.status === 'CONCLUDED' ? (
          <HallOfDefenders
            agents={agents}
            currentAgent={currentAgent}
            isHost={false}
          />
        ) : (
          <AgentPhoneView
            agent={currentAgent}
            eventState={eventState}
            allAgents={agents}
            onUpdateScore={handleUpdateScore}
            onUpdateCombo={handleUpdateCombo}
            onBetSubmitted={handleBetSubmitted}
            onSquadNodeAction={handleSquadNodeAction}
            onDoorCodeUnlocked={handleDoorCodeUnlocked}
          />
        )
      )}

    </div>
  );
}

export default App;
