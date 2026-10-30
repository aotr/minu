# Changelog

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
