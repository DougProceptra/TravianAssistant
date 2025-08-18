// packages/extension/src/lib/types.ts
export type PageKind = "dorf1" | "dorf2" | "hero" | "rally" | "market" | "other";

export type Resources = {
  wood?: number; clay?: number; iron?: number; crop?: number;
  perHour?: { wood?: number; clay?: number; iron?: number; crop?: number };
  netCrop?: number;
};
export type Capacity = { warehouse?: number; granary?: number };

export type BuildQueueItem = { name?: string; timeText?: string };
export type BuildQueue = { items: BuildQueueItem[] };

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
