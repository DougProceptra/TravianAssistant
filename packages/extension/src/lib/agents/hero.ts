// packages/extension/src/lib/agents/hero.ts
import type { Agent, Proposal, Snapshot } from "../types";

export const HeroAgent: Agent = {
  name: "hero",
  propose(s: Snapshot): Proposal | null {
    const h = s.hero;
    if (!h) return null;

    if (typeof h.healthPct === "number" && h.healthPct < 60) {
      return {
        agent: "hero",
        title: "Heal hero",
        detail: `Health ${h.healthPct}% — consider a salve or wait.`,
        priority: 65
      };
    }
    return null;
  }
};
