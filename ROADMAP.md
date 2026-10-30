# Minu Roadmap

Plan date: 2026-10-30 · Current: v1.1.0 · Core: ~810 B gzip

**Status:** implemented in v1.6.0 (Vite+ / Rolldown build). This file stays as
the design record; the shipped API is documented in `readme.md`.
**Assumption:** RTC = real-time content (SSE / WebSocket server push).
If you meant WebRTC (peer-to-peer media/data), that is a different library — say so.

**Positioning:** Minu is a 1 KB htmx alternative for server-rendered apps, not an
htmx clone. Every feature must earn its bytes. Reference tools: htmx, Turbo,
Unpoly, Alpine AJAX.

---

## 1. Scope today

**What it does:** declarative HTML fragment loader. An element marked `minu-get`
fetches a URL and injects the response into itself or a `minu-content` child.
One-shot or event-triggered. UMD + ESM, optional DOMPurify build.

**Public surface:**

| Kind | Today |
|---|---|
| Attributes | `minu-get`, `minu-trigger`, `minu-loader`, `minu-content` |
| Methods | `init(selector?)`, `reloadComponents(sel)`, `reloadComponent(sel)` (deprecated) |
| Events | `minu:contentSetup`, `minu:contentLoaded`, `minu:contentError` |
| Verbs | GET only |
| Swaps | `innerHTML` only |
| Deps | 0 (DOMPurify optional peer) |

**Who it serves:** Rails/Django/Laravel/PHP apps that want tabs, polls, forms,
and live feeds without a SPA or a 14 KB framework.

### Audit findings (blockers before features)

| # | Finding | Location | Impact |
|---|---|---|---|
| 1 | 95% duplicated logic between standard and secure builds | `src/minu.js`, `src/minu-secure.js` | Every feature is written twice |
| 2 | Target/loader lookup is scoped inside the trigger element | `src/minu.js:26-27` | Shared targets impossible; `example/form` loader never hides, `example/tabs` replaces the tab label |
| 3 | `submit`/`click` not prevented; demos patch it manually | `src/minu.js:66-69` | Native navigation races the fetch |
| 4 | `init()` is not idempotent | `src/minu.js:56-61` | Double init = double fetch, duplicate listeners |
| 5 | No `AbortController` | `src/minu.js:31` | Fast clicks resolve out of order; last request loses |
| 6 | Loader uses inline `display` | `src/minu.js:29,50` | Breaks inline/flex layouts; ignores CSS |
| 7 | Events do not bubble (`bubbles: false` default) | `src/minu.js:20-23` | No delegation; docs example only works on the element |
| 8 | "Sanitized" claim is misleading | `src/minu.js:15-18` | Regex strips `<script>`/`<style>` only; `onerror`, `javascript:` survive |
| 9 | No tests, no CI, no size budget | repo | Regressions are invisible |
| 10 | Types cover 3 functions only | `index.d.ts` | No attribute/event/option typing |

---

## 2. Comparison (why each feature is on the list)

| Capability | Minu | htmx | Turbo | Unpoly |
|---|---|---|---|---|
| Fetch + inject fragment | ✅ | ✅ | ✅ frames | ✅ |
| All HTTP verbs | ❌ | ✅ | ✅ forms | ✅ |
| Swap modes (`outerHTML`, append, …) | ❌ | ✅ | ✅ streams | ✅ |
| Trigger grammar (once, delay, poll, reveal) | ❌ | ✅ | partial | ✅ |
| Forms, extra values, headers | ❌ | ✅ | ✅ | ✅ |
| Out-of-band updates | ❌ | ✅ | ✅ | ✅ |
| Server-sent events / WebSocket | ❌ | extensions | ✅ | ✅ |
| History / URL push | ❌ | ✅ | ✅ | ✅ |
| Size (gzip) | **0.8 KB** | ~6 KB | much larger | larger |
| Runtime deps | **0** | 0 | 0 | 0 |

**Strategy:** take htmx's proven attribute semantics (users can migrate), skip
its router/history/extension system, stay under ~3.5 KB gzip.

---

## 3. Phases

### Phase 0 — Fix the foundation (v1.2.0, ~3 days)

No new user-facing features. Make everything after this cheaper.

- One source of truth: `src/core.js` + thin `src/minu.js` / `src/minu-secure.js`
  entries that inject a sanitizer. Build output unchanged.
- Target resolution: `minu-target` selector → `[minu-content]` inside element →
  element itself. Same for `[minu-loader]`.
- Idempotent `init()` via `WeakSet`; add `minu.destroy()`.
- `preventDefault()` for handled `submit` and anchor `click`; opt out with
  `minu-prevent="false"`.
- One `AbortController` per element; a new request aborts the previous one.
- Loader toggles the `hidden` attribute, not `display`.
- Events bubble + `composed`; add cancelable `minu:beforeRequest`.
- HTTP errors carry `status`/`statusText`; `204` = no swap.
- TS types: attributes, event map, `init` options.
- Tests: `node:test` + `jsdom` (one devDependency), fake `fetch`; GitHub Actions
  on Node 20/22; gzip budget check in `build.js` (fail over limit).
- Docs: state plainly that the default build is **not** an XSS boundary; the
  secure build is the production path.

**Acceptance:** existing 3 demos work unmodified except target attributes; tests
green; core ≤ 1.2 KB gzip.

### Phase 1 — Request + swap primitives (v1.3.0, ~5 days)

| Attribute | Behavior |
|---|---|
| `minu-post` / `minu-put` / `minu-patch` / `minu-delete` | Verb selection; one wins, `get` default |
| `minu-target` | CSS selector for swap target |
| `minu-swap` | `innerHTML` (default), `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `delete`, `none` |
| `minu-vals` | JSON object merged into request values |
| `minu-include` | Selector(s) of inputs to serialize |
| `minu-headers` | JSON object of request headers |
| `minu-indicator` | Selector receiving class `minu-requesting` during flight |
| `minu-disable` | Selector/self disabled during flight |
| `minu-confirm` | `confirm()` gate before request |
| `minu-timeout` | Milliseconds, default none |
| `minu-credentials` | `omit` / `same-origin` / `include` |
| `minu-select` | Extract a CSS-selected fragment from the response |

- Body encoding: forms → `FormData` (files supported), GET → query string,
  `minu-vals` merged; no `eval`.
- Global `minu.config({ headers, timeout })` for CSRF tokens.
- Send `X-Minu-Request: true` so servers can branch.
- Update demos to use shared targets correctly.

**Acceptance:** every attribute documented + tested; core ≤ 2.2 KB gzip.

### Phase 2 — Trigger grammar + polling (v1.4.0, ~4 days)

`minu-trigger` becomes a small grammar (whitespace-separated tokens):

```
click | submit | change | input | keyup | load | revealed | intersect
every 5s
once | delay:300ms | throttle:500ms | changed | from:<selector>
```

- `load` stays default.
- `every` polls; pauses while `document.hidden`, resumes on visibility.
- `revealed` = load once when visible (IntersectionObserver), `intersect` = on
  every entry; lazy-load images/sections with native APIs.
- `from:` listens on another element (document delegation).
- No `keyup[key==Enter]` filter language — users can bind their own listener.

**Acceptance:** polling stops on `destroy()` and on element removal; core
≤ 2.8 KB gzip.

### Phase 3 — Server protocol (v1.5.0, ~3 days)

- Response headers:
  - `Minu-Trigger: eventName` → dispatch `minu:trigger:eventName` on requestor.
  - `Minu-Redirect: /url` → `location.assign`.
  - `Minu-Refresh: true` → full reload.
- Out-of-band swaps: response elements marked `minu-oob="#cart"` (optional
  `minu-swap`) are applied to matching targets, then removed from the payload.
- `minu-select` and `minu-oob` share one extraction/swap pipeline.

**Acceptance:** one response can update 3 regions; protocol documented with
server examples (Express, Laravel, Rails).

### Phase 4 — RTC: real-time content (v1.6.0, ~4 days)

Server push, not peer-to-peer. **SSE first** — `EventSource` is native,
reconnects for free, and covers 90% of live-update use cases. Chat sends still
use normal `minu-post`; only the receive side is a stream.

**Declarative API:**

```html
<!-- live price -->
<div minu-sse="/events/prices"
     minu-sse-event="price"
     minu-target="#price"
     minu-swap="innerHTML"></div>

<!-- one connection, many regions via OOB -->
<div minu-sse="/events/app"></div>
<!-- server pushes:
  <div id="cart" minu-oob="#cart">3 items</div>
  <div id="toast" minu-oob="beforeend:#toasts">Saved</div>
-->
```

**Rules:**

- `minu-sse` opens `EventSource` on load; `minu-sse-event` filters by event
  name (default `message`).
- Each message `data` is an HTML fragment → same sanitize + `minu-swap`
  pipeline. Dispatch `minu:sseMessage`.
- `minu:sseError` on failure; native retry handles reconnect; `retry:` and
  `id:` (Last-Event-ID) documented for resume.
- `minu.destroy()` closes every connection; `minu.closeStream(el)` for one.
- WebSocket: **defer**. Add `minu-ws` (receive-only + exponential backoff +
  heartbeat) only if users need bidirectional push; SSE + POST covers chat.
- Same-origin by default; cross-origin requires CORS. Sanitize every message,
  never `eval`. Document proxy config (`X-Accel-Buffering: no`, HTTP/2 for the
  6-connection limit).
- Demo: `example/live/` page, served by the zero-dependency `example/server.js`.

**Acceptance:** live feed demo works; reconnect resumes with `Last-Event-ID`;
core ≤ 4 KB gzip (SSE ships in core; no extra entry).

### Phase 5 — DX + release (v1.7.0 / v2.0.0, ~3 days)

- Docs: attribute reference, recipes (tabs, form, polling, live feed), migration
  from htmx, server snippets.
- Example gallery: `example/index.html`, one runnable page per scenario.
- Changelog, size badge, npm provenance publish workflow.
- Optional 3-line `minu-transition` using `document.startViewTransition`.
- v2.0 cleanup (remove `reloadComponent`, update wording) is deferred: keeping
  the deprecated alias costs nothing and avoids a breaking release.

---

## 4. Non-goals (say no now)

- SPA router / history / pushState — use real links or Turbo.
- Templating, state management, virtual DOM.
- Morph/diff swap — adds KB and edge cases; revisit only if focus loss is a
  real complaint.
- CRDT / multiplayer cursors / WebRTC media — use Yjs or Liveblocks.
- IE11, framework wrappers, TypeScript rewrite.

---

## 5. Guardrails

- **Size:** core budget enforced in `build.js`: 4 KB gzip minified UMD, 4.25 KB
  for the secure UMD (DOMPurify allowlist), 4.5 KB for the unminified ESM.
  Exceeding fails the build.
- **Build:** Vite+ (Rolldown) library mode; no runtime dependencies.
- **Zero runtime deps.** DOMPurify stays optional and only in the secure build.
- **One core**, two thin entries. Never duplicate logic again.
- **Every attribute** ships with docs + a test.
- **Backward compatible** through 1.x; `reloadComponent` removed only in 2.0.

---

## 6. Order and effort

| Phase | Version | Ships | Dev-days |
|---|---|---|---|
| 0 | 1.2.0 | Fixes, tests, CI, size gate | 3 |
| 1 | 1.3.0 | Verbs, target/swap, forms, timeout | 5 |
| 2 | 1.4.0 | Trigger grammar, polling, lazy reveal | 4 |
| 3 | 1.5.0 | Response headers, OOB swaps | 3 |
| 4 | 1.6.0 | SSE live content | 4 |
| 5 | 1.7/2.0 | Docs, release automation | 3 |

**~22 dev-days** total, ~2 weeks full-time.

**First three PRs:**
1. Refactor to one core + fix scoping, idempotency, abort, preventDefault + tests.
2. Add `minu-post`/`minu-target`/`minu-swap`/`minu-vals` + docs.
3. Add trigger grammar with `once`/`delay`/`every`/`revealed`.
