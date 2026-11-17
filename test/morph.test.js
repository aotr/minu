const assert = require('node:assert');
const { afterEach, test } = require('node:test');
const { JSDOM } = require('jsdom');
const minu = require('../dist/minu.js');
const morph = require('../dist/minu.morph.js');

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

const respond = (html) => {
    global.fetch = async () => new Response(html, { status: 200, headers: {} });
};

afterEach(() => {
    try {
        minu.destroy();
    } catch (error) {
        // already destroyed
    }
    delete global.fetch;
    if (dom) dom.window.close();
    dom = null;
});

test('morph reuses matching nodes and updates changed content', async () => {
    setup('<div id="app" minu-get="/frag" minu-swap="morph">' +
        '<p id="title">Old</p><p id="count">1</p></div>');
    respond('<p id="title">New</p><p id="count">2</p>');

    minu.registerSwap('morph', morph);
    minu.init();
    const title = document.getElementById('title');
    await tick();

    assert.equal(document.getElementById('title'), title);
    assert.equal(title.textContent, 'New');
    assert.equal(document.getElementById('count').textContent, '2');
});

test('morph keeps focus and typed values while the server changes them', async () => {
    setup('<div id="app" minu-get="/frag" minu-swap="morph">' +
        '<form><input id="name" name="name" value="server"></form></div>');
    respond('<form><input id="name" name="name" value="different"></form>');

    minu.registerSwap('morph', morph);
    minu.init();
    const input = document.getElementById('name');
    input.focus();
    input.value = 'typed';
    await tick();

    assert.equal(document.activeElement, input);
    assert.equal(input.value, 'typed');
    assert.equal(input.getAttribute('value'), 'different');
});

test('morph updates and removes attributes', async () => {
    setup('<div id="app" minu-get="/frag" minu-swap="morph">' +
        '<p id="box" class="a" data-old="1">x</p></div>');
    respond('<p id="box" class="b" data-new="2">x</p>');

    minu.registerSwap('morph', morph);
    minu.init();
    await tick();

    const box = document.getElementById('box');
    assert.equal(box.className, 'b');
    assert.equal(box.hasAttribute('data-old'), false);
    assert.equal(box.getAttribute('data-new'), '2');
});

test('morph works as an out-of-band swap mode', async () => {
    setup('<div id="cart"><span id="total">1</span></div>' +
        '<div id="app" minu-get="/frag"></div>');
    respond('<p>main</p><div id="cart" minu-oob="morph:#cart"><span id="total">2</span></div>');

    minu.registerSwap('morph', morph);
    minu.init();
    const total = document.getElementById('total');
    await tick();

    assert.equal(document.getElementById('total'), total);
    assert.equal(total.textContent, '2');
    assert.equal(document.getElementById('app').textContent, 'main');
});

test('morph does not inherit typed values across different ids', async () => {
    setup('<div id="app"><input id="a" value="server"><input id="b" value="server"></div>');
    const app = document.getElementById('app');
    const b = document.getElementById('b');
    b.value = 'draft-b';

    morph(app, '<input id="c" value="fresh"><input id="b" value="server">');

    assert.equal(document.getElementById('a'), null);
    assert.equal(document.getElementById('c').value, 'fresh');
    assert.equal(document.getElementById('b'), b);
    assert.equal(b.value, 'draft-b');
});

test('morph inserts and removes elements by id', async () => {
    setup('<div id="app"><p id="one">1</p></div>');
    const app = document.getElementById('app');
    const one = document.getElementById('one');

    morph(app, '<p id="zero">0</p><p id="one">1b</p><p id="two">2</p>');

    assert.equal(document.getElementById('one'), one);
    assert.equal(one.textContent, '1b');
    assert.equal(document.getElementById('zero').textContent, '0');
    assert.equal(document.getElementById('two').textContent, '2');
    assert.deepEqual(Array.from(app.children).map((node) => node.id), ['zero', 'one', 'two']);

    morph(app, '<p id="one">1c</p>');

    assert.equal(document.getElementById('one'), one);
    assert.equal(one.textContent, '1c');
    assert.equal(document.getElementById('zero'), null);
    assert.equal(document.getElementById('two'), null);
});

test('morph preserves values when elements are reordered', async () => {
    setup('<div id="app"><input id="x" value="a"><input id="y" value="b"></div>');
    const app = document.getElementById('app');
    const x = document.getElementById('x');
    x.value = 'typed-x';

    morph(app, '<input id="y" value="b"><input id="x" value="a">');

    assert.deepEqual(Array.from(app.children).map((node) => node.id), ['y', 'x']);
    assert.equal(document.getElementById('x'), x);
    assert.equal(x.value, 'typed-x');
});
