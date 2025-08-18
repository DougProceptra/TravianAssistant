import { ensureBar } from "../overlay";
import registry from "./selector-registry.en.json";

/* ───────────────────────────
   Utilities
   ─────────────────────────── */
const DEBOUNCE_MS = 300;
let timer: number | undefined;

function identifyPage(path: string) {
  const p = path.toLowerCase();
  if (p.includes("dorf1")) return "dorf1";
  if (p.includes("dorf2") || p.includes("build.php")) return "dorf2";
  if (p.includes("/hero/") || p.includes("hero.php")) return "hero";
  if (p.includes("gid=16")) return "rally";
  if (p.includes("gid=17")) return "market";
  return "other";
}

function $text(sel?: string | null, root: ParentNode = document): string | undefined {
  if (!sel) return undefined;
  return root.querySelector(sel)?.textContent ?? undefined;
}

function toNum(raw?: string | null): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/[\u00A0\u202F\u200E\u200F\u202A-\u202E]/g, "")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const match = cleaned.match(/-?\d+(?:[.,]\d+)?/g);
  if (!match) return undefined;
  const token = match[match.length - 1].replace(",", "");
  const n = Number(token);
  return Number.isFinite(n) ? n : undefined;
}
const fmt = (n?: number) => (typeof n === "number" && isFinite(n) ? n.toLocaleString() : "?");

/* ───────────────────────────
   dorf1: resources + capacity
   ─────────────────────────── */
function scrapeDorf1(doc: Document) {
  const sel: any = (registry as any).pages?.dorf1;
  if (!sel) return undefined;

  const wood = toNum($text(sel.resources.wood.value, doc));
  const clay = toNum($text(sel.resources.clay.value, doc));
  const iron = toNum($text(sel.resources.iron.value, doc));
  const crop = toNum($text(sel.resources.crop.value, doc));
  const wh = toNum($text(sel.capacity.warehouse, doc));
  const gr = toNum($text(sel.capacity.granary, doc));

  if ([wood, clay, iron, crop].some(v => v == null)) return undefined;

  return {
    resources: {
      wood: { current: wood },
      clay: { current: clay },
      iron: { current: iron },
      crop: { current: crop },
    },
    capacity: { warehouse: wh, granary: gr },
  };
}

/* ───────────────────────────
   dorf2: build queue
   ─────────────────────────── */

type BuildItem = { name?: string; level?: number; timeText?: string; finishesAt?: number };

const BUILD_SEL = {
  row: ".buildingList li, .underConstruction li, .buildingList .slotRow, .buildingList .contract",
  name: [".name", ".title", ".building", ".desc", ".text", ".slot", ".contract .value"],
  time: [".buildDuration", ".duration", ".time", ".finishesAt", ".timer"],
} as const;

function pickFirst(root: Element, selectors: readonly string[]): string | undefined {
  for (const s of selectors) {
    const el = root.querySelector(s);
    const val = el?.textContent?.trim();
    if (val) return val;
  }
  return undefined;
}

function splitNameLevel(raw?: string) {
  if (!raw) return {};
  const m = raw.match(/^(.*?)(?:\s+Level\s+(\d+))?$/i);
  if (!m) return { name: raw };
  const name = m[1].trim();
  const level = m[2] ? Number(m[2]) : undefined;
  return { name, level };
}

function parseTimeText(raw?: string): { timeText?: string; finishesAt?: number } {
  if (!raw) return {};
  const timeMatch = raw.match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/);
  const timeText = timeMatch?.[1];
  let finishesAt: number | undefined;
  const atMatch = raw.match(/\b(?:at|done\s+at)\s+(\d{1,2}:\d{2})(?::\d{2})?\b/i);
  if (atMatch) {
    const [hh, mm] = atMatch[1].split(":").map(n => Number(n));
    const d = new Date();
    d.setSeconds(0, 0);
    d.setHours(hh, mm, 0, 0);
    if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
    finishesAt = d.getTime();
  }
  return { timeText, finishesAt };
}

function scrapeBuildQueue(doc: Document): { items: BuildItem[] } | undefined {
  const rows = Array.from(doc.querySelectorAll(BUILD_SEL.row));
  if (!rows.length) return undefined;

  const items: BuildItem[] = [];

  for (const row of rows) {
    const rawName = pickFirst(row, BUILD_SEL.name);
    const rawTime = pickFirst(row, BUILD_SEL.time);
    if (!rawName && !rawTime) continue;

    const { name, level } = splitNameLevel(rawName);
    const { timeText, finishesAt } = parseTimeText(rawTime);
    items.push({ name, level, timeText, finishesAt });
  }

  return items.length ? { items } : undefined;
}

/* ───────────────────────────
   Master Builder (floating panel)
   ─────────────────────────── */
function scrapeMasterBuilder(doc: Document): { items: BuildItem[] } | undefined {
  // Find any panel that contains the phrase "Master builder"
  const candidates = Array.from(doc.querySelectorAll("div, section, article"))
    .filter(el => (el.textContent || "").toLowerCase().includes("master builder"));
  if (!candidates.length) {
    // Fallback: scan for lines that look like "Something Level N  Start of construction in 00:.."
    const lines = Array.from(doc.querySelectorAll("li, .contract, .slotRow, p, .white, .content"))
      .map(el => (el.textContent || "").replace(/\s+/g, " ").trim())
      .filter(t => /level\s+\d+/i.test(t) && /start of construction/i.test(t));
    if (!lines.length) return undefined;
    const items = lines.map(t => {
      const nameMatch = t.match(/^(.*?level\s+\d+)/i)?.[1] || t;
      const lvMatch = t.match(/level\s+(\d+)/i);
      const timeBits = parseTimeText(t);
      return {
        name: (nameMatch || "").replace(/\blevel\s+\d+.*$/i, "").trim() || undefined,
        level: lvMatch ? Number(lvMatch[1]) : undefined,
        timeText: timeBits.timeText,
        finishesAt: timeBits.finishesAt,
      } as BuildItem;
    });
    return items.length ? { items } : undefined;
  }

  // Parse lines inside the first matching panel
  const panel = candidates[0];
  const lines = Array.from(panel.querySelectorAll("li, .contract, .slotRow, p, div"))
    .map(el => (el.textContent || "").replace(/\s+/g, " ").trim())
    .filter(t => t && /level\s+\d+/i.test(t));
  const items: BuildItem[] = [];
  for (const t of lines) {
    const lvMatch = t.match(/level\s+(\d+)/i);
    const nameRaw = t.replace(/start of construction.*$/i, "");
    const baseName = nameRaw.replace(/\blevel\s+\d+.*$/i, "").trim();
    const timeBits = parseTimeText(t);
    items.push({
      name: baseName || undefined,
      level: lvMatch ? Number(lvMatch[1]) : undefined,
      timeText: timeBits.timeText,
      finishesAt: timeBits.finishesAt,
    });
  }
  return items.length ? { items } : undefined;
}

/* ───────────────────────────
   Troop movements (dorf1)
   ─────────────────────────── */
type MovementSummary = { count?: number; next?: string };

function extractTimersFrom(el: Element): string[] {
  // Collect any timer-like strings
  const txt = (el.textContent || "").replace(/\s+/g, " ");
  const times = Array.from(txt.matchAll(/\b\d{1,2}:\d{2}:\d{2}\b|\b\d{1,2}:\d{2}\b/g)).map(m => m[0]);
  // plus explicit elements commonly used for countdowns
  const q = el.querySelectorAll(".timer, .countdown, .dur, .duration, .in, .time");
  for (const t of Array.from(q)) {
    const v = (t.textContent || "").trim();
    if (v && !times.includes(v)) times.push(v);
  }
  return times;
}

function summarizeBlock(labelEl: Element): MovementSummary {
  // The block is usually a parent/sibling section of the label
  let block: Element | null = labelEl.closest("div, section");
  if (!block || block.textContent === labelEl.textContent) {
    block = labelEl.parentElement;
  }
  if (!block) return {};
  // Count items (li/rows) and grab the nearest/first timer
  const rows = block.querySelectorAll("li, tr, .movement, .row");
  const count = rows.length || undefined;
  const timers = extractTimersFrom(block);
  const next = timers.length ? timers[0] : undefined;
  return { count, next };
}

function scrapeMovements(doc: Document): { incoming?: MovementSummary; outgoing?: MovementSummary; adventures?: MovementSummary } | undefined {
  const allEls: Element[] = Array.from(doc.querySelectorAll("div, section, h3, h4, span, strong"));
  let incoming: MovementSummary | undefined;
  let outgoing: MovementSummary | undefined;
  let adventures: MovementSummary | undefined;

  for (const el of allEls) {
    const t = (el.textContent || "").toLowerCase().trim();
    if (!t) continue;
    if (!incoming && /incoming\s+troops/.test(t)) incoming = summarizeBlock(el);
    else if (!outgoing && /outgoing\s+troops/.test(t)) outgoing = summarizeBlock(el);
    else if (!adventures && /adventure/.test(t)) adventures = summarizeBlock(el);
  }

  if (!incoming && !outgoing && !adventures) return undefined;
  return { incoming, outgoing, adventures };
}

/* ───────────────────────────
   Hero scraping (all tabs)
   ─────────────────────────── */
const HERO_TOPBAR = {
  gold:   [".ajaxReplaceableGoldAmount", "#goldAmount", ".topBar .gold .value", "#gs .gold .value"],
  silver: [".ajaxReplaceableSilverAmount", "#silverAmount", ".topBar .silver .value", "#gs .silver .value"],
} as const;

function pickNum(selectors: readonly string[]): { value?: number; used?: string } {
  for (const s of selectors) {
    const v = toNum($text(s));
    if (v != null) return { value: v, used: s };
  }
  return {};
}

function percentFromProgressBar(pb: Element | null): number | undefined {
  if (!pb) return undefined;
  const valText = ($text(".value", pb as unknown as ParentNode) ?? "").trim();
  const fromText = toNum(valText);
  if (typeof fromText === "number") return Math.max(0, Math.min(100, fromText));
  const fill =
    (pb.querySelector(".filling.primary") as HTMLElement | null) ||
    (pb.querySelector(".filling.secondary") as HTMLElement | null);
  const style = fill?.getAttribute("style") || "";
  const m = style.match(/width:\s*([0-9.]+)%/i);
  return m ? Math.max(0, Math.min(100, Number(m[1]))) : undefined;
}

function scrapeHeroItems(doc: Document) {
  const equippedSel = ".heroEquipment .slot, .heroItems .slot, .equipment .slot";
  const invSel = ".inventory .slot, .backpack .slot, .items .slot";
  const readName = (el: Element) =>
    (el.querySelector("img")?.getAttribute("alt") ||
      el.querySelector("img")?.getAttribute("title") ||
      el.getAttribute("title") ||
      el.textContent ||
      "")
      .trim()
      .replace(/\s+/g, " ");

  const equipped: string[] = [];
  for (const slot of Array.from(doc.querySelectorAll(equippedSel))) {
    const name = readName(slot);
    if (name) equipped.push(name);
  }

  const inventory: string[] = [];
  for (const slot of Array.from(doc.querySelectorAll(invSel))) {
    const name = readName(slot);
    if (name) inventory.push(name);
  }

  return { equipped, inventory };
}

function scrapeHeroAttributes(doc: Document) {
  const bars = Array.from(doc.querySelectorAll(".stats .progressBar, .content2 .progressBar"));

  let healthPct: number | undefined;
  let xpPct: number | undefined;
  let speedText: string | undefined;

  for (const pb of bars) {
    const label = ($text(".name", pb as unknown as ParentNode) || "").toLowerCase().trim();
    if (label.includes("health")) healthPct ??= percentFromProgressBar(pb);
    else if (label.includes("experience")) xpPct ??= percentFromProgressBar(pb);
    else if (label.includes("speed")) {
      const all = (pb.textContent || "").replace(/\s+/g, " ").trim();
      speedText ??= all.replace(/^\s*speed\s*:?/i, "").trim();
    }
  }

  const bonusBox = doc.querySelector(".attributes, .attributeBox, .attributeView, .attributesBox");
  const readBonus = (label: string) => {
    if (!bonusBox) return undefined;
    const row = Array.from(bonusBox.querySelectorAll("tr, .row, .attribute, li")).find(r =>
      (r.textContent || "").toLowerCase().includes(label)
    );
    if (!row) return undefined;
    return (row.textContent || "").replace(/\s+/g, " ").trim();
  };

  const bonuses = {
    fighting: readBonus("fighting"),
    off: readBonus("off"),
    def: readBonus("def"),
    resources: readBonus("resource"),
  };

  return { healthPct, xpPct, speedText, bonuses };
}

function scrapeHero(doc: Document) {
  const gold = pickNum(HERO_TOPBAR.gold);
  const silver = pickNum(HERO_TOPBAR.silver);

  const path = location.pathname.toLowerCase();
  let view: "inventory" | "attributes" | "appearance" | "other" = "other";
  if (path.includes("/hero/inventory")) view = "inventory";
  else if (path.includes("/hero/attributes")) view = "attributes";
  else if (path.includes("/hero/appearance")) view = "appearance";

  const out: any = {
    view,
    gold: gold.value,
    silver: silver.value,
    _used: { goldSel: gold.used, silverSel: silver.used },
  };

  if (view === "inventory") {
    Object.assign(out, scrapeHeroItems(doc));
  } else if (view === "attributes") {
    Object.assign(out, scrapeHeroAttributes(doc));
  } else if (view === "appearance") {
    out.appearance = { active: true };
  }

  const meaningful =
    out.gold != null ||
    out.silver != null ||
    out.healthPct != null ||
    out.xpPct != null ||
    (Array.isArray(out.equipped) && out.equipped.length) ||
    (Array.isArray(out.inventory) && out.inventory.length) ||
    out.speedText;

  return meaningful ? out : undefined;
}

/* ───────────────────────────
   Snapshot + HUD
   ─────────────────────────── */
function scrapeSnapshot(page: string) {
  const out: any = { page };

  if (page === "dorf1") {
    const d1 = scrapeDorf1(document);
    if (d1) Object.assign(out, d1);

    const mv = scrapeMovements(document);
    if (mv) out.movements = mv;

    const mb = scrapeMasterBuilder(document);
    if (mb) out.masterBuilder = mb;
  }

  if (page === "dorf2") {
    const q = scrapeBuildQueue(document);
    if (q) out.build = q;

    const mb = scrapeMasterBuilder(document);
    if (mb) out.masterBuilder = mb;
  }

  if (page === "hero") {
    out.hero = scrapeHero(document);
  }

  return out;
}

function render(payload: any, page: string) {
  const bar = ensureBar();

  if (page === "dorf1" && payload?.resources) {
    const r = payload.resources;
    const cap = payload.capacity || {};
    const mv = payload.movements || {};
    const inStr = mv.incoming?.count != null ? ` in:${mv.incoming.count}` : "";
    const outStr = mv.outgoing?.count != null ? ` out:${mv.outgoing.count}` : "";
    const nextStr = mv.incoming?.next || mv.outgoing?.next ? ` next ${mv.incoming?.next || mv.outgoing?.next}` : "";
    bar.textContent =
      `W:${fmt(r.wood?.current)}  ` +
      `C:${fmt(r.clay?.current)}  ` +
      `I:${fmt(r.iron?.current)}  ` +
      `G:${fmt(r.crop?.current)}  ` +
      `| Cap W:${fmt(cap.warehouse)} G:${fmt(cap.granary)}  ` +
      `${inStr}${outStr}${nextStr}  (dorf1)`;
    return;
  }

  if (page === "dorf2") {
    const items: BuildItem[] = payload?.build?.items || [];
    const next = items[0]?.timeText || (items.length ? "…" : "idle");

    // If Master Builder also present, show the soonest "start in" from that list as well
    const mbItems: BuildItem[] = payload?.masterBuilder?.items || [];
    const mbNext = mbItems[0]?.timeText;

    bar.textContent = `Q:${items.length} next ${next}${mbNext ? ` | MB ${mbNext}` : ""}  (dorf2)`;
    return;
  }

  if (page === "hero") {
    const h = payload?.hero || {};
    const bits: string[] = [];
    bits.push(`Au:${fmt(h.gold)}`, `Ag:${fmt(h.silver)}`);
    bits.push(`♥${typeof h.healthPct === "number" ? `${h.healthPct}%` : "?"}`);
    bits.push(`XP:${typeof h.xpPct === "number" ? `${h.xpPct}%` : "?"}`);
    if (h.speedText) bits.push(`spd:${h.speedText}`);
    if (Array.isArray(h.equipped) && h.equipped.length) bits.push(`eq:${h.equipped.length}`);
    if (Array.isArray(h.inventory) && h.inventory.length) bits.push(`inv:${h.inventory.length}`);
    bar.textContent = `${bits.join("  ")}  (hero:${h.view || "?"})`;
    return;
  }

  bar.textContent = `TLA active — page: ${page}`;
}

/* ───────────────────────────
   Loop
   ─────────────────────────── */
function tick() {
  const page = identifyPage(location.pathname + location.search);
  const payload = scrapeSnapshot(page);

  window.postMessage(
    { __tla: true, type: "SNAPSHOT/UPSERT", page, ts: Date.now(), payload },
    "*"
  );

  console.debug("[TLA] snapshot", payload);
  render(payload, page);
}

function onMut() {
  if (timer) clearTimeout(timer);
  // @ts-ignore
  timer = setTimeout(tick, DEBOUNCE_MS);
}

const observer = new MutationObserver(onMut);
observer.observe(document.documentElement, {
  subtree: true,
  childList: true,
  characterData: true,
});

tick();
