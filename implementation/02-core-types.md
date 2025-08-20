# Core TypeScript Type Definitions

## File: `src/shared/types.ts`

```typescript
export interface GameState {
  timestamp: number;
  serverDay: number;
  serverTime: string;
  villages: Village[];
  resources: Resources;
  production: Production;
  capacity: Capacity;
  buildQueue: BuildQueueItem[];
  troops: TroopInfo;
  movements: Movement[];
  incomingAttacks: Attack[];
  hero: HeroState;
  reports: Report[];
}

export interface Village {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  isCapital: boolean;
  population: number;
  loyalty: number;
  celebrationEnd?: string;
}

export interface Resources {
  wood: number;
  clay: number;
  iron: number;
  crop: number;
}

export interface Production extends Resources {
  cropNet: number;
}

export interface Capacity {
  warehouse: number;
  granary: number;
}

export interface BuildQueueItem {
  id: string;
  name: string;
  level: number;
  timeLeft: string;
  finishTime: Date;
}

export interface TroopInfo {
  own: TroopCounts;
  reinforcements: TroopCounts;
  totalDefense: number;
  totalOffense: number;
  inTraining: TrainingQueue[];
}

export interface TroopCounts {
  [unitType: string]: number;
}

export interface Movement {
  id: string;
  type: 'attack' | 'raid' | 'reinforcement' | 'return' | 'adventure';
  from: string;
  to: string;
  arrival: Date;
  units?: TroopCounts;
}

export interface Attack extends Movement {
  dangerLevel: 'low' | 'medium' | 'high' | 'critical';
  timeToArrival: string;
}

export interface HeroState {
  level: number;
  health: number;
  experience: number;
  adventurePoints: number;
  location: string;
  status: 'home' | 'adventure' | 'reinforcing' | 'dead';
}

export interface PlayerProfile {
  id: string;
  name: string;
  tribe: 'Romans' | 'Gauls' | 'Teutons' | 'Egyptians' | 'Huns';
  style: 'aggressive' | 'defensive' | 'economic' | 'balanced';
  goldUsage: 'none' | 'minimal' | 'moderate' | 'aggressive';
  hoursPerDay: number;
  checkInsPerDay: number;
  primaryGoal: 'top10Attack' | 'top10Defense' | 'wonderWin' | 'topClimber' | 'support';
  weights: {
    economy: number;    // 0-1
    military: number;   // 0-1
    alliance: number;   // 0-1
    risk: number;       // 0-1
  };
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  benefit: string;
  timeRequired: string;
  actionCode?: ActionCode;
  category: 'resource' | 'military' | 'building' | 'hero' | 'alliance';
}

export interface ActionCode {
  type: string;
  params: any;
}

export interface Analysis {
  recommendations: Recommendation[];
  warnings: Warning[];
  strategicNotes: string[];
  nextAnalysisIn: number;
}

export interface Warning {
  type: 'overflow' | 'attack' | 'starvation' | 'inactive';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;
}

export interface Report {
  id: string;
  type: 'attack' | 'defense' | 'scout' | 'trade';
  timestamp: Date;
  read: boolean;
  result?: 'victory' | 'defeat' | 'neutral';
}

export interface TrainingQueue {
  unitType: string;
  count: number;
  finishTime: Date;
}
```

## Usage

These types provide the foundation for the entire extension:

- **GameState**: Complete snapshot of the current game situation
- **PlayerProfile**: Customizable player preferences and strategy
- **Analysis**: AI-generated recommendations and insights
- **Recommendation**: Individual action items with priority and context

All components import and use these types to ensure type safety across the extension.