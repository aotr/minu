# API Reference

Minu is a declarative HTML fragment loader. Add an attribute, let the server return HTML, and choose where it lands.

Canonical web version: https://aotr.github.io/minu/api/

## Install

```bash
npm install minu
```

```js
const minu = require('minu');   // CommonJS
// or: import minu from 'minu'; // ESM
minu.init();
```

CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/minu@1.6.1/dist/minu.min.js"
        integrity="sha384-bvb7Fc/vjU8Hm+hZrH6DCXG2zwSdtAR52XhVqqXL0xGLeY8xcpKmijAxMAzcFVhP"
        crossorigin="anonymous"></script>
<script>minu.init();</script>
```

ESM CDN:

```js
import minu from 'https://cdn.jsdelivr.net/npm/minu@1.6.1/dist/minu.esm.mjs';
minu.init();
```

Secure build:

```bash
npm install minu dompurify
```

```js
import minu from 'minu/secure';
minu.init();
```

```html
<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/minu@1.6.1/dist/minu.secure.min.js"></script>
<script>minu.init();</script>
```

## Initialize

Call `minu.init()` after the DOM is ready. Repeated calls are idempotent.

```js
minu.init();
minu.init('#account [minu-get]');
```

Default selector:

```text
[minu-get],[minu-post],[minu-put],[minu-patch],[minu-delete],[minu-sse]
```

New DOM nodes need another `minu.init()` or `minu.init(selector)` call.

## Requests

One verb attribute selects the request. Order: `get`, `post`, `put`, `patch`, `delete`.

| Attribute | Behavior |
|---|---|
| `minu-get` | GET the URL. |
| `minu-post` | POST the URL. |
| `minu-put` | PUT the URL. |
| `minu-patch` | PATCH the URL. |
| `minu-delete` | DELETE the URL. |
| `minu-trigger` | Event or trigger expression. Default `load`. |
| `minu-target` | CSS selector for the target. `this` means the trigger element. |
| `minu-swap` | Swap mode. Default `innerHTML`. |
| `minu-vals` | JSON object merged into request values. |
| `minu-include` | Selector or selectors of extra fields/forms. |
| `minu-headers` | JSON object merged into request headers. |
| `minu-credentials` | `omit`, `same-origin`, or `include`. |
| `minu-timeout` | Timeout in milliseconds. |
| `minu-confirm` | `window.confirm` message before sending. |
| `minu-prevent` | Set to `false` to allow native click or submit. |
| `minu-select` | Extract one CSS-selected fragment from the response. |

Every request sends `X-Minu-Request: true`.

```html
<button minu-post="/cart/add"
        minu-trigger="click"
        minu-target="#cart"
        minu-confirm="Add this item?">
    Add to cart
</button>
```

## Targets and swaps

Target resolution:

1. `minu-target`, if present.
2. A `[minu-content]` inside the trigger element.
3. The single `[minu-content]` on the page.
4. The trigger element itself.

| `minu-swap` | Result |
|---|---|
| `innerHTML` (default) | Replace the target's children. |
| `outerHTML` | Replace the target. |
| `beforebegin` | Insert before the target. |
| `afterbegin` | Insert as first child. |
| `beforeend` | Insert as last child. |
| `afterend` | Insert after the target. |
| `delete` | Remove the target. |
| `none` | Fetch and fire events, do not swap. |

```html
<div id="list"></div>
<button minu-get="/items/next"
        minu-trigger="click"
        minu-target="#list"
        minu-swap="beforeend">
    Load one more
</button>
```

## Forms and values

When the trigger is inside a form, or is the form, Minu serializes it. Files produce `multipart/form-data`; the rest are `application/x-www-form-urlencoded`. GET values go into the query string.

```html
<form minu-post="/contact" minu-trigger="submit">
    <input name="name" required>
    <input name="email" type="email" required>
    <textarea name="message"></textarea>
    <button type="submit">Send</button>
</form>
```

`minu-vals` adds values that are not in the form. Nested objects are stringified.

```html
<button minu-post="/save"
        minu-vals='{"source":"demo","nested":{"level":2}}'
        minu-headers='{"X-Demo-Token":"abc"}'>
    Save
</button>
```

`minu-include` pulls in other controls or forms.

```html
<input id="search" name="q" value="coffee">
<button minu-get="/search"
        minu-include="#search"
        minu-target="#results">
    Search
</button>
```

## Triggers

`minu-trigger` is a DOM event name plus optional modifiers. The first token is the event.

| Token | Meaning |
|---|---|
| `load` | Run on init. Default. |
| `click`, `submit`, `change`, `keyup`, … | Any DOM event. |
| `every 5s` | Poll. Skips ticks while the document is hidden. |
| `revealed` | Load once when the element enters the viewport. |
| `intersect` | Load each time the element enters the viewport. |
| `once` | Remove the listener after the first event. |
| `changed` | Skip events where the field value did not change. |
| `delay:300ms` | Debounce. |
| `throttle:500ms` | Throttle. |
| `from:#other` | Listen on another element. |

```html
<input minu-get="/search"
       minu-trigger="keyup changed delay:300ms"
       minu-target="#results">
<div id="results"></div>
```

`every 5s` does not queue. A new tick aborts the in-flight request for that element and starts another. The last response wins. The first tick runs after the interval, not immediately.

There is no key-filter grammar such as “Enter only.” Bind your own `keydown` listener and call `minu.reloadComponents('#search')` when the key matches.

`revealed` and `intersect` use `IntersectionObserver`. Browsers without it load immediately. `destroy()` disconnects observers and clears intervals.

## UI state

| Attribute | Behavior |
|---|---|
| `minu-content` | Default target inside the trigger element. |
| `minu-loader` | Legacy loader. Display is toggled during the request. |
| `minu-indicator` | Selector or selectors receiving `minu-requesting`. |
| `minu-disable` | Selector or selectors disabled during the request. `self` and `this` work. |

```css
.spinner { display: none; }
.spinner.minu-requesting { display: inline-flex; }
```

```html
<button minu-post="/save"
        minu-indicator="#spinner"
        minu-disable="#save">
    Save
</button>
<span class="spinner" id="spinner">Saving…</span>
```

Overlapping requests share refcounted state. A superseded request releases its own loader, indicator, and disabled-state claims; it does not release the request that replaced it.

## Events

All events bubble, are composed, and carry `detail`. `minu:beforeRequest` is cancelable.

| Event | When | Detail |
|---|---|---|
| `minu:contentSetup` | Element initialized. | `{ url, trigger }` |
| `minu:beforeRequest` | Before fetch. Cancelable. | `{ url, method, element }` |
| `minu:contentLoaded` | Response parsed and swapped. | `{ html, url, method }` |
| `minu:contentError` | Network, HTTP, or timeout failure. | `{ error, url }` |
| `minu:afterRequest` | After cleanup. Not fired when `beforeRequest` cancels. | `{ url, method, ok }` |
| `minu:sseOpen` | SSE connection opens. | `{ url }` |
| `minu:sseMessage` | SSE message received and processed. | `{ data, event, url }` |
| `minu:sseError` | SSE connection error. | `{ error, url }` |
| `minu:trigger:<name>` | From a `Minu-Trigger` response header. | `{ name, url }` |

```js
document.addEventListener('minu:beforeRequest', (event) => {
    if (!confirm('Send?')) event.preventDefault();
});

document.addEventListener('minu:contentLoaded', (event) => {
    console.log(event.detail.url, event.detail.method);
});
```

A request aborted by a newer request does not fire `minu:afterRequest`. Timeouts and HTTP errors do.

## Methods

| Method | Description |
|---|---|
| `minu.init(selector?)` | Initialize matching elements. Idempotent. |
| `minu.reloadComponents(selector \| string[])` | Re-fetch matching elements with a URL. |
| `minu.reloadComponent(...)` | Deprecated alias. |
| `minu.config({ headers, timeout, credentials })` | Merge global request defaults. |
| `minu.destroy()` | Abort requests, remove listeners, clear timers/observers, close streams, restore disabled controls. |
| `minu.closeStream(element?)` | Close one SSE stream, or all. |

```js
minu.config({
    headers: {
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
    },
    timeout: 10000,
    credentials: 'same-origin',
});

minu.reloadComponents(['#price', '#cart']);
minu.closeStream(document.querySelector('[minu-sse]'));
minu.destroy();
```

## Server protocol

| Response header | Effect |
|---|---|
| `Minu-Trigger: refresh` | Dispatch `minu:trigger:refresh` on the requestor. Comma-separated names allowed. |
| `Minu-Redirect: /login` | Navigate with `location.assign`. |
| `Minu-Refresh: true` | Reload the page. |

Headers are applied before the body swap. `204` and `205` responses skip the swap.

## Out-of-band updates

```html
<!-- response -->
<div id="cart" minu-oob="#cart">3 items</div>
<div class="toast" minu-oob="beforeend:#toasts">Saved</div>
<p>Main panel content.</p>
```

`minu-oob="#cart"` replaces the target. Use `mode:selector` for another mode, for example `beforeend:#toasts` or `afterbegin:#list`. `minu-oob="true"` targets the element's own id.

An OOB-only response updates its targets and leaves the main target untouched. The response is sanitized before OOB elements are applied. The secure build preserves Minu protocol attributes through DOMPurify.

## Server-sent events

```html
<div minu-sse="/events/prices"
     minu-sse-event="price"
     minu-target="#price"
     minu-swap="innerHTML"></div>

<div id="price">$0.00</div>
<div id="ticker">waiting…</div>
```

```text
event: price
data: <span class="price">$42.00</span><div id="ticker" minu-oob="#ticker">42 ms</div>
```

| Attribute | Behavior |
|---|---|
| `minu-sse` | URL opened with native `EventSource` on init. |
| `minu-sse-event` | Comma-separated event names. Default `message`. |
| `minu-target`, `minu-swap` | Same target and swap pipeline as requests. |

`EventSource` reconnects automatically. `retry:` and `id:` work as usual. Cross-origin streams need CORS. Disable proxy buffering with `X-Accel-Buffering: no`.

Chat sends use normal `minu-post`; only the receive side is a stream. WebSocket support is not included.

## JSON boundary

JSON is supported for attribute configuration, not as a wire format.

| Use | Supported | Notes |
|---|---|---|
| `minu-vals` | Yes | Parsed with `JSON.parse`, merged into form values. Nested objects are stringified. |
| `minu-headers` | Yes | Parsed with `JSON.parse`, merged into request headers. |
| JSON request body | No | Bodies are form-encoded or multipart. |
| JSON response rendering | No | Responses are read as text and treated as HTML fragments. |

For a JSON API, render HTML on the server from the JSON, or use native `fetch` plus your own renderer.

## Security

`minu.js` strips `<script>` and `<style>` blocks, inline event handlers, and `javascript:` URLs. Regex sanitization is not an XSS boundary.

For untrusted HTML, use `minu/secure` with DOMPurify. The secure build throws at load if DOMPurify is missing. It also allows Minu's protocol attributes through DOMPurify, because OOB and nested triggers are part of the response format.

The default build is appropriate when the server is trusted. The secure build is the production path for content you do not control.

## TypeScript

Types are included. Minu augments `DocumentEventMap`, `HTMLElementEventMap`, and `WindowEventMap`, so `event.detail` is inferred.

```ts
import minu from 'minu';

minu.init();

document.addEventListener('minu:contentLoaded', (event) => {
    const html: string = event.detail.html;
    console.log(html);
});
```

## Examples

The runnable gallery covers twelve scenarios:

https://aotr.github.io/minu/example/

Source:

https://github.com/aotr/minu/tree/main/example
