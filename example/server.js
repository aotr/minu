/* Zero-dependency server for all Minu examples.
   Run: npm run examples  →  http://localhost:3000 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const { createDemoContract } = require('./demo-contract.js');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT) || 3000;
const sseClients = new Set();
const demo = createDemoContract();
const types = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
};

const send = (response, status, body = '', headers = {}) => {
    response.writeHead(status, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        ...headers,
    });
    response.end(body);
};

const respond = (response, result) => send(response, 200, result.html, result.headers);

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

const broadcast = (payload) => {
    sseClients.forEach((client) => client.write(payload));
};

const handleDemo = async (url, request, response) => {
    const route = url.pathname;
    const reply = (result) => {
        respond(response, result);
        return true;
    };

    if (route === '/demo/time') return reply(demo.time());
    if (route === '/demo/search') return reply(demo.search(url.searchParams.get('q')));
    if (route === '/demo/fragment') return reply(demo.fragment());
    if (route === '/demo/oob') return reply(demo.oob());
    if (route === '/demo/trigger') return reply(demo.trigger());
    if (route === '/demo/redirect') return reply(demo.redirect());
    if (route === '/demo/refresh') return reply(demo.refresh());
    if (route === '/demo/json-response') return reply(demo.jsonResponse());
    if (route === '/demo/lazy') return reply(demo.lazy());

    if (route === '/demo/form' && request.method === 'POST') {
        return reply(demo.form(new URLSearchParams(await readBody(request))));
    }

    if (route === '/demo/json-input' && request.method === 'POST') {
        const fields = new URLSearchParams(await readBody(request));
        return reply(demo.jsonInput(fields, {
            token: request.headers['x-demo-token'],
            contentType: request.headers['content-type'],
        }));
    }

    if (route === '/demo/slow') {
        setTimeout(() => respond(response, demo.slow()), 1500);
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

    // Local preview of the project page lives under /docs/, while the Pages
    // artifact serves docs at the root. Map the shared files accordingly.
    if (pathname === '/docs/release.js' || pathname === '/docs/release.json' ||
        pathname === '/docs/demo-api.js') {
        pathname = pathname.slice(5);
    } else if (pathname.startsWith('/docs/dist/') || pathname.startsWith('/docs/example/')) {
        pathname = pathname.slice(5);
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

setInterval(() => {
    if (!sseClients.size) return;
    broadcast(`event: price\ndata: ${demo.ssePrice().data}\n\n`);
}, 2000);

server.listen(port, () => {
    console.log(`Minu examples: http://localhost:${port}/`);
    console.log(`SSE endpoint:   http://localhost:${port}/events`);
});
