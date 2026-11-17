/* Morph swap plugin. Register with: minu.registerSwap('morph', morph) */

const syncAttributes = (live, incoming) => {
    Array.from(live.attributes).forEach((attr) => {
        if (!incoming.hasAttribute(attr.name)) live.removeAttribute(attr.name);
    });
    Array.from(incoming.attributes).forEach((attr) => {
        if (live.getAttribute(attr.name) !== attr.value) {
            live.setAttribute(attr.name, attr.value);
        }
    });
};

const morphChildren = (liveParent, incomingParent) => {
    const liveKids = Array.from(liveParent.childNodes);
    const incomingKids = Array.from(incomingParent.childNodes);
    const used = new Set();
    let cursor = liveParent.firstChild;

    const pick = (incoming, index) => {
        if (incoming.nodeType === 1 && incoming.id) {
            // An id is identity: never reuse a live node with a different id,
            // or the new element inherits the old one's typed state.
            return liveKids.find((node) => !used.has(node) && node.nodeType === 1 && node.id === incoming.id) || null;
        }

        const sameIndex = liveKids[index];
        if (sameIndex && !used.has(sameIndex) && sameIndex.nodeType === incoming.nodeType) {
            if (incoming.nodeType !== 1 || sameIndex.tagName === incoming.tagName) return sameIndex;
        }

        if (incoming.nodeType === 1) {
            return liveKids.find((node) => !used.has(node) && node.nodeType === 1 && node.tagName === incoming.tagName);
        }

        return liveKids.find((node) => !used.has(node) && node.nodeType === incoming.nodeType);
    };

    incomingKids.forEach((incoming, index) => {
        const match = pick(incoming, index);

        if (!match) {
            liveParent.insertBefore(incoming.cloneNode(true), cursor);
            return;
        }

        used.add(match);
        if (match !== cursor) liveParent.insertBefore(match, cursor);
        morphNode(match, incoming);
        if (match === cursor) cursor = cursor.nextSibling;
    });

    liveKids.forEach((node) => {
        if (!used.has(node) && node.parentNode === liveParent) liveParent.removeChild(node);
    });
};

const morphNode = (live, incoming) => {
    if (live.nodeType !== incoming.nodeType) {
        live.replaceWith(incoming.cloneNode(true));
        return;
    }

    if (live.nodeType === 1) {
        if (live.tagName !== incoming.tagName) {
            live.replaceWith(incoming.cloneNode(true));
            return;
        }
        syncAttributes(live, incoming);
        morphChildren(live, incoming);
        return;
    }

    if (live.nodeValue !== incoming.nodeValue) live.nodeValue = incoming.nodeValue;
};

export default function morph(target, html) {
    if (!target) return;

    const template = document.createElement('template');
    template.innerHTML = html;

    const root = template.content.children.length === 1 ? template.content.firstElementChild : null;
    const source = root && target.id && root.id === target.id ? root : template.content;

    const active = target.contains(document.activeElement) ? document.activeElement : null;
    const selection = active && typeof active.selectionStart === 'number'
        ? [active.selectionStart, active.selectionEnd, active.selectionDirection]
        : null;

    const scrolls = [];
    Array.from(target.querySelectorAll('*')).forEach((node) => {
        if (node.scrollTop || node.scrollLeft) scrolls.push([node, node.scrollTop, node.scrollLeft]);
    });

    morphChildren(target, source);

    if (active && document.activeElement !== active && active.isConnected) {
        active.focus({ preventScroll: true });
        try {
            if (selection) active.setSelectionRange(...selection);
        } catch (error) {
            // input type does not support selection ranges
        }
    }

    scrolls.forEach(([node, top, left]) => {
        node.scrollTop = top;
        node.scrollLeft = left;
    });
}
