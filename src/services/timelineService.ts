import { StationId, Subphase } from '../types/game';

export interface TimelineState {
  phase: 'LOBBY' | 'BREACH' | 'STATION' | 'DOOR' | 'SECURED';
  currentStation: StationId;
  subphase: Subphase;
  inStationSeconds: number;
  stationTimeRemaining: number;
  totalTimeRemaining: number; // Seconds left until 210s (SECURED)
  activeAlarm: boolean;
  threatLevel: number; // 1 to 5
  scriptedEvent: 'NONE' | 'ATTACK_WAVE' | 'POWER_FLICKER' | 'FREEZE_SPAWN';
  doorCode: string;
  doorCodeExpiresIn: number;
  last10SecondsPulse: boolean;
  serverHealthAlertLevel: 0 | 1 | 2 | 3; // 0=norm, 1=<50%, 2=<20%, 3=0%
  breachHeadline?: string;
  overloadText: string;
}

export const TOTAL_ROUND_SECONDS = 210; // 3:30 total time until SECURED

/**
 * Deterministic Door Code generator per 8s window slot
 */
export function getDoorCodeForSlot(slotIndex: number): string {
  // Deterministic 4-digit code using linear congruential formula
  const base = ((slotIndex * 3719 + 4821) % 9000) + 1000;
  return base.toString();
}

/**
 * Pure function that derives the entire game state from elapsed seconds
 */
export function deriveTimelineState(
  elapsedSec: number,
  sharedServerHealth: number = 100
): TimelineState {
  // 1. Health Alert Escalation
  let healthLevel: 0 | 1 | 2 | 3 = 0;
  if (sharedServerHealth <= 0) {
    healthLevel = 3;
  } else if (sharedServerHealth < 20) {
    healthLevel = 2;
  } else if (sharedServerHealth < 50) {
    healthLevel = 1;
  }

  // 2. Door Code 8s cycle (independent deterministic clock)
  const doorSlot = Math.floor(elapsedSec / 8);
  const doorCode = getDoorCodeForSlot(doorSlot);
  const doorCodeExpiresIn = Math.max(1, 8 - (Math.floor(elapsedSec) % 8));

  // Countdown timer: equals remaining scripted time
  const totalTimeRemaining = Math.max(0, TOTAL_ROUND_SECONDS - Math.floor(elapsedSec));
  const mm = String(Math.floor(totalTimeRemaining / 60)).padStart(2, '0');
  const ss = String(totalTimeRemaining % 60).padStart(2, '0');
  const overloadText = `${mm}:${ss}`;

  // PHASE A: LOBBY (elapsedSec < 0)
  if (elapsedSec < 0) {
    return {
      phase: 'LOBBY',
      currentStation: 0,
      subphase: 'NORMAL',
      inStationSeconds: 0,
      stationTimeRemaining: 0,
      totalTimeRemaining: TOTAL_ROUND_SECONDS,
      activeAlarm: false,
      threatLevel: 1,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: 0,
      overloadText: '03:30'
    };
  }

  // PHASE B: 0:00 - 0:08 BREACH (8 seconds)
  if (elapsedSec < 8) {
    return {
      phase: 'BREACH',
      currentStation: 1,
      subphase: 'NORMAL',
      inStationSeconds: elapsedSec,
      stationTimeRemaining: 8 - elapsedSec,
      totalTimeRemaining,
      activeAlarm: true,
      threatLevel: 4,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: healthLevel,
      breachHeadline: "The flaw isn't in your site... it's beneath it.",
      overloadText
    };
  }

  // PHASE C: 0:08 - 0:48 STATION 1 (THE REQUEST) (40s duration: 8s to 48s)
  if (elapsedSec < 48) {
    const s1Elapsed = elapsedSec - 8;
    const isNormal = s1Elapsed < 6;
    const isBreak = s1Elapsed >= 6 && s1Elapsed < 8;
    const subphase: Subphase = isNormal ? 'NORMAL' : isBreak ? 'BREAK' : 'FIX';
    const isAttackWave = s1Elapsed >= 25 && s1Elapsed <= 29;
    const last10 = 40 - s1Elapsed <= 10;

    return {
      phase: 'STATION',
      currentStation: 1,
      subphase,
      inStationSeconds: s1Elapsed,
      stationTimeRemaining: Math.max(0, 40 - Math.floor(s1Elapsed)),
      totalTimeRemaining,
      activeAlarm: !isNormal,
      threatLevel: isAttackWave ? 5 : 4,
      scriptedEvent: isAttackWave ? 'ATTACK_WAVE' : 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: last10,
      serverHealthAlertLevel: healthLevel,
      overloadText
    };
  }

  // PHASE D: 0:48 - 0:56 DOOR 1 (8 seconds: 48s to 56s)
  if (elapsedSec < 56) {
    const doorElapsed = elapsedSec - 48;
    return {
      phase: 'DOOR',
      currentStation: 1,
      subphase: 'DOOR_CODE',
      inStationSeconds: doorElapsed,
      stationTimeRemaining: Math.max(0, 8 - Math.floor(doorElapsed)),
      totalTimeRemaining,
      activeAlarm: false,
      threatLevel: 3,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: healthLevel,
      overloadText
    };
  }

  // PHASE E: 0:56 - 1:36 STATION 2 (THE MEMORY) (40s duration: 56s to 96s)
  if (elapsedSec < 96) {
    const s2Elapsed = elapsedSec - 56;
    const isNormal = s2Elapsed < 6;
    const isBreak = s2Elapsed >= 6 && s2Elapsed < 8;
    const subphase: Subphase = isNormal ? 'NORMAL' : isBreak ? 'BREAK' : 'FIX';
    const isFreeze = s2Elapsed >= 15 && s2Elapsed <= 22;
    const last10 = 40 - s2Elapsed <= 10;

    return {
      phase: 'STATION',
      currentStation: 2,
      subphase,
      inStationSeconds: s2Elapsed,
      stationTimeRemaining: Math.max(0, 40 - Math.floor(s2Elapsed)),
      totalTimeRemaining,
      activeAlarm: !isNormal,
      threatLevel: 4,
      scriptedEvent: isFreeze ? 'FREEZE_SPAWN' : 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: last10,
      serverHealthAlertLevel: healthLevel,
      overloadText
    };
  }

  // PHASE F: 1:36 - 1:44 DOOR 2 (8 seconds: 96s to 104s)
  if (elapsedSec < 104) {
    const doorElapsed = elapsedSec - 96;
    return {
      phase: 'DOOR',
      currentStation: 2,
      subphase: 'DOOR_CODE',
      inStationSeconds: doorElapsed,
      stationTimeRemaining: Math.max(0, 8 - Math.floor(doorElapsed)),
      totalTimeRemaining,
      activeAlarm: false,
      threatLevel: 3,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: healthLevel,
      overloadText
    };
  }

  // PHASE G: 1:44 - 2:24 STATION 3 (THE OPCACHE) (40s duration: 104s to 144s)
  if (elapsedSec < 144) {
    const s3Elapsed = elapsedSec - 104;
    const isNormal = s3Elapsed < 6;
    const isBreak = s3Elapsed >= 6 && s3Elapsed < 8;
    const subphase: Subphase = isNormal ? 'NORMAL' : isBreak ? 'BREAK' : 'FIX';
    const isFlicker = s3Elapsed >= 15 && s3Elapsed <= 17;
    const last10 = 40 - s3Elapsed <= 10;

    return {
      phase: 'STATION',
      currentStation: 3,
      subphase,
      inStationSeconds: s3Elapsed,
      stationTimeRemaining: Math.max(0, 40 - Math.floor(s3Elapsed)),
      totalTimeRemaining,
      activeAlarm: !isNormal,
      threatLevel: 4,
      scriptedEvent: isFlicker ? 'POWER_FLICKER' : 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: last10,
      serverHealthAlertLevel: healthLevel,
      overloadText
    };
  }

  // PHASE H: 2:24 - 2:32 DOOR 3 (8 seconds: 144s to 152s)
  if (elapsedSec < 152) {
    const doorElapsed = elapsedSec - 144;
    return {
      phase: 'DOOR',
      currentStation: 3,
      subphase: 'DOOR_CODE',
      inStationSeconds: doorElapsed,
      stationTimeRemaining: Math.max(0, 8 - Math.floor(doorElapsed)),
      totalTimeRemaining,
      activeAlarm: false,
      threatLevel: 3,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: false,
      serverHealthAlertLevel: healthLevel,
      overloadText
    };
  }

  // PHASE I: 2:32 - 3:30 STATION 4 (THE FIX) (58s duration: 152s to 210s)
  if (elapsedSec < 210) {
    const s4Elapsed = elapsedSec - 152;
    // 0s to 20s: THE BET
    // 20s to 26s: REVEAL
    // 26s to 51s: SQUAD BATTLE
    // 51s to 58s: WRAPUP
    let subphase: Subphase = 'BET';
    if (s4Elapsed >= 20 && s4Elapsed < 26) {
      subphase = 'REVEAL';
    } else if (s4Elapsed >= 26) {
      subphase = 'BATTLE';
    }
    const last10 = 58 - s4Elapsed <= 10;

    return {
      phase: 'STATION',
      currentStation: 4,
      subphase,
      inStationSeconds: s4Elapsed,
      stationTimeRemaining: Math.max(0, 58 - Math.floor(s4Elapsed)),
      totalTimeRemaining,
      activeAlarm: true,
      threatLevel: 4,
      scriptedEvent: 'NONE',
      doorCode,
      doorCodeExpiresIn,
      last10SecondsPulse: last10,
      serverHealthAlertLevel: healthLevel,
      overloadText
    };
  }

  // PHASE J: 3:30+ (210s+) SECURED (HALL OF DEFENDERS)
  return {
    phase: 'SECURED',
    currentStation: 5,
    subphase: 'TAKEAWAY',
    inStationSeconds: elapsedSec - 210,
    stationTimeRemaining: 0,
    totalTimeRemaining: 0,
    activeAlarm: false,
    threatLevel: 1,
    scriptedEvent: 'NONE',
    doorCode,
    doorCodeExpiresIn,
    last10SecondsPulse: false,
    serverHealthAlertLevel: 0,
    overloadText: '00:00'
  };
}
