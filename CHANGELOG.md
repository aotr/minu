# Changelog

## 1.8.0 — 2026-11-17

- **Changed:** `minu-trigger` now defaults by element: forms submit, form
  fields fire on `change`, buttons on `click`, and other elements still load
  on init. Renamed htmx markup behaves the same without explicit triggers.
- **Fixed:** a component removed by a swap (`outerHTML`, `innerHTML`, `delete`,
  or a plugin swap) releases its timers, listeners, observers, and SSE stream
  instead of continuing in the background.
- **Fixed:** the morph plugin no longer reuses a live element for an incoming
  element with a different `id`, so typed values no longer leak across
  identities.
- Added tests for trigger defaults, removed-component cleanup, and morph
  identity.

## 1.7.0 — 2026-11-16

- Added a plugin swap seam: `minu.registerSwap(name, handler)`.
- Added the opt-in morph swap plugin (`minu/morph`, 0.9 KB gzip) that preserves
  matching nodes, focus, text selection, and scroll position.
- Added the [Coming from htmx](https://aotr.github.io/minu/from-htmx/) guide.
- Added the repository banner and project-page social image.

## 1.6.1 — 2026-10-30

- Added [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
- Added a GitHub Pages project page and per-scenario demo pages.
- Added a browser-side adapter for the dynamic Pages demos.
- Extracted the response protocol seam: OOB extraction, sanitization, select,
  and main payload now live in `src/response.js`.
- The secure build now preserves Minu protocol attributes through DOMPurify.
- Fixed request teardown so a superseded request always releases its loader,
  indicator, and disabled-state refcounts.
- Shared the demo endpoint contract between the Node server and Pages adapter.
- Added secure-build, demo-contract, and overlapping-request tests.
- Generated `release.json` and the example gallery from one manifest.
- Added typed `DocumentEventMap` / `HTMLElementEventMap` / `WindowEventMap`
  entries so `event.detail` is inferred for Minu events.

## 1.6.0

- One core with thin UMD/ESM/secure entries; no more duplicated logic.
- Vite+ (Rolldown) library build with a gzip budget gate.
- Fixed target/loader resolution for shared content areas.
- Idempotent `init()`, request aborts, bubbling events, `destroy()`.
- Added POST/PUT/PATCH/DELETE, forms, `minu-vals`, `minu-include`, headers,
  timeout, credentials, confirm, indicator, disable, and `minu-select`.
- Added swap modes: `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`,
  `afterend`, `delete`, `none`.
- Added trigger grammar: `every`, `revealed`, `intersect`, `once`, `changed`,
  `delay`, `throttle`, `from`.
- Added response protocol: `Minu-Trigger`, `Minu-Redirect`, `Minu-Refresh`,
  and `minu-oob` out-of-band swaps.
- Added SSE live content (`minu-sse`, `minu-sse-event`).
- Added a runnable example page for every scenario, served by a zero-dependency
  demo server (`npm run examples`).
- Added tests (node:test + jsdom) and CI.
- Basic build now strips inline handlers and `javascript:` URLs. It is still
  not a security boundary; use `minu/secure` for untrusted HTML.

## 1.1.0

- Initial packaged release: `minu-get`, `minu-trigger`, `minu-loader`,
  `minu-content`, `init()`, `reloadComponents()`.
