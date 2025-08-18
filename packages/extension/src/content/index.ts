/** Travian Loader Assistant – content script (v0.2.4)
 *  - Live HUD in the top-right with key info
 *  - Scrapes resources, capacities, build queue, hero stats
 *  - Saves world-state snapshots to localStorage every 5s
 *  - Works across dorf1, dorf2, /hero/*, rally point, and other pages
 *
 *  NOTE: This file is self-contained (no imports). Safe to paste over existing content/index.ts.
 */

//////////////////////////
// Constants & Utilities
//////////////////////////

const VERSION = "0.2.4";
const HUD_ID = "__tla_hud__";
const SNAPSHOT_KEY = "tla:snapshots";
const SNAPSHOT_MAX = 100; // keep last N snapshots
const TICK_MS = 1000;     // HUD refresh
const SNAPSHOT_MS = 5000; // localStorage persist

let hudTimer: number | undefined;
let snapshotTimer: number | undefined;

/** Normalize text and extract the last numeric token (robust to NBSP, bidi marks, commas). */
function parseNum(raw?: string | null): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/\u00A0/g, " ")          // NBSP -> space
    .replace(/[\u200E\u200F\u202A-\u202E]/g, "") // bidi/control chars
    .replace(/[’']/g, "")             // stray quotes
    .replace(/\s+/g, " ")             // collapse spaces
    .trim();

  // Grab all number-like tokens and take the last (often the visible value).
  const matches = cleaned.match(/-?\d{1,3}(?:[.,\s]\d{3})*(?:\.\d+)?|-?\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return undefined;
  const last = matches[matches.length - 1].replace(/\s|,/g, "");
  const n = Number(last);
  return Number.isFinite(n) ? n : undefined;
}

/** Safe query textContent. */
function text(sel: string): string | undefined {
  return (document.querySelector(sel)?.textContent || undefined)?.trim();
}

/** Try a list of selectors, return first hit raw text + which selector matched. */
function pickText(selectors: string[]): { sel?: string; raw?: string } {
  for (const s of selectors) {
    const el = document.querySelector(s);
    const raw = el?.textContent?.trim();
    if (raw) return { sel: s, raw };
  }
  return {};
}

/** Try primary then fallback selectors, returning parsed number and the selector used. */
function pickNum(primary: string[], fallback: string[] = []): { value?: number; used?: string } {
  const a = pickText(primary);
  if (a.raw) return { value: parseNum(a.raw), used: a.sel };
  const b = pickText(fallback);
  if (b.raw) return { value: parseNum(b.raw), used: b.sel };
  return {};
}

/** Throttle helper for mutation observer. */
function debounce(fn: () => void, ms: number) {
  let t: number | undefined;
  return () => {
    if (t) clearTimeout(t);
    t = window.setTimeout(fn, ms);
  };
}

//////////////////////////
// Page Identification
//////////////////////////

type PageKind = "dorf1" | "dorf2" | "hero" | "rally" | "market" | "other";

function identifyPage(path: string): PageKind {
  const p = path.toLowerCase();
  if (p.includes("dorf1")) return "dorf1";
  if (p.includes("dorf2")) return "dorf2";
  if (p.includes("/hero/")) return "hero";
  if (p.includes("gid=16") || p.includes("rally")) return "rally";
  if (p.includes("gid=17") || p.includes("market")) return "market";
  return "other";
}

//////////////////////////
// Selectors (with fallbacks)
//////////////////////////

const SEL = {
  // Top stock bar (present on all pages)
  wood: ["#stockBar .r1 .value", "#stockBar .wood .value", ".ajaxReplaceableWoodAmount", ".r1.value"],
  clay: ["#stockBar .r2 .value", "#stockBar .clay .value", ".ajaxReplaceableClayAmount", ".r2.value"],
  iron: ["#stockBar .r3 .value", "#stockBar .iron .value", ".ajaxReplaceableIronAmount", ".r3.value"],
  crop: ["#stockBar .r4 .value", "#stockBar .crop .value", ".ajaxReplaceableCropAmount", ".r4.value"],

  // Warehouse / Granary capacities in the stock bar
  warehouseCap: ["#stockBar .warehouse .value", "#stockBar .warehouse", ".ajaxReplaceableWarehouse", ".warehouse .value"],
  granaryCap: ["#stockBar .granary .value", "#stockBar .granary", ".ajaxReplaceableGranary", ".granary .value"],

  // Dorf1 production (widget on the right). We’ll parse numbers directly from its list items.
  prodBox: ".production", // container
  prodWood: [".production .r1", ".production .wood"],
  prodClay: [".production .r2", ".production .clay"],
  prodIron: [".production .r3", ".production .iron"],
  prodCrop: [".production .r4", ".production .crop"],

  // Build queue (works on dorf2 + appears as panel on dorf1)
  buildRow: ".buildingList li, #build .buildingList li, .buildingList .entry, .boxes .box .ul .li",
  buildName: [".name", ".title", ".building", ".desc", ".text", ".slot", ".contract .value"],
  buildTime: [".buildDuration", ".duration", ".time", ".finishesAt", ".timer"],

  // Hero attributes (hero/attributes)
  heroStatRow: ".content .stats .progressBar, .content .stats .bar, .progressBar", // generic
  heroStatName: ".name",
  heroStatValue: ".value, .valueue", // value text
  heroFillPrimary: ".filling.primary", // width style -> %
  heroFillSecondary: ".filling.secondary", // sometimes layered

  // Rally overview (gid=16&t=1)
  rallyIncomingTable: "#build .incomings, #build .incomingTroops, #build .troop_details, .incomingTroops",
};

//////////////////////////
// HUD
//////////////////////////

function ensureHUD(): HTMLDivElement {
  let el = document.getElementById(HUD_ID) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = HUD_ID;
    el.style.position = "fixed";
    el.style.top = "8px";
    el.style.right = "8px";
    el.style.padding = "6px 10px";
    el.style.background = "rgba(0,0,0,0.75)";
    el.style.color = "#fff";
    el.style.font = "12px/1.2 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    el.style.borderRadius = "10px";
    el.style.zIndex = "2147483647";
    el.style.pointerEvents = "none";
    el.style.whiteSpace = "pre";
    document.documentElement.appendChild(el);
  }
  return el;
}

const fmt = (n?: number) => (typeof n === "number" && isFinite(n) ? n.toLocaleString() : "?");
const pct = (n?: number) => (typeof n === "number" && isFinite(n) ? Math.round(n) + "%" : "?");

//////////////////////////
// Scrapers
//////////////////////////

type ResourceBlock = {
  current?: number;
  perHour?: number;
};
type ResourcesSnapshot = {
  wood?: ResourceBlock;
  clay?: ResourceBlock;
  iron?: ResourceBlock;
  crop?: ResourceBlock & { net?: number };
  capacity?: { warehouse?: number; granary?: number };
};

function scrapeResources(): ResourcesSnapshot {
  // Current amounts (global, top bar)
  const w = pickNum(SEL.wood);
  const c = pickNum(SEL.clay);
  const i = pickNum(SEL.iron);
  const g = pickNum(SEL.crop);

  // Capacities
  const capW = pickNum(SEL.warehouseCap);
  const capG = pickNum(SEL.granaryCap);

  // Per-hour (try dorf1 widget if present; fall back to null)
  const prodBox = document.querySelector(SEL.prodBox);
  const per = { w: undefined as number | undefined, c: undefined as number | undefined, i: undefined as number | undefined, g: undefined as number | undefined };
  if (prodBox) {
    per.w = parseNum(document.querySelector(SEL.prodWood[0])?.textContent || document.querySelector(SEL.prodWood[1])?.textContent || undefined);
    per.c = parseNum(document.querySelector(SEL.prodClay[0])?.textContent || document.querySelector(SEL.prodClay[1])?.textContent || undefined);
    per.i = parseNum(document.querySelector(SEL.prodIron[0])?.textContent || document.querySelector(SEL.prodIron[1])?.textContent || undefined);
    per.g = parseNum(document.querySelector(SEL.prodCrop[0])?.textContent || document.querySelector(SEL.prodCrop[1])?.textContent || undefined);
  }

  return {
    wood: { current: w.value, perHour: per.w },
    clay: { current: c.value, perHour: per.c },
    iron: { current: i.value, perHour: per.i },
    crop: { current: g.value, perHour: per.g, net: undefined }, // net crop is trickier; can add later
    capacity: { warehouse: capW.value, granary: capG.value },
  };
}

type BuildItem = { name?: string; timeText?: string };
function scrapeBuildQueue(): BuildItem[] {
  const rows = Array.from(document.querySelectorAll(SEL.buildRow));
  if (!rows.length) return [];
  const out: BuildItem[] = [];
  for (const row of rows.slice(0, 3)) {
    let name: string | undefined;
    let timeText: string | undefined;

    for (const s of SEL.buildName) {
      const el = row.querySelector(s);
      const raw = el?.textContent?.trim();
      if (raw) {
        name = raw.replace(/\s+/g, " ");
        break;
      }
    }
    for (const s of SEL.buildTime) {
      const el = row.querySelector(s);
      const raw = el?.textContent?.trim();
      if (raw) {
        timeText = raw.replace(/\s+/g, " ");
        break;
      }
    }
    out.push({ name, timeText });
  }
  return out;
}

type HeroSnapshot = {
  healthPct?: number;
  xp?: number;
  speedFieldsPerHour?: number;
};
function scrapeHero(): HeroSnapshot | undefined {
  if (!location.pathname.includes("/hero/")) return undefined;

  // Try progress bars (attributes page)
  const rows = Array.from(document.querySelectorAll(SEL.heroStatRow));
  const hero: HeroSnapshot = {};
  for (const r of rows) {
    const label = r.querySelector(SEL.heroStatName)?.textContent?.trim()?.toLowerCase();
    const valueText = r.querySelector(SEL.heroStatValue)?.textContent?.trim();
    const primaryFill = (r.querySelector(SEL.heroFillPrimary) as HTMLElement | null)?.style.width;
    const secondaryFill = (r.querySelector(SEL.heroFillSecondary) as HTMLElement | null)?.style.width;

    if (!label) continue;

    if (label.includes("health")) {
      const p = parseNum(primaryFill || secondaryFill || valueText || "");
      hero.healthPct = p;
    } else if (label.includes("experience")) {
      hero.xp = parseNum(valueText);
    } else if (label.includes("speed")) {
      hero.speedFieldsPerHour = parseNum(valueText);
    }
  }

  // Fallbacks: try to parse visible speed line “34 fields/hour”
  if (hero.speedFieldsPerHour == null) {
    const speedLine = Array.from(document.querySelectorAll(".stats, .content")).map((n) => n.textContent || "").join(" ");
    const maybe = speedLine.match(/(\d+)\s*fields?\/\s*hour/i);
    if (maybe) hero.speedFieldsPerHour = Number(maybe[1]);
  }

  // If no stats found at all, return undefined
  if (hero.healthPct == null && hero.xp == null && hero.speedFieldsPerHour == null) return undefined;
  return hero;
}

type RallySnapshot = {
  incomingCount?: number;
};
function scrapeRally(): RallySnapshot | undefined {
  const isRally = location.search.toLowerCase().includes("gid=16") || location.pathname.toLowerCase().includes("rally");
  if (!isRally) return undefined;
  const wrap = document.querySelector(SEL.rallyIncomingTable) || document.querySelector("#build");
  if (!wrap) return { incomingCount: 0 };
  // Count rows that look like incoming troop entries
  const rows = wrap.querySelectorAll("tr, .troop_details, .incomings .row");
  return { incomingCount: rows.length || undefined };
}

//////////////////////////
// Snapshot + HUD render
//////////////////////////

type Snapshot = {
  ts: number;
  page: PageKind;
  url: string;
  resources: ResourcesSnapshot;
  buildQueue?: BuildItem[];
  hero?: HeroSnapshot;
  rally?: RallySnapshot;
  version: string;
};

function buildSnapshot(): Snapshot {
  const page = identifyPage(location.pathname + location.search);
  const resources = scrapeResources();
  const buildQueue = scrapeBuildQueue();
  const hero = scrapeHero();
  const rally = scrapeRally();

  return {
    ts: Date.now(),
    page,
    url: location.href,
    resources,
    buildQueue: buildQueue && buildQueue.length ? buildQueue : undefined,
    hero,
    rally,
    version: VERSION,
  };
}

function renderHUD(s: Snapshot) {
  const hud = ensureHUD();

  const r = s.resources || {};
  const w = r.wood?.current, c = r.clay?.current, i = r.iron?.current, g = r.crop?.current;
  const capW = r.capacity?.warehouse, capG = r.capacity?.granary;

  let line1 =
    `TLA v${VERSION} — page: ${s.page}\n` +
    `W:${fmt(w)}  C:${fmt(c)}  I:${fmt(i)}  G:${fmt(g)}  | Cap W:${fmt(capW)} G:${fmt(capG)}`;

  const parts: string[] = [line1];

  if (s.hero) {
    parts.push(`Hero HP:${pct(s.hero.healthPct)}  XP:${fmt(s.hero.xp)}  Spd:${fmt(s.hero.speedFieldsPerHour)} f/h`);
  }

  if (s.buildQueue && s.buildQueue.length) {
    const first = s.buildQueue[0];
    parts.push(`Build: ${first.name || "?"} (${first.timeText || "?"})`);
  } else if (s.page === "dorf2") {
    parts.push(`Build: (idle)`);
  }

  if (s.rally?.incomingCount != null) {
    parts.push(`Rally incoming rows: ${s.rally.incomingCount}`);
  }

  hud.textContent = parts.join("\n");
}

function saveSnapshot(s: Snapshot) {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    const arr: Snapshot[] = raw ? JSON.parse(raw) : [];
    arr.push(s);
    while (arr.length > SNAPSHOT_MAX) arr.shift();
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(arr));
  } catch (e) {
    // Swallow; localStorage might be full or blocked.
    console.warn("[TLA] snapshot save failed", e);
  }
}

//////////////////////////
// Main loop
//////////////////////////

function refresh() {
  const s = buildSnapshot();
  renderHUD(s);
  // Optional: broadcast for devtools/logging tools
  window.postMessage({ __tla: true, type: "SNAPSHOT", payload: s }, "*");
  // Debug console (comment out if noisy)
  // console.debug("[TLA]", s);
}

function persist() {
  const s = buildSnapshot();
  saveSnapshot(s);
  // Keep HUD fresh as well on snapshot ticks
  renderHUD(s);
}

// Start timers
function startLoops() {
  if (hudTimer) clearInterval(hudTimer);
  if (snapshotTimer) clearInterval(snapshotTimer);

  refresh();
  persist();

  hudTimer = window.setInterval(refresh, TICK_MS);
  snapshotTimer = window.setInterval(persist, SNAPSHOT_MS);
}

// Re-render on DOM mutations (debounced)
const mo = new MutationObserver(debounce(refresh, 250));
mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true });

// Kick off
startLoops();

// Expose a tiny debug helper in console
//   window.TLA?.dump() -> prints latest snapshot
declare global {
  interface Window {
    TLA?: any;
  }
}
window.TLA = {
  version: VERSION,
  dump() {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      console.log(`[TLA] snapshots (${arr.length})`, arr[arr.length - 1]);
      return arr[arr.length - 1];
    } catch {
      console.log("[TLA] no snapshots");
      return null;
    }
  },
  clear() {
    localStorage.removeItem(SNAPSHOT_KEY);
    console.log("[TLA] snapshots cleared");
  },
};
