
# Travian Legends Assistant

Read-only Chrome extension (MV3) for **Travian Legends**. Scope is **Legends only**; no auto-actions; English-first selectors; overlay HUD; optional backend later.

This add-on pack was generated 2025-08-13T02:49:55.346875Z and is intended to be dropped into an existing monorepo with PNPM workspaces.

## Quick Merge (from your repo root)
```bash
# Unzip the pack into your repo root
unzip tla_addon_pack.zip -d .

# Ensure your root package.json has workspaces and scripts like:
# "workspaces": ["packages/*"],
# "scripts": {{ "dev": "pnpm -F @tla/extension dev", "build": "pnpm -r build", "test": "pnpm -r test" }}

pnpm i
pnpm -F @tla/extension build

# Load the extension
# chrome://extensions → Developer mode → Load unpacked → packages/extension/dist
```

## Structure
- `packages/extension` — MV3 extension (Vite + TS)
- `packages/shared` — shared Zod schemas
- `docs/TDD.md` — concise tech spec
- `README.md` — this file (top-level overview)

See `docs/TDD.md` for details.
