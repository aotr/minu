/* Static GitHub Pages adapter for the example gallery.
   On github.io (or ?static-demo), it simulates the demo endpoints in the browser
   so the same example pages work without the Node server.
   Locally, without the flag, this file is a no-op and example/server.js handles everything. */
(() => {
    const staticDemo = location.hostname.endsWith('github.io') ||
        new URLSearchParams(location.search).has('static-demo');
    if (!staticDemo) return;

    const nativeFetch = window.fetch.bind(window);
    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));

    const html = (body, headers = {}) => new Response(body, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            ...headers,
        },
    });

    const json = (body) => new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

    const readBody = async (body) => {
        if (!body) return new URLSearchParams();
        if (body instanceof URLSearchParams) return body;
        if (typeof body === 'string') return new URLSearchParams(body);
        if (body instanceof FormData) {
            const fields = new URLSearchParams();
            body.forEach((value, key) => fields.append(key, typeof value === 'string' ? value : ''));
            return fields;
        }
        return new URLSearchParams();
    };

    const header = (headers, name) => {
        if (!headers) return '';
        if (headers instanceof Headers) return headers.get(name) || '';
        const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
        return key ? headers[key] : '';
    };

    const sleep = (ms, signal) => new Promise((resolve, reject) => {
        if (signal && signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }
        const timer = setTimeout(resolve, ms);
        if (!signal) return;
        signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });

    const menu = [
        ['Espresso', 'coffee strong italian'],
        ['Flat White', 'coffee milk smooth'],
        ['Cold Brew', 'coffee cold summer'],
        ['Matcha Latte', 'tea milk green'],
        ['Chai', 'tea spice milk'],
        ['Croissant', 'bakery butter'],
        ['Banana Bread', 'bakery sweet'],
        ['Sparkling Water', 'drink cold'],
    ];

    let timeRequests = 0;
    let fragmentRequests = 0;
    let cartItems = 0;

    window.fetch = async (input, options = {}) => {
        const request = input instanceof Request ? input : null;
        const url = new URL(request ? request.url : String(input), location.href);
        const path = url.pathname.includes('/demo/')
            ? url.pathname.slice(url.pathname.indexOf('/demo/'))
            : url.pathname;
        if (!path.startsWith('/demo/')) return nativeFetch(input, options);

        const method = (options.method || (request && request.method) || 'GET').toUpperCase();
        const fields = await readBody(options.body);
        const now = new Date().toLocaleTimeString();

        if (path === '/demo/time') {
            timeRequests += 1;
            return html(`
                <div class="result">
                    <span class="tag">GET</span>
                    <strong>Server time</strong>
                    <div class="price-tag">${now}</div>
                    <p class="muted">Poll request #${timeRequests}. This is a simulated Pages response.</p>
                </div>`);
        }

        if (path === '/demo/search') {
            const query = (url.searchParams.get('q') || '').trim();
            const lower = query.toLowerCase();
            const matches = menu.filter(([name, tags]) => !lower || `${name} ${tags}`.toLowerCase().includes(lower));
            const items = matches.length
                ? matches.map(([name, tags]) => `<li><strong>${escapeHtml(name)}</strong> <span class="muted">${escapeHtml(tags)}</span></li>`).join('')
                : '<li class="muted">No matches. Try “coffee”, “tea”, or “bakery”.</li>';
            return html(`<!DOCTYPE html>
                <html lang="en"><head><meta charset="UTF-8"><title>Search results</title></head>
                <body><main><div id="search-results">
                    <p class="muted">${matches.length} result(s) for “${escapeHtml(query || 'everything')}”</p>
                    <ul class="result-list">${items}</ul>
                </div></main></body></html>`);
        }

        if (path === '/demo/form' && method === 'POST') {
            return html(`
                <div class="success-msg">
                    <strong>Thanks, ${escapeHtml(fields.get('name') || 'friend')}!</strong>
                    <p>The static Pages adapter parsed this POST and rendered HTML back.</p>
                    <dl class="result-list">
                        <dt>Email</dt><dd>${escapeHtml(fields.get('email') || '(not provided)')}</dd>
                        <dt>Message</dt><dd>${escapeHtml(fields.get('message') || '(empty)')}</dd>
                        <dt>Method</dt><dd>POST · form-urlencoded</dd>
                    </dl>
                </div>`);
        }

        if (path === '/demo/fragment') {
            fragmentRequests += 1;
            return html(`
                <div class="swap-item">
                    <span class="tag">fragment ${fragmentRequests}</span>
                    <strong>Injected HTML</strong>
                    <p class="muted">Fetched at ${now}</p>
                </div>`);
        }

        if (path === '/demo/oob') {
            cartItems += 1;
            return html(`
                <p>Main panel updated at ${now}.</p>
                <span id="cart-count" minu-oob="#cart-count">${cartItems}</span>
                <div class="toast" minu-oob="beforeend:#toasts">Item added at ${now}</div>`);
        }

        if (path === '/demo/trigger') {
            return html(`<p class="result">Response at ${now}. The <code>Minu-Trigger</code> header should fire an event.</p>`,
                { 'Minu-Trigger': 'ping' });
        }

        if (path === '/demo/redirect') {
            return html('', { 'Minu-Redirect': new URL('redirected.html', location.href).href });
        }

        if (path === '/demo/refresh') {
            return html('<p>Reloading…</p>', { 'Minu-Refresh': 'true' });
        }

        if (path === '/demo/json-input' && method === 'POST') {
            return html(`
                <div class="result">
                    <span class="tag">POST</span>
                    <strong>Server received</strong>
                    <dl class="result-list">
                        <dt><code>source</code></dt><dd>${escapeHtml(fields.get('source') || '(missing)')}</dd>
                        <dt><code>nested</code></dt><dd>${escapeHtml(fields.get('nested') || '(missing)')}</dd>
                        <dt><code>X-Demo-Token</code></dt><dd>${escapeHtml(header(options.headers, 'x-demo-token') || '(missing)')}</dd>
                        <dt>Content-Type</dt><dd>${escapeHtml(header(options.headers, 'content-type') || '(none)')}</dd>
                    </dl>
                    <p class="muted">JSON attributes were decoded by Minu; the body is still form-urlencoded.</p>
                </div>`);
        }

        if (path === '/demo/json-response') {
            return json({ ok: true, items: [1, 2, 3] });
        }

        if (path === '/demo/slow') {
            await sleep(1500, options.signal);
            return html('<div class="result">Slow response arrived after 1.5 seconds.</div>');
        }

        if (path === '/demo/lazy') {
            return html(`
                <div class="result">
                    <span class="tag">revealed</span>
                    <strong>Lazy section loaded</strong>
                    <p>This fragment was fetched only when the placeholder entered the viewport.</p>
                    <p class="muted">Fetched at ${now}</p>
                </div>`);
        }

        return new Response('Not found', { status: 404 });
    };

    class StaticEventSource {
        constructor(url) {
            this.url = String(url);
            this.listeners = new Map();
            this.closed = false;
            this.tick = 0;
            setTimeout(() => this.emit('open', {}), 50);
            this.timer = setInterval(() => {
                if (this.closed) return;
                this.tick += 1;
                const price = (100 + Math.random() * 50).toFixed(2);
                const time = new Date().toLocaleTimeString();
                this.emit('price', {
                    data: `<span class="price-tag">$${price}</span>` +
                        `<div id="ticker" minu-oob="#ticker">tick ${this.tick} · ${time}</div>`,
                });
            }, 2000);
        }

        addEventListener(type, listener) {
            if (!this.listeners.has(type)) this.listeners.set(type, []);
            this.listeners.get(type).push(listener);
        }

        removeEventListener(type, listener) {
            const list = this.listeners.get(type) || [];
            this.listeners.set(type, list.filter((item) => item !== listener));
        }

        emit(type, event) {
            (this.listeners.get(type) || []).forEach((listener) => listener({ type, ...event }));
        }

        close() {
            this.closed = true;
            clearInterval(this.timer);
        }
    }

    window.EventSource = StaticEventSource;

    document.addEventListener('DOMContentLoaded', () => {
        const banner = document.createElement('div');
        banner.className = 'static-demo-banner';
        banner.innerHTML = 'Static GitHub Pages demo — responses are simulated. ' +
            '<a href="https://github.com/aotr/minu#examples">Run locally</a> for the real Node server.';
        document.body.prepend(banner);
    });
})();
