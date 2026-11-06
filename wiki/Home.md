# Minu

Minu is a 4.0 KB HTML fragment loader for server-rendered apps. It adds requests, forms, polling, out-of-band swaps, and SSE without a SPA or a build step.

- [API Reference](API-Reference)
- [Project page](https://aotr.github.io/minu/)
- [Examples](https://aotr.github.io/minu/example/)
- [npm](https://www.npmjs.com/package/minu)
- [GitHub](https://github.com/aotr/minu)
- [Security policy](https://github.com/aotr/minu/blob/main/SECURITY.md)

## Install

```bash
npm install minu
```

```html
<script src="https://cdn.jsdelivr.net/npm/minu@1.6.1/dist/minu.min.js"
        integrity="sha384-bvb7Fc/vjU8Hm+hZrH6DCXG2zwSdtAR52XhVqqXL0xGLeY8xcpKmijAxMAzcFVhP"
        crossorigin="anonymous"></script>
<script>minu.init();</script>
```

## Ten-second example

```html
<div minu-get="/widgets/price"
     minu-trigger="every 5s"
     minu-target="#price"></div>

<div id="price">$0.00</div>
```

The server returns an HTML fragment. Minu swaps it into the target.

## What it does

- GET, POST, PUT, PATCH, DELETE
- Targets and eight swap modes
- Forms, values, headers, timeout, confirm, disable, indicator
- Triggers: `load`, `click`, `submit`, `every`, `revealed`, `intersect`, `once`, `changed`, `delay`, `throttle`, `from`
- Out-of-band swaps and `Minu-Trigger`, `Minu-Redirect`, `Minu-Refresh`
- SSE with native `EventSource`
- DOMPurify-backed secure build

## What it does not do

Routing/history, morph or diff swaps, WebSockets, or JSON response parsing. Use htmx if you need its extension ecosystem or history support.

The default build is not an XSS boundary. Use `minu/secure` for untrusted HTML.
