const assert = require('node:assert');
const { afterEach, test } = require('node:test');
const { JSDOM } = require('jsdom');
const minu = require('../dist/minu.js');

let dom;

const tick = (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms));

const setup = (html) => {
    dom = new JSDOM(html, { url: 'http://localhost/', pretendToBeVisual: true });
    global.window = dom.window;
    global.document = dom.window.document;
    global.location = dom.window.location;
    global.CustomEvent = dom.window.CustomEvent;
    global.FormData = dom.window.FormData;
    global.URLSearchParams = dom.window.URLSearchParams;
    global.confirm = () => true;
    global.IntersectionObserver = class {
        observe() {}
        disconnect() {}
    };
    return dom;
};

const respond = (html, headers = {}) => {
    const calls = [];
    global.fetch = async (url, options = {}) => {
        calls.push({ url, options });
        return new Response(html, { status: 200, headers });
    };
    return calls;
};

const click = (element) => {
    const event = new dom.window.MouseEvent('click', { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
    return event;
};

afterEach(() => {
    try {
        minu.destroy();
    } catch (error) {
        // already destroyed
    }
    delete global.fetch;
    delete global.EventSource;
    if (dom) dom.window.close();
    dom = null;
});

test('loads into minu-content and fires bubbling events', async () => {
    setup('<div id="app" minu-get="/frag"><div minu-content>old</div></div>');
    const calls = respond('<b>new</b>');
    const seen = [];
    document.addEventListener('minu:contentLoaded', (event) => seen.push(event.detail.html));

    minu.init();
    await tick();

    assert.equal(calls.length, 1);
    assert.equal(document.querySelector('[minu-content]').innerHTML, '<b>new</b>');
    assert.deepEqual(seen, ['<b>new</b>']);
});

test('falls back to the single shared content area and prevents default clicks', async () => {
    setup('<button id="a" minu-get="/a" minu-trigger="click">A</button><div minu-content></div>');
    const calls = respond('<i>a</i>');

    minu.init();
    const event = click(document.getElementById('a'));
    await tick();

    assert.equal(event.defaultPrevented, true);
    assert.equal(calls.length, 1);
    assert.equal(document.querySelector('[minu-content]').innerHTML, '<i>a</i>');
});

test('init is idempotent', async () => {
    setup('<div minu-get="/frag"><div minu-content></div></div>');
    const calls = respond('once');

    minu.init();
    minu.init();
    await tick();

    assert.equal(calls.length, 1);
});

test('submits a form as POST with serialized fields', async () => {
    setup('<form id="f" minu-post="/save" minu-trigger="submit">' +
        '<input name="name" value="ada"><button type="submit">Go</button></form><div minu-content></div>');
    const calls = respond('saved');

    minu.init();
    const event = new dom.window.Event('submit', { bubbles: true, cancelable: true });
    document.getElementById('f').dispatchEvent(event);
    await tick();

    assert.equal(event.defaultPrevented, true);
    assert.equal(calls[0].url, '/save');
    assert.equal(calls[0].options.method, 'POST');
    assert.equal(calls[0].options.body.toString(), 'name=ada');
});

test('honors minu-target and minu-swap=beforeend', async () => {
    setup('<div id="list"></div><button id="add" minu-get="/item" minu-trigger="click" ' +
        'minu-target="#list" minu-swap="beforeend">Add</button>');
    respond('<li>x</li>');

    minu.init();
    click(document.getElementById('add'));
    await tick();

    assert.equal(document.getElementById('list').innerHTML, '<li>x</li>');
});

test('applies out-of-band swaps and keeps the main swap', async () => {
    setup('<div id="main">old</div><div id="cart">empty</div><div id="t" minu-get="/x"></div>');
    respond('<span>main new</span><div id="cart" minu-oob="#cart">2 items</div>');

    minu.init();
    await tick();

    assert.equal(document.getElementById('t').innerHTML, '<span>main new</span>');
    assert.equal(document.getElementById('cart').textContent, '2 items');
    assert.equal(document.getElementById('cart').hasAttribute('minu-oob'), false);
});

test('an OOB-only response does not wipe the main target', async () => {
    setup('<div id="main">keep</div><div id="cart">empty</div><div id="t" minu-get="/x"></div>');
    respond('<div id="cart" minu-oob="#cart">updated</div>');

    minu.init();
    await tick();

    assert.equal(document.getElementById('cart').textContent, 'updated');
    assert.equal(document.getElementById('main').textContent, 'keep');
});

test('dispatches events from Minu-Trigger response headers', async () => {
    setup('<div id="t" minu-get="/x"></div>');
    respond('ok', { 'Minu-Trigger': 'refresh, ping' });
    const seen = [];
    const element = document.getElementById('t');
    element.addEventListener('minu:trigger:refresh', () => seen.push('refresh'));
    element.addEventListener('minu:trigger:ping', () => seen.push('ping'));

    minu.init();
    await tick();

    assert.deepEqual(seen, ['refresh', 'ping']);
});

test('extracts a fragment with minu-select', async () => {
    setup('<div id="t" minu-get="/page" minu-select="#frag"></div>');
    respond('<html><body><div id="frag">picked</div><p>ignored</p></body></html>');

    minu.init();
    await tick();

    assert.equal(document.getElementById('t').innerHTML, '<div id="frag">picked</div>');
});

test('basic build strips scripts, handlers, and javascript: urls', async () => {
    setup('<div id="t" minu-get="/x"></div>');
    respond('<script>bad()</script><img src="x" onerror="bad()"><a href="javascript:bad()">x</a><b>ok</b>');

    minu.init();
    await tick();

    const html = document.getElementById('t').innerHTML;
    assert.equal(html.includes('<script'), false);
    assert.equal(html.includes('onerror'), false);
    assert.equal(html.includes('javascript:'), false);
    assert.equal(html.includes('<b>ok</b>'), true);
});

test('SSE messages swap into the target and close on demand', () => {
    setup('<div id="s" minu-sse="/events" minu-sse-event="price" minu-target="#price"></div>' +
        '<div id="price">0</div>');

    let stream;
    global.EventSource = class {
        constructor(url) {
            this.url = url;
            this.handlers = {};
            this.closed = false;
            stream = this;
        }
        addEventListener(type, handler) {
            (this.handlers[type] = this.handlers[type] || []).push(handler);
        }
        close() {
            this.closed = true;
        }
        emit(type, data) {
            (this.handlers[type] || []).forEach((handler) => handler({ data }));
        }
    };

    minu.init();
    assert.equal(stream.url, '/events');

    stream.emit('price', '<b>$9</b>');
    assert.equal(document.getElementById('price').innerHTML, '<b>$9</b>');

    minu.closeStream(document.getElementById('s'));
    assert.equal(stream.closed, true);
});

test('a new request aborts the previous one', async () => {
    setup('<button id="b" minu-get="/x" minu-trigger="click">Go</button>');
    const signals = [];
    global.fetch = (url, options) => new Promise((resolve, reject) => {
        signals.push(options.signal);
        options.signal.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
        });
    });

    minu.init();
    click(document.getElementById('b'));
    click(document.getElementById('b'));
    await tick();

    assert.equal(signals.length, 2);
    assert.equal(signals[0].aborted, true);
    assert.equal(signals[1].aborted, false);
});

test('toggles indicator and disabled state during a request', async () => {
    setup('<button id="b" minu-get="/x" minu-trigger="click" minu-disable="self" ' +
        'minu-indicator="#spinner">Go</button><span id="spinner"></span>');

    let release;
    global.fetch = () => new Promise((resolve) => {
        release = resolve;
    });

    minu.init();
    click(document.getElementById('b'));

    assert.equal(document.getElementById('b').disabled, true);
    assert.equal(document.getElementById('spinner').classList.contains('minu-requesting'), true);

    release(new Response('ok', { status: 200 }));
    await tick();

    assert.equal(document.getElementById('b').disabled, false);
    assert.equal(document.getElementById('spinner').classList.contains('minu-requesting'), false);
});

test('the once modifier removes the listener after the first event', async () => {
    setup('<button id="b" minu-get="/x" minu-trigger="click once">Go</button><div minu-content></div>');
    const calls = respond('ok');

    minu.init();
    click(document.getElementById('b'));
    click(document.getElementById('b'));
    await tick();

    assert.equal(calls.length, 1);
});
