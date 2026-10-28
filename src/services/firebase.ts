import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { EventState, Agent, Squad, StationId, KillFeedItem } from '../types/game';
import { SQUAD_INITIAL_NODES } from '../data/gameData';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== 'demo-overload503'
);

let app: any = null;
let db: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase init fallback to local dev mode:', err);
  }
}

export const EVENT_ID = '503-overload';

let clockSkewMs = 0;
export function setClockSkew(serverTimestampMs: number) {
  clockSkewMs = serverTimestampMs - Date.now();
}
export function getServerNow(): number {
  return Date.now() + clockSkewMs;
}

export const INITIAL_EVENT_STATE: EventState = {
  eventId: EVENT_ID,
  status: 'STABLE',
  currentStation: 0,
  subphase: 'NORMAL',
  subphaseTimeRemaining: 6,
  totalTimeRemaining: 210, // 03:30
  threatLevel: 1, // 1 of 5
  sharedServerHealth: 100,
  doorCode: '4821',
  doorCodeExpiresIn: 8,
  exposedSitesCount: 712040,
  registrationOpen: true,
  activeAlarm: false,
  powerFlicker: false,
  roundStartAt: null,
  lobbyStartAt: null,
  pausedAt: null,
  pausedOffsetSec: 0,
  autopilot: true,
  autoLoop: import.meta.env.VITE_AUTO_LOOP === 'true',
  timeScale: 1,
  scriptedEvent: 'NONE',
  squadBattle: {
    sentinels: JSON.parse(JSON.stringify(SQUAD_INITIAL_NODES)),
    neural: JSON.parse(JSON.stringify(SQUAD_INITIAL_NODES)),
    vault: JSON.parse(JSON.stringify(SQUAD_INITIAL_NODES))
  },
  betStatistics: {
    optionA: 0,
    optionB: 0,
    optionC: 0,
    optionD: 0,
    revealed: false
  }
};

// Realtime Cloud Relay for Zero-Config Multi-Device Sync over the Internet
const CLOUD_SYNC_TOPIC = `ovl503_room_${EVENT_ID}`;
const CLOUD_SYNC_URL = `https://ntfy.sh/${CLOUD_SYNC_TOPIC}`;

class HybridCloudSyncBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private eventSource: EventSource | null = null;
  private clientId: string = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  private lastPublished: Map<string, string> = new Map();

  constructor() {
    // 1. Same-device tab sync via BroadcastChannel
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('overload503_v2_channel');
      this.channel.onmessage = (event) => {
        const { topic, payload } = event.data || {};
        if (topic) {
          const callbacks = this.listeners.get(topic);
          callbacks?.forEach((cb) => cb(payload));
        }
      };
    }

    // 2. Multi-device cloud sync via SSE (phones <-> projector across the internet)
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      try {
        this.eventSource = new EventSource(`${CLOUD_SYNC_URL}/sse`);
        this.eventSource.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);
            if (raw.event === 'message' && raw.message) {
              const parsed = JSON.parse(raw.message);
              if (parsed.origin !== this.clientId && parsed.topic) {
                this.setStorage(parsed.topic, parsed.payload);
                const callbacks = this.listeners.get(parsed.topic);
                callbacks?.forEach((cb) => cb(parsed.payload));
              }
            }
          } catch {}
        };

        // Catch-up poll on connect (fetches recent state for newly joined phones)
        this.catchUpFromCloud();
      } catch (err) {
        console.warn('Cloud Sync SSE not available, falling back to local bus:', err);
      }
    }
  }

  private async catchUpFromCloud() {
    try {
      const res = await fetch(`${CLOUD_SYNC_URL}/json?poll=1&since=20m`);
      if (!res.ok) return;
      const text = await res.text();
      const lines = text.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.event === 'message' && obj.message) {
            const parsed = JSON.parse(obj.message);
            if (parsed.topic && parsed.payload) {
              this.setStorage(parsed.topic, parsed.payload);
              const callbacks = this.listeners.get(parsed.topic);
              callbacks?.forEach((cb) => cb(parsed.payload));
            }
          }
        } catch {}
      }
    } catch {}
  }

  public subscribe(topic: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(callback);

    const cached = this.getStorage(topic);
    if (cached !== null) {
      callback(cached);
    }

    return () => {
      this.listeners.get(topic)?.delete(callback);
    };
  }

  public publish(topic: string, payload: any) {
    // Avoid redundant network broadcasts if payload hasn't changed
    const serialized = JSON.stringify(payload);
    if (this.lastPublished.get(topic) === serialized) {
      return;
    }
    this.lastPublished.set(topic, serialized);

    this.setStorage(topic, payload);
    const callbacks = this.listeners.get(topic);
    callbacks?.forEach((cb) => cb(payload));

    // Local tab broadcast
    if (this.channel) {
      try {
        this.channel.postMessage({ topic, payload });
      } catch {}
    }

    // Cloud broadcast to all other phones & projector
    try {
      fetch(CLOUD_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          payload,
          origin: this.clientId,
          time: Date.now()
        })
      }).catch(() => {});
    } catch {}
  }

  public getStorage(key: string): any {
    try {
      const val = localStorage.getItem(`ovl2_${key}`);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  public setStorage(key: string, val: any) {
    try {
      localStorage.setItem(`ovl2_${key}`, JSON.stringify(val));
    } catch {}
  }
}

const localBus = new HybridCloudSyncBus();

export const GameService = {
  isCloud(): boolean {
    return isFirebaseConfigured && db !== null;
  },

  // Auth: Anonymous for Agents
  async ensureAgentAuth(): Promise<string> {
    if (this.isCloud() && auth) {
      if (!auth.currentUser) {
        const cred = await signInAnonymously(auth);
        return cred.user.uid;
      }
      return auth.currentUser.uid;
    }
    // Local unique ID (check sessionStorage first for multi-tab simulation, then localStorage)
    let localId = '';
    try {
      localId = sessionStorage.getItem('ovl2_agent_id') || localStorage.getItem('ovl2_agent_id') || '';
    } catch {}
    if (!localId) {
      localId = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      try {
        sessionStorage.setItem('ovl2_agent_id', localId);
      } catch {}
    }
    return localId;
  },

  // Host Auth: Google Sign-in with allowed host email or local override
  async signInHostGoogle(): Promise<User | null> {
    if (this.isCloud() && auth) {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      return res.user;
    }
    return null;
  },

  onHostAuthStateChanged(cb: (user: User | null) => void): () => void {
    if (this.isCloud() && auth) {
      return onAuthStateChanged(auth, cb);
    }
    // Local check
    const isLocalHost = localStorage.getItem('ovl2_is_host') === 'true';
    cb(isLocalHost ? ({ uid: 'local_host', email: 'host@gdg.campus', displayName: 'Host' } as unknown as User) : null);
    return () => {};
  },

  // Unique Name Reservation: create-only!
  async reserveAgentName(displayName: string): Promise<string> {
    const normalized = displayName.trim().toLowerCase().replace(/\s+/g, '_');
    if (normalized.length < 2) {
      throw new Error('الاسم يجب أن يحتوي على حرفين على الأقل');
    }

    if (this.isCloud()) {
      const nameRef = doc(db, 'name_reservations', normalized);
      const snap = await getDoc(nameRef);
      if (snap.exists()) {
        throw new Error('هذا الاسم محجوز بالفعل! يرجى اختيار اسم آخر.');
      }
      await setDoc(nameRef, {
        displayName: displayName.trim(),
        createdAt: serverTimestamp()
      });
      return normalized;
    }

    // Local mode check
    const reserved = localBus.getStorage(`name_${normalized}`);
    if (reserved) {
      throw new Error('هذا الاسم محجوز بالفعل! يرجى اختيار اسم آخر.');
    }
    localBus.setStorage(`name_${normalized}`, { displayName: displayName.trim(), time: Date.now() });
    return normalized;
  },

  // Subscribe to Event State
  subscribeToEvent(cb: (state: EventState) => void): () => void {
    if (this.isCloud()) {
      const eventRef = doc(db, 'events', EVENT_ID);
      return onSnapshot(eventRef, (snap) => {
        if (snap.exists()) {
          cb(snap.data() as EventState);
        } else {
          // Initialize if missing
          setDoc(eventRef, INITIAL_EVENT_STATE);
          cb(INITIAL_EVENT_STATE);
        }
      });
    }

    // Local Bus
    return localBus.subscribe('event_state', (data) => {
      cb(data || INITIAL_EVENT_STATE);
    });
  },

  // Host update of event state
  async updateEventState(updates: Partial<EventState>): Promise<void> {
    if (this.isCloud()) {
      const eventRef = doc(db, 'events', EVENT_ID);
      await updateDoc(eventRef, updates);
      return;
    }

    const current = localBus.getStorage('event_state') || INITIAL_EVENT_STATE;
    const merged = { ...current, ...updates };
    localBus.publish('event_state', merged);
  },

  // Reset event state (Host action)
  async resetEvent(): Promise<void> {
    const fresh = JSON.parse(JSON.stringify(INITIAL_EVENT_STATE));
    fresh.doorCode = Math.floor(1000 + Math.random() * 9000).toString();

    if (this.isCloud()) {
      await setDoc(doc(db, 'events', EVENT_ID), fresh);
    } else {
      localBus.publish('event_state', fresh);
      localBus.publish('agents_list', []);
      localBus.publish('kill_feed', []);
    }
  },

  // Start lobby countdown (sets future roundStartAt)
  async startLobbyCountdown(futureRoundStartAt: number): Promise<void> {
    await this.updateEventState({
      roundStartAt: futureRoundStartAt,
      status: 'STABLE'
    });
  },

  // Start incident immediately (sets roundStartAt to now)
  async startIncidentNow(): Promise<void> {
    await this.updateEventState({
      roundStartAt: Date.now(),
      status: 'INCIDENT_ACTIVE',
      activeAlarm: true,
      currentStation: 1
    });
  },

  // Toggle pause
  async togglePause(): Promise<void> {
    const current = localBus.getStorage('event_state') || INITIAL_EVENT_STATE;
    const isPaused = current.pausedOffsetSec !== undefined && current.pausedOffsetSec > 0;
    if (isPaused) {
      // Resume
      const pausedDuration = Date.now() - (current.pausedAt || Date.now());
      const newStart = (current.roundStartAt || Date.now()) + pausedDuration;
      await this.updateEventState({
        roundStartAt: newStart,
        pausedOffsetSec: 0,
        pausedAt: null
      });
    } else {
      // Pause
      await this.updateEventState({
        pausedOffsetSec: current.roundStartAt ? Math.floor((Date.now() - current.roundStartAt) / 1000) : 0,
        pausedAt: Date.now()
      });
    }
  },

  // Skip to next phase (shifts roundStartAt backward by 40s)
  async skipToNextPhase(): Promise<void> {
    const current = localBus.getStorage('event_state') || INITIAL_EVENT_STATE;
    const currentStart = current.roundStartAt || Date.now();
    await this.updateEventState({
      roundStartAt: currentStart - 42000
    });
  },

  // End game immediately (marks SECURED)
  async endGameNow(): Promise<void> {
    await this.updateEventState({
      roundStartAt: Date.now() - 250000,
      status: 'CONCLUDED',
      activeAlarm: false
    });
  },

  postKillFeedItem(item: Omit<KillFeedItem, 'id' | 'timestamp'>): void {
    this.publishKillFeedItem(item);
  },

  // Subscribe to All Agents
  subscribeToAgents(cb: (agents: Agent[]) => void): () => void {
    if (this.isCloud()) {
      const agentsRef = collection(db, 'events', EVENT_ID, 'agents');
      return onSnapshot(agentsRef, (snap) => {
        const list = snap.docs.map((d) => d.data() as Agent);
        cb(list);
      });
    }

    return localBus.subscribe('agents_list', (data) => {
      cb(Array.isArray(data) ? data : []);
    });
  },

  // Register Agent
  async registerAgent(agent: Agent): Promise<void> {
    if (this.isCloud()) {
      const agentRef = doc(db, 'events', EVENT_ID, 'agents', agent.id);
      await setDoc(agentRef, agent);
      return;
    }

    const current: Agent[] = localBus.getStorage('agents_list') || [];
    const idx = current.findIndex((a) => a.id === agent.id);
    if (idx >= 0) {
      current[idx] = agent;
    } else {
      current.push(agent);
    }
    localBus.publish('agents_list', current);
  },

  // Update Agent (score, combo, etc.)
  async updateAgent(agentId: string, updates: Partial<Agent>): Promise<void> {
    if (this.isCloud()) {
      const agentRef = doc(db, 'events', EVENT_ID, 'agents', agentId);
      await updateDoc(agentRef, updates);
      return;
    }

    const current: Agent[] = localBus.getStorage('agents_list') || [];
    const idx = current.findIndex((a) => a.id === agentId);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...updates, lastActive: Date.now() };
      localBus.publish('agents_list', current);
    }
  },

  // Kick Agent (Host only)
  async kickAgent(agentId: string): Promise<void> {
    if (this.isCloud()) {
      await deleteDoc(doc(db, 'events', EVENT_ID, 'agents', agentId));
      return;
    }

    const current: Agent[] = localBus.getStorage('agents_list') || [];
    const filtered = current.filter((a) => a.id !== agentId);
    localBus.publish('agents_list', filtered);
  },

  async deleteAgent(agentId: string): Promise<void> {
    return this.kickAgent(agentId);
  },

  // Kill Feed
  subscribeToKillFeed(cb: (items: KillFeedItem[]) => void): () => void {
    return localBus.subscribe('kill_feed', (data) => {
      cb(Array.isArray(data) ? data : []);
    });
  },

  publishKillFeedItem(item: Omit<KillFeedItem, 'id' | 'timestamp'>): void {
    const fullItem: KillFeedItem = {
      ...item,
      id: `kf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    const current: KillFeedItem[] = localBus.getStorage('kill_feed') || [];
    const updated = [fullItem, ...current.slice(0, 15)];
    localBus.publish('kill_feed', updated);
  }
};
