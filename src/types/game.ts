export type Squad = 'sentinels' | 'neural' | 'vault';

export type StationId = 0 | 1 | 2 | 3 | 4 | 5;

export type Subphase = 'NORMAL' | 'BREAK' | 'FIX' | 'DOOR_CODE' | 'BET' | 'REVEAL' | 'BATTLE' | 'TAKEAWAY';

export type CyberRank = 'ROOKIE' | 'ANALYST' | 'HUNTER' | 'GUARDIAN' | 'ROOT';

export type BadgeId = 'ZERO_LEAK' | 'POINTER_CUTTER' | 'PATCH_MASTER' | 'COMBO_BREAKER';

export interface SquadMeta {
  id: Squad;
  name: string;
  arabicName: string;
  track: 'WEB' | 'AI' | 'DATA';
  color: string;
  glow: string;
  badge: string;
  manifesto: string;
}

export interface Agent {
  id: string;
  normalizedName: string;
  displayName: string;
  squad: Squad;
  score: number;
  combo: number;
  highestCombo: number;
  badges: BadgeId[];
  stationScores: {
    station1: number;
    station2: number;
    station3: number;
    station4: number;
  };
  betChoice?: string;
  betStake?: number;
  doorCodeUnlockedAt?: number;
  joinedAt: number;
  lastActive: number;
}

export interface KillFeedItem {
  id: string;
  agentName: string;
  squad: Squad;
  action: string;
  points: number;
  timestamp: number;
}

export interface SquadBattleNode {
  id: string;
  name: string;
  version: string;
  status: 'vulnerable' | 'patched' | 'restarted' | 'verified';
}

export interface EventState {
  eventId: string;
  status: 'STABLE' | 'INCIDENT_ACTIVE' | 'PAUSED' | 'CONCLUDED';
  currentStation: StationId;
  subphase: Subphase;
  subphaseTimeRemaining: number;
  totalTimeRemaining: number; // e.g. 210s countdown down to 00:00
  threatLevel: number; // 1 to 5
  sharedServerHealth: number; // 0 to 100
  doorCode: string; // rotating 4-digit code
  doorCodeExpiresIn: number;
  exposedSitesCount: number; // starts ~700,000, climbs during breaks, drops on fixes
  registrationOpen: boolean;
  activeAlarm: boolean;
  powerFlicker: boolean;
  // Autopilot & Central Synchronized Timeline
  roundStartAt: number | null; // Server timestamp in ms when incident started
  lobbyStartAt: number | null; // Server timestamp in ms when lobby countdown started
  pausedAt: number | null;
  pausedOffsetSec: number;
  autopilot: boolean;
  autoLoop: boolean;
  timeScale: number;
  scriptedEvent: 'NONE' | 'ATTACK_WAVE' | 'POWER_FLICKER' | 'FREEZE_SPAWN';
  squadBattle: {
    sentinels: SquadBattleNode[];
    neural: SquadBattleNode[];
    vault: SquadBattleNode[];
    winningSquad?: Squad;
  };
  betStatistics: {
    optionA: number; // Update PHP itself (Correct)
    optionB: number; // Update WP only (Wrong)
    optionC: number; // Disable upload_progress (Partial)
    optionD: number; // Wait (Wrong)
    revealed: boolean;
  };
}

export interface StationDefinition {
  id: StationId;
  name: string;
  arabicName: string;
  subtitle: string;
  cveId?: string;
  normalDescription: string;
  breakDescription: string;
  fixInstruction: string;
  takeawaySentence: string;
}
