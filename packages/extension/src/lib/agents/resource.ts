// packages/extension/src/lib/agents/resource.ts
import type { Agent, Proposal, Snapshot } from "../types";

const n = (x?: number) => (typeof x === "number" ? x : 0);

export const ResourceAgent: Agent = {
  name: "resource",
  propose(s: Snapshot): Proposal | null {
    const r = s.resources; const cap = s.capacity;
    if (!r || !cap) return null;

    if ((r.netCrop ?? 0) < 0) {
      return {
        agent: "resource",
        title: "Fix negative crop",
        detail: "Queue crop fields or reduce consumption; net crop < 0.",
        priority: 95
      };
    }

    const nearFullW = cap.warehouse && Math.max(n(r.wood), n(r.clay), n(r.iron)) / cap.warehouse! > 0.9;
    const nearFullG = cap.granary && n(r.crop) / cap.granary! > 0.9;

    if (nearFullW || nearFullG) {
      return {
        agent: "resource",
        title: "Spend before overflow",
        detail: nearFullW ? "Warehouse ≥90% — start a build or trade." : "Granary ≥90% — spend/sell crop.",
        priority: 80
      };
    }

    const ph = r.perHour || {};
    const minPH = Math.min(...[ph.wood, ph.clay, ph.iron, ph.crop].map(n));
    if (minPH > 0 && minPH < 100 && s.page === "dorf1") {
      return {
        agent: "resource",
        title: "Upgrade low-yield fields",
        detail: "Balance wood/clay/iron/crop income (min < 100/h).",
        priority: 55
      };
    }

    return null;
  }
};
