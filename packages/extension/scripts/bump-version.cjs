const fs = require("fs");
const path = require("path");

const src = path.resolve(__dirname, "../manifest.json");
const dist = path.resolve(__dirname, "../dist/manifest.json");

// read source manifest
const m = JSON.parse(fs.readFileSync(src, "utf8"));

let [maj, min, patch] = (m.version || "0.2.1").split(".").map(Number);
patch = isNaN(patch) ? 0 : patch + 1;
m.version = `${maj}.${min}.${patch}`;

// write back to source
fs.writeFileSync(src, JSON.stringify(m, null, 2));

// write to dist if it exists (safe no-op if not yet built)
try { fs.writeFileSync(dist, JSON.stringify(m, null, 2)); } catch { /* ignore */ }

console.log(`[TLA] Version -> ${m.version}`);
