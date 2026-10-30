/* Response protocol seam: OOB extraction, sanitization, select, main payload. */

export const PROTOCOL_ATTRIBUTES = [
    'minu-get',
    'minu-post',
    'minu-put',
    'minu-patch',
    'minu-delete',
    'minu-sse',
    'minu-sse-event',
    'minu-trigger',
    'minu-target',
    'minu-swap',
    'minu-vals',
    'minu-include',
    'minu-headers',
    'minu-credentials',
    'minu-timeout',
    'minu-confirm',
    'minu-prevent',
    'minu-select',
    'minu-loader',
    'minu-indicator',
    'minu-disable',
    'minu-content',
    'minu-oob',
];

const parseFragment = (html) => {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template;
};

const markerParts = (entry) => {
    const marker = entry.marker || '';
    let mode = 'outerHTML';
    let selector = marker;
    const colon = marker.indexOf(':');

    if (colon > -1) {
        mode = marker.slice(0, colon) || mode;
        selector = marker.slice(colon + 1);
    }
    if (selector === 'true' && entry.id) selector = `#${entry.id}`;

    return { mode, selector };
};

export function createResponsePipeline({ sanitize, queryOne, swap }) {
    const extractOutOfBand = (fragment) => {
        const nodes = Array.from(fragment.querySelectorAll('[minu-oob]')).filter((node) => {
            const parent = node.parentElement;
            return !parent || !parent.closest('[minu-oob]');
        });

        return nodes.map((node) => {
            const entry = {
                marker: node.getAttribute('minu-oob'),
                id: node.id,
                html: node.outerHTML,
            };
            node.remove();
            return entry;
        });
    };

    const applyOutOfBand = (entries) => {
        entries.forEach((entry) => {
            const { mode, selector } = markerParts(entry);
            if (!selector) return;

            const cleaned = parseFragment(sanitize(entry.html)).content.firstElementChild;
            if (!cleaned) return;
            cleaned.removeAttribute('minu-oob');

            const target = queryOne(selector);
            if (target) swap(target, cleaned.outerHTML, mode);
        });
    };

    const prepare = (element, html) => {
        const selector = element.getAttribute('minu-select');
        const hasOob = html.indexOf('minu-oob') !== -1;

        if (!hasOob && !selector) return sanitize(html);

        const raw = parseFragment(html);
        const entries = hasOob ? extractOutOfBand(raw.content) : [];
        applyOutOfBand(entries);

        const output = sanitize(raw.innerHTML);
        if (!selector) {
            return entries.length && !output.trim() ? null : output;
        }

        try {
            const selected = parseFragment(output).content.querySelector(selector);
            return selected ? selected.outerHTML : null;
        } catch (error) {
            console.warn('minu: invalid minu-select selector', selector);
            return null;
        }
    };

    return { prepare };
}
