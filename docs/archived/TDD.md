# Travian Legends Assistant — TDD (Repo Version)

## Product & Scope
- **Chrome Extension (MV3)** + optional backend later
- **Travian Legends only**, read-only, English-first selectors

## P0 Goals
- Scrapers for **dorf1, build, hero, rally, market**
- Normalized payloads via shared Zod schemas
- Minimal **overlay** (toggleable in Options)
- MutationObserver loop (debounced ≥250ms)

## Architecture
```
[Extension]
  content/ (scrapers, registry, loop)
  overlay/ (HUD)
  background/ (bridge, future IDB/sync)
  options/ (overlay toggle)
[Shared] zod schemas
```

## Data & Messaging
- `SnapshotEnvelope { server, page, ts, payload }`
- Window postMessage → background SW (future IDB/sync)

## Performance & Safety
- ≤50ms startup, ≤5ms per tick after debounce
- No auto-actions; opt-in; overlay toggle; pause later

## Testing
- JSDOM unit tests for parsers (golden fixtures later)
- Playwright smoke later

## Roadmap (high level)
- **P0**: finish EN selectors + scrapers + overlay HUD
- **P1**: draggable/theming; hero/incoming badges
- **P2**: backend ingest, history, forecasts, alerts
