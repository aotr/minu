const assert = require('node:assert');
const { afterEach, test } = require('node:test');
const { JSDOM } = require('jsdom');

let dom;
let secure;

const tick = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

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
};

afterEach(() => {
    if (secure) {
        try {
            secure.destroy();
        } catch (error) {
            // already destroyed
        }
    }
    delete require.cache[require.resolve('../dist/minu.secure.js')];
    delete global.fetch;
    if (dom) dom.window.close();
    dom = null;
    secure = null;
});

test('secure build preserves protocol attributes and OOB updates', async () => {
    setup('<div id="main">keep</div><div id="cart">empty</div><div id="t" minu-get="/x"></div>');
    secure = require('../dist/minu.secure.js');
    global.fetch = async () => new Response(
        '<div id="cart" minu-oob="#cart">2 items</div><button minu-get="/next">Next</button>'
    );

    secure.init();
    await tick(40);

    assert.equal(document.getElementById('cart').textContent, '2 items');
    assert.equal(document.getElementById('main').textContent, 'keep');
    assert.equal(document.querySelector('#t [minu-get]').getAttribute('minu-get'), '/next');
    assert.equal(document.getElementById('t').innerHTML.includes('minu-oob'), false);
});
