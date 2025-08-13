
import { ensureBar } from "../overlay";
import registry from "./selector-registry.en.json";

const DEBOUNCE_MS = 300;
let timer: number | undefined;

function identifyPage(path: string) {
  if (path.includes("dorf1")) return "dorf1";
  if (path.includes("dorf2")) return "dorf2";
  if (path.includes("build.php")) return "build";
  if (path.includes("hero.php")) return "hero";
  if (path.includes("gid=16")) return "rally";
  if (path.includes("gid=17")) return "market";
  return "other";
}

function parseNumber(raw?: string|null): number | undefined {
  if (!raw) return undefined;
  const s = raw.replace(/\u00A0/g, ' ').replace(/\./g, '').replace(/,/, '.');
  const m = s.match(/-?[\d.]+/);
  const n = m ? Number(m[0]) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function scrapeDorf1(doc: Document) {
  const sel: any = registry.pages.dorf1;
  const t = (q?: string) => (q ? doc.querySelector(q)?.textContent : undefined);

  const wood = parseNumber(t(sel.resources.wood.value));
  const clay = parseNumber(t(sel.resources.clay.value));
  const iron = parseNumber(t(sel.resources.iron.value));
  const crop = parseNumber(t(sel.resources.crop.value));
  const woodPH = parseNumber(t(sel.resources.wood.perHour));
  const clayPH = parseNumber(t(sel.resources.clay.perHour));
  const ironPH = parseNumber(t(sel.resources.iron.perHour));
  const cropPH = parseNumber(t(sel.resources.crop.perHour));
  const cropNet = parseNumber(t(sel.resources.crop.net));
  const wh = parseNumber(t(sel.capacity.warehouse));
  const gr = parseNumber(t(sel.capacity.granary));

  if (wood==null || clay==null || iron==null || crop==null) return undefined;
  return {
    resources: {
      wood: { current: wood, perHour: woodPH },
      clay: { current: clay, perHour: clayPH },
      iron: { current: iron, perHour: ironPH },
      crop: { current: crop, perHour: cropPH, net: cropNet },
    },
    capacity: { warehouse: wh, granary: gr }
  };
}

function tick() {
  const page = identifyPage(location.pathname + location.search);
  let payload: any | undefined;
  if (page === "dorf1") payload = scrapeDorf1(document);
  if (payload) {
    window.postMessage({ __tla: true, type: "SNAPSHOT/UPSERT", page, ts: Date.now(), payload }, "*");
    const bar = ensureBar();
    const r = payload?.resources;
    if (r) bar.textContent = `W:${r.wood?.current} C:${r.clay?.current} I:${r.iron?.current} G:${r.crop?.current} | Cap W:${payload.capacity?.warehouse} G:${payload.capacity?.granary}`;
  }
}

function onMut() {
  if (timer) clearTimeout(timer);
  // @ts-ignore
  timer = setTimeout(tick, DEBOUNCE_MS);
}

const observer = new MutationObserver(onMut);
observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
tick();
