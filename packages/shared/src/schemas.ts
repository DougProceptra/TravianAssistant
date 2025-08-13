
import { z } from "zod";

export const Resource = z.object({
  current: z.number().optional(),
  perHour: z.number().optional(),
  net: z.number().optional()
});

export const ResourcePayload = z.object({
  resources: z.object({
    wood: Resource,
    clay: Resource,
    iron: Resource,
    crop: Resource
  }),
  capacity: z.object({
    warehouse: z.number().optional(),
    granary: z.number().optional()
  }).optional()
});

export const BuildQueueItem = z.object({
  building: z.string(),
  fromLevel: z.number(),
  toLevel: z.number(),
  endsAt: z.number().optional(),
  remaining: z.number().optional()
});

export const BuildPayload = z.object({
  buildings: z.array(z.object({ slot: z.number(), type: z.string(), level: z.number() })).optional(),
  queue: z.array(BuildQueueItem).optional()
});

export const HeroPayload = z.object({
  hero: z.object({
    hp: z.number().optional(),
    xp: z.number().optional(),
    level: z.number().optional(),
    unspentPoints: z.number().optional(),
    prodBonus: z.number().optional(),
    adventures: z.object({ available: z.number().optional() }).optional()
  })
});

export const MovementsPayload = z.object({
  incoming: z.object({
    total: z.number().optional(),
    soonestEta: z.number().optional()
  }).optional(),
  outgoing: z.object({
    total: z.number().optional()
  }).optional()
});

export const MarketPayload = z.object({
  merchants: z.object({ free: z.number().optional(), total: z.number().optional() }).optional(),
  trades: z.number().optional(),
  routes: z.number().optional()
});

export const SnapshotEnvelope = z.object({
  server: z.string(),
  page: z.enum(["dorf1","dorf2","build","hero","rally","market","other"]),
  ts: z.number(),
  payload: z.unknown()
});

export type SnapshotEnvelope = z.infer<typeof SnapshotEnvelope>;
