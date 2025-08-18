// packages/extension/src/lib/master.ts
import type { Snapshot, Proposal, Agent } from "./types";
import { setSnapshot } from "./state";
import { ResourceAgent } from "./agents/resource";
import { BuildAgent } from "./agents/build";
import { HeroAgent } from "./agents/hero";

const agents: Agent[] = [ResourceAgent, BuildAgent, HeroAgent];

export function masterOnSnapshot(s: Snapshot): { pick?: Proposal; all: Proposal[] } {
  setSnapshot(s);
  const proposals = agents.map(a => {
    try { return a.propose(s); } catch { return null; }
  }).filter(Boolean) as Proposal[];
  const pick = proposals.sort((a, b) => b.priority - a.priority)[0];
  return { pick, all: proposals };
}
