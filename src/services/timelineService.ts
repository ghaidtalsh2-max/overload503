// src/services/timelineService.ts
// Autopilot timeline driven by a single authoritative clock (roundStartAt)
// All devices derive the identical phase, station, and second without drift.

export type GamePhase =
  | 'LOBBY'
  | 'BREACH'
  | 'LOGIN'
  | 'STATION_1'
  | 'DOOR_1'
  | 'STATION_2'
  | 'DOOR_2'
  | 'STATION_3'
  | 'DOOR_3'
  | 'STATION_4'
  | 'SECURED';

export interface TimelineState {
  phase: GamePhase;
  currentStation: 0 | 1 | 2 | 3 | 4;
  inPhaseSeconds: number;
  phaseDuration: number;
  totalTimeRemaining: number; // Seconds left until SECURED
  overloadText: string;       // Formatted mm:ss
  activeAlarm: boolean;
  threatLevel: number;        // 1 to 5
  scriptedEvent: 'NONE' | 'ATTACK_WAVE' | 'WORKER_CRASH' | 'SESSION_ALERT' | 'POWER_FLICKER' | 'FREEZE_SPAWN';
  doorCode: string;
  doorCodeExpiresIn: number;
  last10SecondsPulse: boolean;
  serverHealthAlertLevel: 0 | 1 | 2 | 3; // 0=normal, 1=<50%, 2=<20%, 3=0%
  breachHeadline?: string;
  notificationsCount: number; // how many notifications to reveal in LOBBY
}

// Durations of each phase in seconds (Total = 260s ~ 4.3 mins)
export const PHASE_DURATIONS: Record<GamePhase, number> = {
  LOBBY: 45,       // Countdown in lobby with arriving notifications
  BREACH: 8,       // Giant glitch alert
  LOGIN: 15,       // Terminal authentication step
  STATION_1: 45,   // Type-to-block falling requests (CVE-2026-109618)
  DOOR_1: 8,       // Door code transition
  STATION_2: 45,   // Heap blocks & stale pointer 0x7f3a (CVE-2026-109619)
  DOOR_2: 8,       // Door code transition
  STATION_3: 40,   // OPcache conveyor flag box-12 & sessions rotate
  DOOR_3: 8,       // Door code transition
  STATION_4: 45,   // Terminal fix with patch validation
  SECURED: 9999    // Hall of Defenders & paper bridge
};

export const TOTAL_GAME_PLAY_SECONDS =
  PHASE_DURATIONS.BREACH +
  PHASE_DURATIONS.LOGIN +
  PHASE_DURATIONS.STATION_1 +
  PHASE_DURATIONS.DOOR_1 +
  PHASE_DURATIONS.STATION_2 +
  PHASE_DURATIONS.DOOR_2 +
  PHASE_DURATIONS.STATION_3 +
  PHASE_DURATIONS.DOOR_3 +
  PHASE_DURATIONS.STATION_4; // 214 seconds ~ 3:34

export function getDoorCodeForSlot(slotIndex: number): string {
  const base = ((slotIndex * 3719 + 4821) % 9000) + 1000;
  return base.toString();
}

/**
 * Pure function deriving TimelineState from seconds elapsed since roundStartAt
 */
export function deriveTimelineState(
  elapsedSec: number,
  sharedServerHealth: number = 100
): TimelineState {
  // 1. Health Alert Escalation
  let healthLevel: 0 | 1 | 2 | 3 = 0;
  if (sharedServerHealth <= 0) healthLevel = 3;
  else if (sharedServerHealth < 20) healthLevel = 2;
  else if (sharedServerHealth < 50) healthLevel = 1;

  // 2. Rotating door code every 8 seconds
  const doorSlot = Math.floor(Math.max(0, elapsedSec) / 8);
  const doorCode = getDoorCodeForSlot(doorSlot);
  const doorCodeExpiresIn = Math.max(1, 8 - (Math.floor(Math.max(0, elapsedSec)) % 8));

  // 3. Countdown timer calculations
  const totalRemaining = Math.max(0, TOTAL_GAME_PLAY_SECONDS - Math.max(0, Math.floor(elapsedSec)));
  const mm = String(Math.floor(totalRemaining / 60)).padStart(2, '0');
  const ss = String(totalRemaining % 60).padStart(2, '0');
  const overloadText = `${mm}:${ss}`;

  // PHASE 0: LOBBY (elapsedSec < 0)
  if (elapsedSec < 0) {
    const lobbySecsLeft = Math.abs(Math.floor(elapsedSec));
    // Notifications arrive gradually in lobby
    const notifCount = elapsedSec < -30 ? 1 : elapsedSec < -20 ? 2 : elapsedSec < -10 ? 3 : 4;
    return {
      phase: 'LOBBY',
      currentStation: 0,
      inPhaseSeconds: 45 - lobbySecsLeft,
      phaseDuration: 45,
      totalTimeRemaining: TOTAL_GAME_PLAY_SECONDS,
      overloadText: '03:34',
      activeAlarm: false,
      threatLevel: 1,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: 0,
      notificationsCount: notifCount
    };
  }

  let cursor = 0;

  // 1. BREACH (0 to 8s)
  if (elapsedSec < cursor + PHASE_DURATIONS.BREACH) {
    const inSec = elapsedSec - cursor;
    return {
      phase: 'BREACH',
      currentStation: 0,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.BREACH,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: true,
      threatLevel: inSec > 4 ? 5 : 4,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: healthLevel,
      breachHeadline: 'الخلل ليس في موقعك... بل تحته',
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.BREACH;

  // 2. LOGIN (8 to 23s)
  if (elapsedSec < cursor + PHASE_DURATIONS.LOGIN) {
    const inSec = elapsedSec - cursor;
    return {
      phase: 'LOGIN',
      currentStation: 0,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.LOGIN,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: true,
      threatLevel: 4,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: PHASE_DURATIONS.LOGIN - inSec <= 5,
      serverHealthAlertLevel: healthLevel,
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.LOGIN;

  // 3. STATION 1: THE REQUEST (23 to 68s)
  if (elapsedSec < cursor + PHASE_DURATIONS.STATION_1) {
    const inSec = elapsedSec - cursor;
    const isAttackWave = inSec >= 20 && inSec <= 28;
    return {
      phase: 'STATION_1',
      currentStation: 1,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.STATION_1,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: true,
      threatLevel: isAttackWave ? 5 : 4,
      scriptedEvent: isAttackWave ? 'ATTACK_WAVE' : 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: PHASE_DURATIONS.STATION_1 - inSec <= 10,
      serverHealthAlertLevel: healthLevel,
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.STATION_1;

  // 4. DOOR 1 (68 to 76s)
  if (elapsedSec < cursor + PHASE_DURATIONS.DOOR_1) {
    const inSec = elapsedSec - cursor;
    return {
      phase: 'DOOR_1',
      currentStation: 1,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.DOOR_1,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: false,
      threatLevel: 3,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: healthLevel,
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.DOOR_1;

  // 5. STATION 2: THE MEMORY (76 to 121s)
  if (elapsedSec < cursor + PHASE_DURATIONS.STATION_2) {
    const inSec = elapsedSec - cursor;
    const isFreeze = inSec >= 15 && inSec <= 20;
    const isWorkerCrash = inSec >= 25 && inSec <= 30;
    return {
      phase: 'STATION_2',
      currentStation: 2,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.STATION_2,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: true,
      threatLevel: 4,
      scriptedEvent: isFreeze ? 'FREEZE_SPAWN' : isWorkerCrash ? 'WORKER_CRASH' : 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: PHASE_DURATIONS.STATION_2 - inSec <= 10,
      serverHealthAlertLevel: healthLevel,
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.STATION_2;

  // 6. DOOR 2 (121 to 129s)
  if (elapsedSec < cursor + PHASE_DURATIONS.DOOR_2) {
    const inSec = elapsedSec - cursor;
    return {
      phase: 'DOOR_2',
      currentStation: 2,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.DOOR_2,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: false,
      threatLevel: 3,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: healthLevel,
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.DOOR_2;

  // 7. STATION 3: THE OPCACHE (129 to 169s)
  if (elapsedSec < cursor + PHASE_DURATIONS.STATION_3) {
    const inSec = elapsedSec - cursor;
    const isSessionAlert = inSec >= 18 && inSec <= 25;
    return {
      phase: 'STATION_3',
      currentStation: 3,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.STATION_3,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: true,
      threatLevel: 4,
      scriptedEvent: isSessionAlert ? 'SESSION_ALERT' : 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: PHASE_DURATIONS.STATION_3 - inSec <= 10,
      serverHealthAlertLevel: healthLevel,
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.STATION_3;

  // 8. DOOR 3 (169 to 177s)
  if (elapsedSec < cursor + PHASE_DURATIONS.DOOR_3) {
    const inSec = elapsedSec - cursor;
    return {
      phase: 'DOOR_3',
      currentStation: 3,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.DOOR_3,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: false,
      threatLevel: 3,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: healthLevel,
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.DOOR_3;

  // 9. STATION 4: THE FIX (177 to 222s)
  if (elapsedSec < cursor + PHASE_DURATIONS.STATION_4) {
    const inSec = elapsedSec - cursor;
    const isFlicker = inSec >= 12 && inSec <= 14;
    return {
      phase: 'STATION_4',
      currentStation: 4,
      inPhaseSeconds: inSec,
      phaseDuration: PHASE_DURATIONS.STATION_4,
      totalTimeRemaining: totalRemaining,
      overloadText,
      activeAlarm: true,
      threatLevel: inSec > 35 ? 5 : 4,
      scriptedEvent: isFlicker ? 'POWER_FLICKER' : 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: PHASE_DURATIONS.STATION_4 - inSec <= 10,
      serverHealthAlertLevel: healthLevel,
      notificationsCount: 5
    };
  }
  cursor += PHASE_DURATIONS.STATION_4;

  // 10. SECURED (Hall of Defenders & Paper Bridge)
  return {
    phase: 'SECURED',
    currentStation: 4,
    inPhaseSeconds: elapsedSec - cursor,
    phaseDuration: 9999,
    totalTimeRemaining: 0,
    overloadText: '00:00',
    activeAlarm: false,
    threatLevel: 1,
    scriptedEvent: 'NONE',
    doorCode,
    doorCodeExpiresIn,
    last10SecondsPulse: false,
    serverHealthAlertLevel: 0,
    notificationsCount: 5
  };
}
