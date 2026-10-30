/* Zero-dependency server for all Minu examples.
   Run: npm run examples  →  http://localhost:3000 */
const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT) || 3000;
const sseClients = new Set();
const types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}[char]));

const send = (response, status, body = '', headers = {}) => {
    response.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        ...headers,
    });
    response.end(body);
};

const readBody = (request) => new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk) => {
        body += chunk;
        if (body.length > 1e6) request.destroy();
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
});

const fullPage = (fragment) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Search results</title></head>
<body><main>${fragment}</main></body>
</html>`;

let timeRequests = 0;
let fragmentRequests = 0;
let cartItems = 0;

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

const broadcast = (payload) => {
    sseClients.forEach((client) => client.write(payload));
};

const handleDemo = async (url, request, response) => {
    const now = new Date().toLocaleTimeString();

    if (url.pathname === '/demo/time') {
        timeRequests += 1;
        send(response, 200, `
            <div class="result">
                <span class="tag">GET</span>
                <strong>Server time</strong>
                <div class="price-tag">${now}</div>
                <p class="muted">Poll request #${timeRequests}. Reload the page or hide the tab to see polling pause.</p>
            </div>`);
        return true;
    }

    if (url.pathname === '/demo/search') {
        const query = (url.searchParams.get('q') || '').trim();
        const lower = query.toLowerCase();
        const matches = menu.filter(([name, tags]) => !lower || `${name} ${tags}`.toLowerCase().includes(lower));
        const items = matches.length
            ? matches.map(([name, tags]) => `<li><strong>${escapeHtml(name)}</strong> <span class="muted">${escapeHtml(tags)}</span></li>`).join('')
            : '<li class="muted">No matches. Try “coffee”, “tea”, or “bakery”.</li>';
        send(response, 200, fullPage(`
            <div id="search-results">
                <p class="muted">${matches.length} result(s) for “${escapeHtml(query || 'everything')}”</p>
                <ul class="result-list">${items}</ul>
            </div>`));
        return true;
    }

    if (url.pathname === '/demo/form' && request.method === 'POST') {
        const fields = new URLSearchParams(await readBody(request));
        const name = fields.get('name') || 'friend';
        const email = fields.get('email') || '(not provided)';
        const message = fields.get('message') || '(empty)';
        send(response, 200, `
            <div class="success-msg">
                <strong>Thanks, ${escapeHtml(name)}!</strong>
                <p>The demo server parsed this POST body and rendered HTML back.</p>
                <dl class="result-list">
                    <dt>Email</dt><dd>${escapeHtml(email)}</dd>
                    <dt>Message</dt><dd>${escapeHtml(message)}</dd>
                    <dt>Method</dt><dd>POST · form-urlencoded</dd>
                </dl>
            </div>`);
        return true;
    }

    if (url.pathname === '/demo/fragment') {
        fragmentRequests += 1;
        send(response, 200, `
            <div class="swap-item">
                <span class="tag">fragment ${fragmentRequests}</span>
                <strong>Injected HTML</strong>
                <p class="muted">Fetched at ${now}</p>
            </div>`);
        return true;
    }

    if (url.pathname === '/demo/oob') {
        cartItems += 1;
        send(response, 200, `
            <p>Main panel updated at ${now}.</p>
            <span id="cart-count" minu-oob="#cart-count">${cartItems}</span>
            <div class="toast" minu-oob="beforeend:#toasts">Item added at ${now}</div>`);
        return true;
    }

    if (url.pathname === '/demo/trigger') {
        send(response, 200, `<p class="result">Response at ${now}. The <code>Minu-Trigger</code> header should fire an event.</p>`,
            { 'Minu-Trigger': 'ping' });
        return true;
    }

    if (url.pathname === '/demo/redirect') {
        send(response, 200, '', { 'Minu-Redirect': '/example/headers/redirected.html' });
        return true;
    }

    if (url.pathname === '/demo/refresh') {
        send(response, 200, '<p>Reloading…</p>', { 'Minu-Refresh': 'true' });
        return true;
    }

    if (url.pathname === '/demo/json-input' && request.method === 'POST') {
        const fields = new URLSearchParams(await readBody(request));
        send(response, 200, `
            <div class="result">
                <span class="tag">POST</span>
                <strong>Server received</strong>
                <dl class="result-list">
                    <dt><code>source</code></dt><dd>${escapeHtml(fields.get('source') || '(missing)')}</dd>
                    <dt><code>nested</code></dt><dd>${escapeHtml(fields.get('nested') || '(missing)')}</dd>
                    <dt><code>X-Demo-Token</code></dt><dd>${escapeHtml(request.headers['x-demo-token'] || '(missing)')}</dd>
                    <dt>Content-Type</dt><dd>${escapeHtml(request.headers['content-type'] || '(none)')}</dd>
                </dl>
                <p class="muted">The two JSON attributes were decoded by Minu; the body is still form-urlencoded, not JSON.</p>
            </div>`);
        return true;
    }

    if (url.pathname === '/demo/json-response') {
        send(response, 200, JSON.stringify({ ok: true, items: [1, 2, 3] }),
            { 'Content-Type': 'application/json; charset=utf-8' });
        return true;
    }

    if (url.pathname === '/demo/slow') {
        setTimeout(() => {
            send(response, 200, `<div class="result">Slow response arrived after 1.5 seconds.</div>`);
        }, 1500);
        return true;
    }

    if (url.pathname === '/demo/lazy') {
        send(response, 200, `
            <div class="result">
                <span class="tag">revealed</span>
                <strong>Lazy section loaded</strong>
                <p>This fragment was fetched only when the placeholder entered the viewport.</p>
                <p class="muted">Fetched at ${now}</p>
            </div>`);
        return true;
    }

    return false;
};

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

    if (url.pathname === '/events') {
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        });
        response.write('retry: 3000\n\n');
        sseClients.add(response);
        request.on('close', () => sseClients.delete(response));
        return;
    }

    try {
        if (url.pathname.startsWith('/demo/') && await handleDemo(url, request, response)) return;
    } catch (error) {
        console.error(error);
        if (!response.headersSent) send(response, 500, 'Demo server error');
        return;
    }

    let pathname;
    try {
        pathname = decodeURIComponent(url.pathname);
    } catch (error) {
        send(response, 400, 'Bad request');
        return;
    }

    if (pathname === '/') {
        response.writeHead(302, { Location: '/example/' });
        response.end();
        return;
    }
    if (pathname.endsWith('/')) pathname += 'index.html';

    const file = path.resolve(root, `.${pathname}`);
    if (!file.startsWith(root + path.sep)) {
        send(response, 403, 'Forbidden');
        return;
    }

    fs.readFile(file, (error, contents) => {
        if (error) {
            send(response, 404, 'Not found');
            return;
        }
        response.writeHead(200, {
            'Content-Type': types[path.extname(file)] || 'application/octet-stream',
            'Cache-Control': 'no-store',
        });
        response.end(contents);
    });
});

let tick = 0;
setInterval(() => {
    if (!sseClients.size) return;
    tick += 1;
    const price = (100 + Math.random() * 50).toFixed(2);
    const time = new Date().toLocaleTimeString();
    broadcast(`event: price\ndata: <span class="price-tag">$${price}</span>` +
        `<div id="ticker" minu-oob="#ticker">tick ${tick} · ${time}</div>\n\n`);
}, 2000);

server.listen(port, () => {
    console.log(`Minu examples: http://localhost:${port}/`);
    console.log(`SSE endpoint:   http://localhost:${port}/events`);
});
