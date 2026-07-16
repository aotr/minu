# Minu

Lightweight HTML fragment loader. Fetch and inject server-rendered content into your page — ~1KB gzipped, zero dependencies.

## Quick Start

**CDN (browser):**
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
const minu = require('minu');
minu.init();
```

**ES module:**
```js
import minu from 'minu';
minu.init();
```

## Usage

Add `minu-get` to any element with the URL you want to fetch:

```html
<span minu-get="/api/price-widget" minu-trigger="load">
    <div class="loader" minu-loader>Loading...</div>
    <div minu-content>$0.00</div>
</span>
```

Minu fetches the URL, sanitizes the HTML, and injects it into the `minu-content` target (or replaces the element if no target is specified).

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `minu-get` | — | URL to fetch content from |
| `minu-trigger` | `load` | Event that triggers the fetch (`load`, `click`, `submit`, etc.) |
| `minu-loader` | — | Element shown during fetch, hidden on complete |
| `minu-content` | — | Target element for injected content |

## API

| Method | Description |
|--------|-------------|
| `minu.init(selector?)` | Initialize elements. Defaults to `[minu-get]` |
| `minu.reloadComponents(sel)` | Re-fetch and inject content for matching elements |
| `minu.reloadComponent(sel)` | ⚠️ Deprecated — use `reloadComponents` |

## Events

| Event | Detail | When |
|-------|--------|------|
| `minu:contentSetup` | `{ url, trigger }` | Element initialized |
| `minu:contentLoaded` | `{ html }` | Content successfully injected |
| `minu:contentError` | `{ error }` | Fetch failed |

```js
document.querySelector('[minu-get]').addEventListener('minu:contentLoaded', (e) => {
    console.log('Loaded:', e.detail.html);
});
```

## Security

`minu.js` ships with basic XSS protection (regex-based). For production use, install [DOMPurify](https://github.com/cure53/DOMPurify) and use the secure build:

**npm:**
```bash
npm install minu dompurify
```

```js
import minu from 'minu/secure';
```

**CDN:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.10/purify.min.js"></script>
<script src="https://unpkg.com/minu/dist/minu.secure.min.js"></script>
```

The secure version uses DOMPurify for full XSS protection. If DOMPurify is not available, the secure build will throw an error.

## Examples

Run the examples locally:
```bash
git clone https://github.com/aotr/minu.git
cd minu
npm install
npm run build
npm run examples
```

Then open `http://localhost:3000/example/basic/`.

| Example | What it shows |
|---------|---------------|
| [Basic](example/basic/index.html) | Auto-load content on page load |
| [Form](example/form/index.html) | Submit form, show server response |
| [Tabs](example/tabs/index.html) | Click-triggered content swap |

## License

MIT