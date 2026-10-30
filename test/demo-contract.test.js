const assert = require('node:assert');
const { test } = require('node:test');
const { createDemoContract } = require('../example/demo-contract.js');

test('demo contract owns shared responses and counters', () => {
    const demo = createDemoContract();

    assert.match(demo.time().html, /Poll request #1/);
    assert.match(demo.time().html, /Poll request #2/);
    assert.match(demo.search('coffee').html, /id="search-results"/);
    assert.match(demo.search('coffee').html, /Espresso/);
    assert.match(demo.search('nothing').html, /No matches/);

    const form = demo.form(new URLSearchParams({ name: '<Ada>', email: 'ada@example.com', message: 'Hi' }));
    assert.match(form.html, /&lt;Ada&gt;/);
    assert.match(form.html, /ada@example.com/);

    assert.match(demo.oob().html, /minu-oob="#cart-count"/);
    assert.match(demo.oob().html, /minu-oob="beforeend:#toasts"/);
    assert.equal(demo.trigger().headers['Minu-Trigger'], 'ping');
    assert.equal(demo.redirect().headers['Minu-Redirect'], 'redirected.html');
    assert.equal(demo.refresh().headers['Minu-Refresh'], 'true');
    assert.match(demo.ssePrice().data, /minu-oob="#ticker"/);
    assert.match(demo.jsonResponse().headers['Content-Type'], /application\/json/);
});
