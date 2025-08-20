// packages/extension/src/content/index.ts
// Travian Legends Assistant - Content Script (v0.2.8)
// - 5s scrape cadence (paused when tab hidden)
// - Safe selectors w/ per-field "used selector" + errors
// - Minimal HUD with version, heartbeat, page, ✔︎/✖︎ groups, "Force scrape", "Copy JSON"
// - AI Integration with Claude API
// - Global debug: window.TLA.debug()
// NOTE: This file is self-contained to avoid import mismatches.

(() => {
  const VERSION = "0.2.8"; // Keep in sync with manifest.json
  const LOOP_MS = 5000;

  // ---------- Utils ----------
  const $ = (sel: string, root: ParentNode = document) =>
    root.querySelector<HTMLElement>(sel) || null;
  const $all = (sel: string, root: ParentNode = document) =>
    Array.from(root.querySelectorAll<HTMLElement>(sel));

  const txt = (el: Element | null | undefined) =>
    (el?.textContent || "").trim() || undefined;

  const toNum = (s?: string) => {
    if (!s) return undefined;
    // Normalize numbers like 12,345 or 12 345 or "‭3,445‬"
    const cleaned = s.replace(/[^\d.,]/g, "").replace(/\u202F|\u00A0/g, "");
    // prefer last number group, then strip commas
    const m = cleaned.match(/[\d.,]+/g);
    if (!m) return undefined;
    const last = m[m.length - 1].replace(/,/g, "");
    const n = Number(last);
    return isFinite(n) ? n : undefined;
  };

  function pick(selectors: string[], root: ParentNode = document): { value?: string; sel?: string } {
    for (const s of selectors) {
      const el = $(s, root);
      const v = txt(el);
      if (v) return { value: v, sel: s };
    }
    return {};
  }

  function pickNum(selectors: string[], root: ParentNode = document) {
    const p = pick(selectors, root);
    return { value: toNum(p.value), sel: p.sel };
  }

  function nowStamp() {
    const d = new Date();
    const hh = d.getHours().toString().padStart(2, "0");
    const mm = d.getMinutes().toString().padStart(2, "0");
    const ss = d.getSeconds().toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function identifyPage(path: string) {
    const p = path.toLowerCase();
    if (p.includes("dorf1")) return "dorf1";
    if (p.includes("dorf2")) return "dorf2";
    if (p.includes("/hero/inventory")) return "hero_inventory";
    if (p.includes("/hero/attributes")) return "hero_attributes";
    if (p.includes("/hero/appearance")) return "hero_appearance";
    if (p.includes("gid=16")) return "rallypoint"; // Rally Point (overview tab)
    return "other";
  }

  // ---------- Selectors ----------
  const SEL = {
    // Top bar resources (multiple fallbacks; works on dorf1/dorf2/others)
    res: {
      wood: [
        "#l1 .value", "#l1.value", ".r1 .value",
        "#stockBar .r1 .value", "#stockBar .wood .value"
      ],
      clay: [
        "#l2 .value", "#l2.value", ".r2 .value",
        "#stockBar .r2 .value", "#stockBar .clay .value"
      ],
      iron: [
        "#l3 .value", "#l3.value", ".r3 .value",
        "#stockBar .r3 .value", "#stockBar .iron .value"
      ],
      crop: [
        "#l4 .value", "#l4.value", ".r4 .value",
        "#stockBar .r4 .value", "#stockBar .crop .value"
      ],
      cap: [
        "#stockBar .warehouse .capacity .value",
        "#stockBar .warehouse .value", ".warehouse .capacity .value",
      ],
      gran: [
        "#stockBar .granary .capacity .value",
        "#stockBar .granary .value", ".granary .capacity .value",
      ],
      gold: [
        ".ajaxReplaceableGoldAmount", "#topBar .gold .value", ".gold .value"
      ],
      silver: [
        ".ajaxReplaceableSilverAmount", "#topBar .silver .value", ".silver .value"
      ],
    },

    // Build queue (dorf1/dorf2 center panel)
    build: {
      rows: ".buildingList li, .boxes.buildingList li, .buildingList .build .entry, .buildingList .active .entry",
      name: [".name", ".title", ".building", ".desc", ".text", ".slot"],
      timer: [".contract .value", ".finishingTime .value", ".timer", ".countdown"],
    },

    // Hero attributes page
    heroAttr: {
      box: ".contentNavi .herobox, #content .herobox, .contentNavi + .content .herobox, .heroAttributesBox, #herobox", // broad
      statsRow: ".stats .progressBar",
      // within a stats row:
      rowLabel: ".name",
      rowValue: ".value",
      rowPrimaryFill: ".bar .filling.primary",
      rowSecondaryFill: ".bar .filling.secondary",
      speedText: ".value, .speedValue, .fieldsPerHour",
    },

    // Rally point (incoming overview)
    rally: {
      table: "#overview .troop_details, #build .overview, .troop_movements",
      headerRow: ".movements .thead, .last tr.troop_info, .thead",
      // Fallback: count of blocks
      blocks: ".movements .tr, .movements .tbody .tr, .incoming .tr, .incoming .mov",
    },
  } as const;

  // ---------- Scrapers ----------
  type Used = Record<string, string | undefined>;
  type GroupResult<T> = { ok: boolean; used: Used; data: T; errors?: string[] };

  function scrapeResources(): GroupResult<{
    wood?: number; clay?: number; iron?: number; crop?: number;
    cap?: number; gran?: number; gold?: number; silver?: number;
  }> {
    const used: Used = {};
    const errors: string[] = [];
    const w = pickNum(SEL.res.wood); used.wood = w.sel;
    const c = pickNum(SEL.res.clay); used.clay = c.sel;
    const i = pickNum(SEL.res.iron); used.iron = i.sel;
    const r = pickNum(SEL.res.crop); used.crop = r.sel;
    const cap = pickNum(SEL.res.cap); used.cap = cap.sel;
    const gran = pickNum(SEL.res.gran); used.gran = gran.sel;
    const gold = pickNum(SEL.res.gold); used.gold = gold.sel;
    const silver = pickNum(SEL.res.silver); used.silver = silver.sel;

    const data = {
      wood: w.value, clay: c.value, iron: i.value, crop: r.value,
      cap: cap.value, gran: gran.value, gold: gold.value, silver: silver.value,
    };
    Object.entries(data).forEach(([k, v]) => { if (typeof v !== "number") errors.push(`missing:${k}`); });
    return { ok: errors.length === 0, used, data, errors };
  }

  function scrapeBuild(): GroupResult<{ items: Array<{ name?: string; timeText?: string }> }> {
    const used: Used = {};
    const rows = $all(SEL.build.rows);
    if (!rows.length) {
      return { ok: false, used, data: { items: [] }, errors: ["no-rows"] };
    }
    const items = rows.map((row) => {
      const namePick = pick(SEL.build.name, row);
      const tPick = pick(SEL.build.timer, row);
      return { name: namePick.value, timeText: tPick.value };
    });
    used.rows = SEL.build.rows;
    return { ok: items.length > 0, used, data: { items } };
  }

  function scrapeHeroAttributes(): GroupResult<{
    health?: { pct?: number; text?: string };
    experience?: { pct?: number; text?: string };
    speed?: { fieldsPerHour?: number; text?: string };
  }> {
    const used: Used = {};
    const errors: string[] = [];

    // Try to locate visible stats rows
    const rows = $all(SEL.heroAttr.statsRow);
    used.statsRow = SEL.heroAttr.statsRow;

    // Helper: read percent from style width
    const pctFromRow = (row: HTMLElement | null) => {
      if (!row) return undefined;
      const pri = $(SEL.heroAttr.rowPrimaryFill, row);
      const sec = $(SEL.heroAttr.rowSecondaryFill, row);
      const read = (el: HTMLElement | null) => {
        const style = el?.getAttribute("style") || "";
        const m = style.match(/width:\s*([\d.]+)%/);
        return m ? Number(m[1]) : undefined;
      };
      return read(pri) ?? read(sec);
    };

    // Discover rows by label
    let healthPct: number | undefined;
    let healthText: string | undefined;
    let expPct: number | undefined;
    let expText: string | undefined;
    let speedFph: number | undefined;
    let speedText: string | undefined;

    rows.forEach((row) => {
      const label = txt($(SEL.heroAttr.rowLabel, row))?.toLowerCase() || "";
      const raw = txt($(SEL.heroAttr.rowValue, row));
      if (label.includes("health")) {
        healthPct = pctFromRow(row);
        healthText = raw;
      } else if (label.includes("experience")) {
        expPct = pctFromRow(row);
        expText = raw;
      } else if (label.includes("speed")) {
        // sometimes speed is rendered in a separate line/row
        speedText = raw || txt($(SEL.heroAttr.speedText, row));
        speedFph = toNum(speedText);
      }
    });

    // If speed isn't in rows, try outside box
    if (speedFph == null) {
      const any = pick(SEL.heroAttr.speedText);
      speedText = any.value || speedText;
      speedFph = toNum(speedText);
      if (any.sel) used.speed = any.sel;
    }

    const data = {
      health: { pct: healthPct, text: healthText },
      experience: { pct: expPct, text: expText },
      speed: { fieldsPerHour: speedFph, text: speedText },
    };

    if (healthPct == null) errors.push("hero.health.missing");
    if (expPct == null) errors.push("hero.exp.missing");
    if (speedFph == null) errors.push("hero.speed.missing");

    return { ok: errors.length === 0, used, data, errors };
  }

  function scrapeRally(): GroupResult<{ incomingCount?: number }> {
    const used: Used = {};
    const blocks = $all(SEL.rally.blocks);
    used.blocks = SEL.rally.blocks;
    const count = blocks.length || undefined;
    return { ok: typeof count === "number", used, data: { incomingCount: count } };
  }

  // ---------- HUD ----------
  const HUD_ID = "tla-hud";
  function ensureHUD() {
    let el = document.getElementById(HUD_ID) as HTMLDivElement | null;
    if (el) return el;

    el = document.createElement("div");
    el.id = HUD_ID;
    el.style.position = "fixed";
    el.style.top = "8px";
    el.style.right = "8px";
    el.style.zIndex = "2147483647";
    el.style.font = "12px/1.3 system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
    el.style.color = "#eee";
    el.style.background = "rgba(0,0,0,.65)";
    el.style.padding = "8px 10px";
    el.style.borderRadius = "8px";
    el.style.backdropFilter = "blur(2px)";
    el.style.boxShadow = "0 2px 8px rgba(0,0,0,.35)";
    el.style.minWidth = "220px";
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div><b>TLA</b> <span id="tla-ver"></span> — <span id="tla-page"></span></div>
        <div id="tla-heart" title="last scrape">--:--:--</div>
      </div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
        <span id="tla-chip-res"   style="padding:2px 6px;border-radius:999px;background:#333">Res</span>
        <span id="tla-chip-build" style="padding:2px 6px;border-radius:999px;background:#333">Build</span>
        <span id="tla-chip-hero"  style="padding:2px 6px;border-radius:999px;background:#333">Hero</span>
        <span id="tla-chip-rall"  style="padding:2px 6px;border-radius:999px;background:#333">Rally</span>
      </div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap" id="tla-buttons">
        <button id="tla-btn-scrape" style="padding:2px 6px;border-radius:6px;border:1px solid #555;background:#1f6feb;color:#fff;cursor:pointer">Force scrape</button>
        <button id="tla-btn-copy" style="padding:2px 6px;border-radius:6px;border:1px solid #555;background:#444;color:#fff;cursor:pointer">Copy JSON</button>
        <button id="tla-btn-ai" style="padding:2px 6px;border-radius:6px;border:1px solid #555;background:#4fc3f7;color:#000;cursor:pointer;font-weight:bold">🤖 AI Analysis</button>
      </div>
      <div id="tla-msg" style="margin-top:6px;opacity:.8"></div>
    `;
    document.documentElement.appendChild(el);

    // wire buttons
    $("#tla-btn-scrape", el)?.addEventListener("click", () => runOnce(true));
    $("#tla-btn-copy", el)?.addEventListener("click", () => {
      navigator.clipboard.writeText(JSON.stringify(lastPayload, null, 2))
        .then(() => showMsg("Copied payload to clipboard"))
        .catch(() => showMsg("Copy failed"));
    });
    $("#tla-btn-ai", el)?.addEventListener("click", () => requestAIAnalysis());

    return el;
  }

  function setChip(id: string, ok: boolean) {
    const chip = document.getElementById(id);
    if (!chip) return;
    chip.textContent = chip.textContent?.split(" ")[0] + (ok ? " ✔︎" : " ✖︎");
    chip.setAttribute("style",
      `padding:2px 6px;border-radius:999px;background:${ok ? "#264d00" : "#5a0000"};color:#fff`);
  }

  function showMsg(s: string) {
    const el = document.getElementById("tla-msg");
    if (!el) return;
    el.textContent = s;
    setTimeout(() => { if (el.textContent === s) el.textContent = ""; }, 3000);
  }

  // ---------- Main loop ----------
  let lastPayload: any = null;
  let timer: number | undefined;

  function buildPayload() {
    const page = identifyPage(location.pathname + location.search);
    const res = scrapeResources();
    const build = scrapeBuild();
    const hero = page === "hero_attributes" ? scrapeHeroAttributes() : { ok: false, used: {}, data: {}, errors: ["not-on-hero-attributes"] };
    const rally = page === "rallypoint" ? scrapeRally() : { ok: false, used: {}, data: {}, errors: ["not-on-rallypoint"] };

    return {
      version: VERSION,
      page,
      at: new Date().toISOString(),
      resources: res,
      build,
      hero,
      rally,
      url: location.href
    };
  }

  function renderHUD(payload: any) {
    const hud = ensureHUD();
    const page = payload.page;
    $("#tla-ver", hud)!.textContent = `v${VERSION}`;
    $("#tla-page", hud)!.textContent = page;
    $("#tla-heart", hud)!.textContent = nowStamp();

    setChip("tla-chip-res",  !!payload.resources?.ok);
    setChip("tla-chip-build",!!payload.build?.ok);
    setChip("tla-chip-hero", !!payload.hero?.ok);
    setChip("tla-chip-rall", !!payload.rally?.ok);
  }

  function runOnce(manual = false) {
    try {
      lastPayload = buildPayload();
      renderHUD(lastPayload);
      if (manual) showMsg("Scrape completed");
      // Expose for console-based verification
      (window as any).TLA = (window as any).TLA || {};
      (window as any).TLA.state = lastPayload;
      (window as any).TLA.debug = () => {
        console.log("[TLA DEBUG]", lastPayload);
        return lastPayload;
      };
    } catch (err) {
      console.error("[TLA] run error:", err);
      showMsg("Scrape failed (see console)");
    }
  }

  function startLoop() {
    stopLoop();
    runOnce(false); // immediate on load/navigation
    timer = window.setInterval(() => {
      if (document.hidden) return; // pause when hidden
      runOnce(false);
    }, LOOP_MS);
  }

  function stopLoop() {
    if (timer) {
      window.clearInterval(timer);
      timer = undefined;
    }
  }

  // ---------- AI Integration ----------
  let aiRecommendations: any = null;

  async function requestAIAnalysis() {
    if (!lastPayload) {
      showMsg("No data to analyze");
      return;
    }
    
    try {
      showMsg("Requesting AI analysis...");
      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_GAME_STATE',
        payload: lastPayload
      });
      
      if (response.error) {
        showMsg(`AI Error: ${response.error}`);
        return;
      }
      
      aiRecommendations = response;
      renderAIRecommendations();
      showMsg("AI analysis complete");
    } catch (error) {
      console.error('[TLA] AI request failed:', error);
      showMsg("AI request failed");
    }
  }

  function renderAIRecommendations() {
    if (!aiRecommendations || !aiRecommendations.recommendations) return;
    
    // Create or update AI panel
    let aiPanel = document.getElementById('tla-ai-panel') as HTMLDivElement | null;
    if (!aiPanel) {
      aiPanel = document.createElement('div');
      aiPanel.id = 'tla-ai-panel';
      aiPanel.style.cssText = `
        position: fixed;
        top: 120px;
        right: 8px;
        width: 280px;
        z-index: 2147483646;
        font: 12px/1.4 system-ui, sans-serif;
        color: #eee;
        background: rgba(0, 0, 0, 0.85);
        padding: 10px;
        border-radius: 8px;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      `;
      document.documentElement.appendChild(aiPanel);
    }
    
    const recs = aiRecommendations.recommendations.slice(0, 3);
    aiPanel.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h3 style="margin:0; font-size:14px; color:#4fc3f7;">🤖 AI Assistant</h3>
        <button id="tla-ai-close" style="background:none; border:none; color:#999; cursor:pointer; font-size:16px;">×</button>
      </div>
      ${recs.map((rec: any, i: number) => `
        <div style="margin-bottom:8px; padding:8px; background:rgba(255,255,255,0.05); border-radius:6px; border-left:3px solid ${
          rec.urgency === 'high' ? '#ff5252' : rec.urgency === 'medium' ? '#ffa726' : '#66bb6a'
        };">
          <div style="font-weight:bold; color:#fff; margin-bottom:4px;">
            ${i + 1}. ${rec.action}
          </div>
          <div style="font-size:11px; color:#aaa; margin-bottom:2px;">
            ${rec.reason}
          </div>
          <div style="font-size:11px; color:#4fc3f7;">
            → ${rec.benefit}
          </div>
        </div>
      `).join('')}
      ${aiRecommendations.warnings?.length ? `
        <div style="margin-top:8px; padding:6px; background:rgba(255,82,82,0.2); border-radius:4px; font-size:11px; color:#ff8a80;">
          ⚠️ ${aiRecommendations.warnings.join(', ')}
        </div>
      ` : ''}
    `;
    
    // Add close button handler
    document.getElementById('tla-ai-close')?.addEventListener('click', () => {
      aiPanel?.remove();
    });
  }

  // restart on SPA-like nav changes
  let lastHref = location.href;
  setInterval(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      startLoop();
    }
  }, 1000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) runOnce(false);
  });

  // Kick things off
  startLoop();
})();