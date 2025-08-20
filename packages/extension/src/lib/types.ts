// packages/extension/src/lib/types.ts

// ========== Page Types ==========
export type PageKind = "dorf1" | "dorf2" | "hero" | "rally" | "market" | "reports" | "messages" | "alliance" | "other";

// ========== Game State Types ==========
export interface GameState {
  timestamp: number;
  page: PageKind;
  url: string;
  server: ServerInfo;
  villages: Village[];
  resources: ResourceState;
  buildings: Building[];
  troops: { [unitName: string]: number };
  hero: HeroState;
  movements: Movement[];
  alliance?: AllianceInfo;
  reports: Report[];
}

export interface ServerInfo {
  name: string;
  speed: number;
  troopSpeed: number;
  worldId: string;
}

export interface Village {
  id: string;
  name: string;
  x: number;
  y: number;
  population: number;
  isCapital: boolean;
  loyalty: number;
}

export interface ResourceState {
  wood: number;
  clay: number;
  iron: number;
  crop: number;
  woodProduction: number;
  clayProduction: number;
  ironProduction: number;
  cropProduction: number;
  freeCrop: number;
  warehouseCapacity: number;
  granaryCapacity: number;
}

export interface Building {
  id: string;
  name: string;
  level: number;
  isUpgrading: boolean;
  upgradeTime?: number;
  position?: number;
}

export interface HeroState {
  level: number;
  health: number;
  experience: number;
  attack: number;
  defense: number;
  isHome: boolean;
  isMoving: boolean;
}

export interface Movement {
  id: string;
  type: 'incoming_attack' | 'outgoing_attack' | 'incoming_support' | 'outgoing_support' | 'returning' | 'merchant';
  arrivalTime: number;
  origin?: string;
  destination?: string;
  units?: { [unitName: string]: number };
}

export interface AllianceInfo {
  name: string;
  rank: number;
  members: number;
  role: 'member' | 'officer' | 'leader';
}

export interface Report {
  id: string;
  type: 'attack' | 'defense' | 'scout' | 'trade' | 'adventure';
  timestamp: number;
  read: boolean;
  title: string;
}

// ========== Player Profile Types ==========
export interface PlayerProfile {
  id: string;
  name: string;
  tribe: 'Romans' | 'Gauls' | 'Teutons' | 'Egyptians' | 'Huns';
  style: 'aggressive' | 'defensive' | 'economic' | 'balanced';
  goldUsage: 'none' | 'minimal' | 'moderate' | 'aggressive';
  hoursPerDay: number;
  checkInsPerDay: number;
  timezone: string;
  primaryGoal: 'top_attacker' | 'top_defender' | 'top_climber' | 'wonder_win' | 'support';
  constraints: {
    noNightActivity?: boolean;
    avoidConflict?: boolean;
    focusEfficiency?: boolean;
  };
  weights: {
    economy: number;     // 0-1
    military: number;    // 0-1
    alliance: number;    // 0-1
    risk: number;        // 0-1
  };
}

// ========== AI Analysis Types ==========
export interface Analysis {
  recommendations: Recommendation[];
  warnings: string[];
  strategicNotes: string;
  timestamp: number;
  creditsRemaining?: number;
}

export interface Recommendation {
  action: string;
  reason: string;
  expectedBenefit: string;
  timeRequired?: string;
  priority: 'high' | 'medium' | 'low';
  actionCode?: string;
  category?: 'resource' | 'military' | 'building' | 'hero' | 'alliance';
}

// ========== Legacy Types (for compatibility) ==========
export type Resources = {
  wood?: number; 
  clay?: number; 
  iron?: number; 
  crop?: number;
  perHour?: { 
    wood?: number; 
    clay?: number; 
    iron?: number; 
    crop?: number 
  };
  netCrop?: number;
};

export type Capacity = { 
  warehouse?: number; 
  granary?: number 
};

export type BuildQueueItem = { 
  name?: string; 
  timeText?: string 
};

export type BuildQueue = { 
  items: BuildQueueItem[] 
};

export type HeroStats = {
  healthPct?: number;
  exp?: number;
  speedFieldsPerHour?: number;
  gold?: number;
  silver?: number;
};

export type Snapshot = {
  page: PageKind;
  url: string;
  ts: number;
  resources?: Resources;
  capacity?: Capacity;
  buildQueue?: BuildQueue;
  hero?: HeroStats;
};

export type Proposal = {
  agent: "resource" | "build" | "hero";
  title: string;
  detail?: string;
  priority: number; // 0..100
};

export interface Agent {
  name: Proposal["agent"];
  propose(s: Snapshot): Proposal | null;
}

// ========== Message Types ==========
export interface ChromeMessage {
  type: string;
  [key: string]: any;
}

export interface AnalyzeMessage extends ChromeMessage {
  type: 'ANALYZE_NOW';
}

export interface AskQuestionMessage extends ChromeMessage {
  type: 'ASK_QUESTION';
  question: string;
}

export interface ExecuteActionMessage extends ChromeMessage {
  type: 'EXECUTE_ACTION';
  actionCode: string;
}

export interface UpdateProfileMessage extends ChromeMessage {
  type: 'UPDATE_PROFILE';
  profile: PlayerProfile;
}

// ========== Configuration Types ==========
export interface ExtensionConfig {
  apiKey?: string;
  aiProvider?: 'claude' | 'openai' | 'gemini';
  aiModel?: string;
  enabled?: boolean;
  hudPosition?: { x: number; y: number };
  hudMinimized?: boolean;
  profiles?: PlayerProfile[];
  activeProfileId?: string;
}
