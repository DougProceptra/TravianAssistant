// packages/extension/src/lib/state.ts
import type { Snapshot } from "./types";

let last: Snapshot | null = null;

export function setSnapshot(s: Snapshot) { last = s; }
export function getSnapshot(): Snapshot | null { return last; }

export function secsUntil(timeText?: string): number | undefined {
  if (!timeText) return;
  const m = timeText.match(/(\d+):(\d+):(\d+)/); // hh:mm:ss
  if (!m) return;
  const [, h, min, sec] = m;
  return (+h) * 3600 + (+min) * 60 + (+sec);
}
