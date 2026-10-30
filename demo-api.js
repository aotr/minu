/* Static GitHub Pages adapter for the example gallery.
   On github.io (or ?static-demo), it simulates the demo endpoints in the browser
   so the same example pages work without the Node server.
   Locally, without the flag, this file is a no-op and example/server.js handles everything. */
(() => {
    const staticDemo = location.hostname.endsWith('github.io') ||
        new URLSearchParams(location.search).has('static-demo');
    if (!staticDemo) return;

    const factory = window.MinuDemoContract;
    if (!factory) {
        console.warn('minu: demo contract missing; load example/demo-contract.js first');
        return;
    }

    const contract = factory.createDemoContract();
    const nativeFetch = window.fetch.bind(window);

    const reply = (result) => new Response(result.html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store',
            ...result.headers,
        },
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

    window.fetch = async (input, options = {}) => {
        const request = input instanceof Request ? input : null;
        const url = new URL(request ? request.url : String(input), location.href);
        const path = url.pathname.includes('/demo/')
            ? url.pathname.slice(url.pathname.indexOf('/demo/'))
            : url.pathname;
        if (!path.startsWith('/demo/')) return nativeFetch(input, options);

        const method = (options.method || (request && request.method) || 'GET').toUpperCase();

        if (path === '/demo/time') return reply(contract.time());
        if (path === '/demo/search') return reply(contract.search(url.searchParams.get('q')));
        if (path === '/demo/fragment') return reply(contract.fragment());
        if (path === '/demo/oob') return reply(contract.oob());
        if (path === '/demo/trigger') return reply(contract.trigger());
        if (path === '/demo/redirect') return reply(contract.redirect());
        if (path === '/demo/refresh') return reply(contract.refresh());
        if (path === '/demo/json-response') return reply(contract.jsonResponse());
        if (path === '/demo/lazy') return reply(contract.lazy());

        if (path === '/demo/form' && method === 'POST') {
            return reply(contract.form(await readBody(options.body)));
        }

        if (path === '/demo/json-input' && method === 'POST') {
            return reply(contract.jsonInput(await readBody(options.body), {
                token: header(options.headers, 'x-demo-token'),
                contentType: header(options.headers, 'content-type'),
            }));
        }

        if (path === '/demo/slow') {
            await sleep(1500, options.signal);
            return reply(contract.slow());
        }

        return new Response('Not found', { status: 404 });
    };

    class StaticEventSource {
        constructor(url) {
            this.url = String(url);
            this.listeners = new Map();
            this.closed = false;
            setTimeout(() => this.emit('open', {}), 50);
            this.timer = setInterval(() => {
                if (this.closed) return;
                this.emit('price', { data: contract.ssePrice().data });
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
