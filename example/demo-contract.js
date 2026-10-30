/* Pure demo contract shared by the Node server and the static Pages adapter.
   It has no DOM or Node dependencies: both adapters own transport only. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory();
    else root.MinuDemoContract = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
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

    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    }[char]));

    const fullPage = (fragment) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Search results</title></head>
<body><main>${fragment}</main></body>
</html>`;

    const createDemoContract = () => {
        let timeRequests = 0;
        let fragmentRequests = 0;
        let cartItems = 0;
        let sseTick = 0;
        const now = () => new Date().toLocaleTimeString();

        return {
            time() {
                timeRequests += 1;
                return {
                    html: `
                        <div class="result">
                            <span class="tag">GET</span>
                            <strong>Server time</strong>
                            <div class="price-tag">${now()}</div>
                            <p class="muted">Poll request #${timeRequests}.</p>
                        </div>`,
                };
            },

            search(query) {
                const value = String(query || '').trim();
                const lower = value.toLowerCase();
                const matches = menu.filter(([name, tags]) => !lower || `${name} ${tags}`.toLowerCase().includes(lower));
                const items = matches.length
                    ? matches.map(([name, tags]) => `<li><strong>${escapeHtml(name)}</strong> <span class="muted">${escapeHtml(tags)}</span></li>`).join('')
                    : '<li class="muted">No matches. Try “coffee”, “tea”, or “bakery”.</li>';
                return {
                    html: fullPage(`
                        <div id="search-results">
                            <p class="muted">${matches.length} result(s) for “${escapeHtml(value || 'everything')}”</p>
                            <ul class="result-list">${items}</ul>
                        </div>`),
                };
            },

            form(fields) {
                return {
                    html: `
                        <div class="success-msg">
                            <strong>Thanks, ${escapeHtml(fields.get('name') || 'friend')}!</strong>
                            <p>The demo endpoint parsed this POST and rendered HTML back.</p>
                            <dl class="result-list">
                                <dt>Email</dt><dd>${escapeHtml(fields.get('email') || '(not provided)')}</dd>
                                <dt>Message</dt><dd>${escapeHtml(fields.get('message') || '(empty)')}</dd>
                                <dt>Method</dt><dd>POST · form-urlencoded</dd>
                            </dl>
                        </div>`,
                };
            },

            fragment() {
                fragmentRequests += 1;
                return {
                    html: `
                        <div class="swap-item">
                            <span class="tag">fragment ${fragmentRequests}</span>
                            <strong>Injected HTML</strong>
                            <p class="muted">Fetched at ${now()}</p>
                        </div>`,
                };
            },

            oob() {
                cartItems += 1;
                return {
                    html: `
                        <p>Main panel updated at ${now()}.</p>
                        <span id="cart-count" minu-oob="#cart-count">${cartItems}</span>
                        <div class="toast" minu-oob="beforeend:#toasts">Item added at ${now()}</div>`,
                };
            },

            trigger() {
                return {
                    html: `<p class="result">Response at ${now()}. The <code>Minu-Trigger</code> header should fire an event.</p>`,
                    headers: { 'Minu-Trigger': 'ping' },
                };
            },

            redirect() {
                return { html: '', headers: { 'Minu-Redirect': 'redirected.html' } };
            },

            refresh() {
                return { html: '<p>Reloading…</p>', headers: { 'Minu-Refresh': 'true' } };
            },

            jsonInput(fields, meta = {}) {
                return {
                    html: `
                        <div class="result">
                            <span class="tag">POST</span>
                            <strong>Server received</strong>
                            <dl class="result-list">
                                <dt><code>source</code></dt><dd>${escapeHtml(fields.get('source') || '(missing)')}</dd>
                                <dt><code>nested</code></dt><dd>${escapeHtml(fields.get('nested') || '(missing)')}</dd>
                                <dt><code>X-Demo-Token</code></dt><dd>${escapeHtml(meta.token || '(missing)')}</dd>
                                <dt>Content-Type</dt><dd>${escapeHtml(meta.contentType || '(none)')}</dd>
                            </dl>
                            <p class="muted">JSON attributes were decoded by Minu; the body is still form-urlencoded.</p>
                        </div>`,
                };
            },

            jsonResponse() {
                return {
                    html: JSON.stringify({ ok: true, items: [1, 2, 3] }),
                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                };
            },

            slow() {
                return { html: '<div class="result">Slow response arrived after 1.5 seconds.</div>' };
            },

            lazy() {
                return {
                    html: `
                        <div class="result">
                            <span class="tag">revealed</span>
                            <strong>Lazy section loaded</strong>
                            <p>This fragment was fetched only when the placeholder entered the viewport.</p>
                            <p class="muted">Fetched at ${now()}</p>
                        </div>`,
                };
            },

            ssePrice() {
                sseTick += 1;
                const price = (100 + Math.random() * 50).toFixed(2);
                return {
                    data: `<span class="price-tag">$${price}</span>` +
                        `<div id="ticker" minu-oob="#ticker">tick ${sseTick} · ${now()}</div>`,
                };
            },
        };
    };

    return { createDemoContract };
}));
