// packages/extension/src/lib/agents/build.ts
import type { Agent, Proposal, Snapshot } from "../types";
import { secsUntil } from "../state";

export const BuildAgent: Agent = {
  name: "build",
  propose(s: Snapshot): Proposal | null {
    const q = s.buildQueue?.items || [];
    if (!q.length) {
      return {
        agent: "build",
        title: "Idle build queue",
        detail: s.page === "dorf2" ? "No buildings queued — add an upgrade." : "Open dorf2 and queue.",
        priority: 70
      };
    }
    const eta = secsUntil(q[0]?.timeText);
    if (eta !== undefined && eta < 15 * 60) {
      return {
        agent: "build",
        title: "Queue next build",
        detail: `Next completes in ~${Math.max(1, Math.round(eta/60))}m.`,
        priority: 50
      };
    }
    return null;
  }
};
