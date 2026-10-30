# Minu

[Project page](https://aotr.github.io/minu/) · [npm](https://www.npmjs.com/package/minu) · [Examples](https://github.com/aotr/minu/tree/main/example)

Lightweight HTML fragment loader. Fetch and inject server-rendered HTML — with
AJAX, forms, polling, out-of-band swaps, and live SSE content. Zero runtime
dependencies, ~3.7 KB gzipped.

Minu is for server-rendered apps that want htmx-style behavior without the
framework. Your server keeps returning HTML; Minu puts it where it belongs.

## Quick Start

**CDN:**

```html
<script src="https://unpkg.com/minu/dist/minu.min.js"></script>
<script>
    minu.init();
</script>
```

**npm:**

```bash
npm install minu
```

```js
const minu = require('minu');   // CommonJS
// or: import minu from 'minu'; // ESM
minu.init();
```

## Usage

Add an attribute with the URL you want to fetch:

```html
<div minu-get="/widgets/price" minu-trigger="load" minu-target="#price">
    <div minu-loader>Loading…</div>
</div>
<div id="price">$0.00</div>
```

Minu fetches the URL, sanitizes the HTML, and swaps it into the target. With no
explicit target it uses a `minu-content` child, then the single `minu-content`
on the page, then the element itself.

## Attributes

### Requests

| Attribute | Description |
|---|---|
| `minu-get` | Fetch with GET |
| `minu-post` | Submit with POST |
| `minu-put` / `minu-patch` / `minu-delete` | Other verbs |
| `minu-trigger` | Event or trigger expression (default `load`) |
| `minu-target` | CSS selector for the swap target (`this` allowed) |
| `minu-swap` | `innerHTML` (default), `outerHTML`, `beforebegin`, `afterbegin`, `beforeend`, `afterend`, `delete`, `none` |
| `minu-vals` | JSON object of extra values |
| `minu-include` | Selector(s) of extra fields/forms to serialize |
| `minu-headers` | JSON object of request headers |
| `minu-credentials` | `omit`, `same-origin`, `include` |
| `minu-timeout` | Timeout in ms |
| `minu-confirm` | `confirm()` message before sending |
| `minu-prevent` | Set to `false` to allow native submit/click behavior |
| `minu-select` | Extract this CSS selector from the response before swapping |

Forms are serialized automatically when the trigger is inside a form (or is the
form). Files produce `multipart/form-data`; everything else is form-encoded.
GET values are appended to the query string.

### UI state

| Attribute | Description |
|---|---|
| `minu-loader` | Element shown during the request (legacy; display toggled) |
| `minu-indicator` | Selector(s) receiving the `minu-requesting` class |
| `minu-disable` | Selector(s) disabled during the request (`self`/`this` allowed) |
| `minu-content` | Default target inside the element |

Prefer `minu-indicator` + CSS. It keeps inline/flex layouts intact:

```css
.spinner { display: none; }
.minu-requesting { display: inline-block; }
```

## Triggers

`minu-trigger` accepts a DOM event name plus whitespace-separated modifiers:

| Trigger | Meaning |
|---|---|
| `load` | On init (default) |
| `click`, `submit`, `change`, `keyup`, … | Any DOM event |
| `every 5s` | Poll; skips while the tab is hidden |
| `revealed` | Load once when the element enters the viewport |
| `intersect` | Load every time the element enters the viewport |
| `once` | Fire at most once |
| `changed` | Only when the field value changed |
| `delay:300ms` | Debounce |
| `throttle:500ms` | Throttle |
| `from:#other` | Listen on another element |

```html
<input minu-get="/search" minu-trigger="keyup changed delay:300ms"
       minu-target="#results">
<div id="results"></div>
```

Submit and click events are prevented by default when Minu handles them. Forms
need no `preventDefault()` workaround.

## Events

All events bubble and carry `detail`.

| Event | Detail |
|---|---|
| `minu:contentSetup` | `{ url, trigger }` |
| `minu:beforeRequest` | `{ url, method, element }` — cancelable |
| `minu:contentLoaded` | `{ html, url, method }` |
| `minu:contentError` | `{ error, url }` |
| `minu:afterRequest` | `{ url, method, ok }` |
| `minu:sseOpen` | `{ url }` |
| `minu:sseMessage` | `{ data, event, url }` |
| `minu:sseError` | `{ error, url }` |
| `minu:trigger:<name>` | `{ name, url }` — from `Minu-Trigger` header |

```js
document.addEventListener('minu:contentLoaded', (event) => {
    console.log('loaded', event.detail.url);
});

document.getElementById('save').addEventListener('minu:beforeRequest', (event) => {
    if (!confirm('Save?')) event.preventDefault();
});
```

## API

| Method | Description |
|---|---|
| `minu.init(selector?)` | Initialize matching elements (idempotent) |
| `minu.reloadComponents(selector \| selector[])` | Re-fetch matching elements |
| `minu.reloadComponent(...)` | Deprecated alias |
| `minu.config({ headers, timeout, credentials })` | Global request defaults |
| `minu.destroy()` | Abort requests, remove listeners, close streams |
| `minu.closeStream(element?)` | Close one or all SSE streams |

```js
minu.config({
    headers: { 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content },
    timeout: 10000,
});
```

## Server Protocol

Response headers:

| Header | Effect |
|---|---|
| `Minu-Trigger: refresh` | Dispatches `minu:trigger:refresh` on the requestor (comma-separated allowed) |
| `Minu-Redirect: /login` | Navigates |
| `Minu-Refresh: true` | Reloads the page |

Out-of-band swaps update other regions from one response:

```html
<!-- response -->
<div id="cart" minu-oob="#cart">3 items</div>
<div id="toast" minu-oob="beforeend:#toasts">Saved</div>
```

`minu-oob` defaults to `outerHTML` on the selector. An OOB-only response leaves
the main target untouched.

## Real-time Content (SSE)

Minu supports server-sent events with the same target/swap/OOB pipeline.

```html
<div minu-sse="/events/prices"
     minu-sse-event="price"
     minu-target="#price"
     minu-swap="innerHTML"></div>

<div id="price">$0.00</div>
<div id="ticker">waiting…</div>
```

The server sends HTML fragments:

```
event: price
data: <span class="price">$42.00</span><div id="ticker" minu-oob="#ticker">42 ms</div>

```

Rules:

- `EventSource` reconnects automatically; `retry:` and `id:` (Last-Event-ID) work as usual.
- `minu-sse-event` is comma-separated; default `message`.
- Every message is sanitized and swapped through `minu-swap`.
- `minu.destroy()` closes streams; `minu.closeStream(el)` closes one.
- Cross-origin streams need CORS. Disable proxy buffering (`X-Accel-Buffering: no`).

SSE is the recommended live-update path. Chat sends use normal `minu-post`;
only the receive side is a stream. WebSocket support is intentionally not
included — add it only if you need bidirectional push.

## JSON

JSON is supported **for attribute configuration only**:

- `minu-vals` — JSON object merged into request values. Nested values are
  stringified.
- `minu-headers` — JSON object merged into request headers.

Minu does **not** send JSON request bodies and does **not** parse JSON
responses. Non-GET bodies are `application/x-www-form-urlencoded` or
`multipart/form-data`; every response is read as text and treated as an HTML
fragment.

For a JSON API, render HTML on the server from the JSON, or use `fetch` and
your own renderer. See the runnable `example/json/` page in the repository for
the exact boundary.

## Security

`minu.js` strips scripts, inline event handlers, and `javascript:` URLs. It is
**not an XSS boundary** — regex sanitization never is.

For untrusted HTML, install DOMPurify and use the secure build:

```bash
npm install minu dompurify
```

```js
import minu from 'minu/secure';
minu.init();
```

The secure build throws at load if DOMPurify is missing.

## Examples

Run these from a repository checkout — the published npm package ships only
the built library and typings.

```bash
npm install
npm run build
npm run examples   # http://localhost:3000
```

| Example | URL | Shows |
|---|---|---|
| Basic | `/example/basic/` | Auto-load a widget |
| Form | `/example/form/` | POST, loader, indicator, disable, confirm |
| Tabs | `/example/tabs/` | Click-triggered shared target |
| Search | `/example/search/` | Debounce, `changed`, `minu-select` |
| Polling | `/example/polling/` | `every 2s` and visibility pause |
| Lazy reveal | `/example/lazy/` | `revealed` / `intersect` |
| Swap modes | `/example/swap/` | All eight swap behaviors |
| OOB | `/example/oob/` | One response updates three regions |
| Headers | `/example/headers/` | `Minu-Trigger`, `Minu-Redirect`, `Minu-Refresh` |
| Events | `/example/events/` | Lifecycle log and cancellation |
| JSON | `/example/json/` | JSON attributes vs. JSON responses |
| Live SSE | `/example/live/` | SSE price + OOB ticker |

All scenarios run through the zero-dependency `example/server.js`. The
`npm run demo:live` alias starts the same server for the live SSE page.
A plain static server will not run the `/demo/*` endpoints.

## Build & Test

The build uses **Vite+** (Rolldown) in library mode:

```bash
npm run build   # dist/ + gzip budget gate
npm test        # build + node:test + jsdom
```

Requires Node 22+ for the build; the shipped files run in modern browsers.
Outputs: `minu.min.js` / `minu.js` (UMD), `minu.esm.mjs` (ESM), plus the
`minu.secure.*` variants. Runtime dependencies: none.

## Migrating from 1.1

- `init()` no longer double-binds.
- Events bubble.
- Forms no longer need a manual `preventDefault()`.
- `minu-loader` / `minu-content` keep working.
- `reloadComponent()` still works (deprecated).

## License

MIT
