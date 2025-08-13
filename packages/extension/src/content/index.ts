import { ensureBar } from "../overlay";

const DEBOUNCE_MS = 300;
let timer: number | undefined;

/** Identify current page by URL */
function identifyPage(path: string) {
  const p = path.toLowerCase();
  if (p.includes("dorf1")) return "dorf1";
  if (p.includes("dorf2") || p.includes("build.php")) return "build";
  if (p.includes("hero.php")) return "hero";
  if (p.includes("gid=16")) return "rally";
  if (p.includes("gid=17")) return "market";
  return "other";
}

/** Safe text getter */
function text(q?: string): string | undefined {
  return q ? document.querySelector(q)?.textContent ?? undefined : undefined;
}

/** Locale-tolerant number parser (handles non-breaking spaces, thousands separators) */
function num(s?: string | null): number | undefined {
  if (!s) return undefined;
  const cleaned = s
    .replace(/\u00A0/g, " ")     // nbsp
    .replace(/[.’]/g, "")        // odd thousands punctuation
    .replace(/(\d)[,\s](?=\d{3}\b)/g, "$1"); // strip thousand separators
  const m = cleaned.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
}

/** Minimal EN selectors for dorf1 */
const SEL = {
  dorf1: {
    resources: {
      wood: { value: "#l1 .value", perHour: "#l1 .prod" },
      clay: { value: "#l2 .value", perHour: "#l2 .prod" },
      iron: { value: "#l3 .value", perHour: "#l3 .prod" },
      crop: { value: "#l4 .value", perHour: "#l4 .prod", net: "#stockBar .res .crop .balance" }
    },
    capacity: {
      warehouse: "#stockBar .warehouse",
      granary: "#stockBar .granary"
    }
  }
} as const;

/** Scrape dorf1 values */
function scrapeDorf1() {
  const sel = SEL.dorf1;

  const wood = num(text(sel.resources.wood.value));
  const clay = num(text(sel.resources.clay.value));
  const iron = num(text(sel.resources.iron.value));
  const crop = num(text(sel.resources.crop.value));

  const wph  = num(text(sel.resources.wood.perHour));
  const cph  = num(text(sel.resources.clay.perHour));
  const iph  = num(text(sel.resources.iron.perHour));
  const gph  = num(text(sel.resources.crop.perHour));
  const net  = num(text(sel.resources.crop.net));

  const wh   = num(text(sel.capacity.warehouse));
  const gr   = num(text(sel.capacity.granary));

  if ([wood, clay, iron, crop].some(v => v == null)) return undefined;

  return {
    resources: {
      wood: { current: wood, perHour: wph },
      clay: { current: clay, perHour: cph },
      iron: { current: iron, perHour: iph },
      crop: { current: crop, perHour: gph, net }
    },
    capacity: { warehouse: wh, granary: gr }
  };
}

/** Render HUD */
function render(payload: any, page: string) {
  const bar = ensureBar();
  if (page !== "dorf1" || !payload?.resources) {
    bar.textContent = `TLA active — page: ${page}`;
    return;
  }
  const r = payload.resources, cap = payload.capacity || {};
  bar.textContent =
    `W:${r.wood?.current ?? "?"} (${r.wood?.perHour ?? "?"}/h)  ` +
    `C:${r.clay?.current ?? "?"} (${r.clay?.perHour ?? "?"}/h)  ` +
    `I:${r.iron?.current ?? "?"} (${r.iron?.perHour ?? "?"}/h)  ` +
    `G:${r.crop?.current ?? "?"} (${r.crop?.perHour ?? "?"}/h, net:${r.crop?.net ?? "?"})  ` +
    `| Cap W:${cap.warehouse ?? "?"} G:${cap.granary ?? "?"}`;
}

/** Main tick */
function tick() {
  const page = identifyPage(location.pathname + location.search);
  let payload: any | undefined;
  if (page === "dorf1") payload = scrapeDorf1();
  render(payload, page);
  window.postMessage({ __tla: true, type: "SNAPSHOT/UPSERT", page, ts: Date.now(), payload }, "*");
  console.debug("[TLA] tick", { page, payloadPresent: !!payload });
}

function onMut() {
  if (timer) clearTimeout(timer);
  // @ts-ignore
  timer = setTimeout(tick, DEBOUNCE_MS);
}

const observer = new MutationObserver(onMut);
observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
tick();
