/* minu core — all logic lives here, entries only provide a sanitizer. */

const VERBS = ['get', 'post', 'put', 'patch', 'delete'];
const DEFAULT_SELECTOR = '[minu-get],[minu-post],[minu-put],[minu-patch],[minu-delete],[minu-sse]';

const parseDuration = (value) => {
    const match = /^(\d+(?:\.\d+)?)(ms|s)?$/.exec(String(value || '').trim());
    if (!match) return 0;
    const number = parseFloat(match[1]);
    return match[2] === 's' ? number * 1000 : number;
};

const parseJson = (value, fallback) => {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn('minu: invalid JSON in attribute', value);
        return fallback;
    }
};

const queryAll = (selector) => {
    try {
        return Array.from(document.querySelectorAll(selector));
    } catch (error) {
        console.warn('minu: invalid selector', selector);
        return [];
    }
};

const queryOne = (selector) => {
    try {
        return document.querySelector(selector);
    } catch (error) {
        console.warn('minu: invalid selector', selector);
        return null;
    }
};

const parseTrigger = (raw) => {
    const parts = String(raw || 'load').trim().split(/\s+/).filter(Boolean);
    const trigger = {
        event: parts[0] || 'load',
        interval: 0,
        once: false,
        delay: 0,
        throttle: 0,
        changed: false,
        from: null,
    };

    if (trigger.event === 'every') {
        trigger.interval = parseDuration(parts[1]);
    }

    for (let index = 1; index < parts.length; index += 1) {
        const part = parts[index];
        if (part === 'once') trigger.once = true;
        else if (part === 'changed') trigger.changed = true;
        else if (part.startsWith('delay:')) trigger.delay = parseDuration(part.slice(6));
        else if (part.startsWith('throttle:')) trigger.throttle = parseDuration(part.slice(9));
        else if (part.startsWith('from:')) trigger.from = part.slice(5);
    }

    return trigger;
};

const appendControl = (data, node) => {
    if (!node.name || node.disabled) return;
    if (node.tagName === 'SELECT') {
        Array.from(node.options).forEach((option) => {
            if (option.selected) data.append(node.name, option.value);
        });
    } else if (node.type === 'checkbox' || node.type === 'radio') {
        if (node.checked) data.append(node.name, node.value);
    } else if (node.type === 'file') {
        Array.from(node.files || []).forEach((file) => data.append(node.name, file));
    } else {
        data.append(node.name, node.value);
    }
};

export function createMinu(sanitize) {
    const settings = { headers: {}, timeout: 0, credentials: '' };
    const initialized = new Set();
    const states = new Map();
    const disabledNodes = new Map();

    const getState = (element) => {
        let state = states.get(element);
        if (!state) {
            state = {
                controller: null,
                listeners: [],
                timeouts: [],
                interval: null,
                observers: [],
                stream: null,
                lastValue: undefined,
                debounce: null,
                throttleTimer: null,
                lastRun: 0,
            };
            states.set(element, state);
        }
        return state;
    };

    const fire = (element, name, detail = {}, cancelable = false) => {
        const event = new CustomEvent(name, {
            detail,
            bubbles: true,
            composed: true,
            cancelable,
        });
        return element.dispatchEvent(event);
    };

    const listen = (state, node, type, handler) => {
        node.addEventListener(type, handler);
        state.listeners.push([node, type, handler]);
    };

    const safeConfirm = (message) => {
        if (!message) return true;
        if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
            return window.confirm(message);
        }
        return true;
    };

    const getVerb = (element) => VERBS.find((verb) => element.hasAttribute(`minu-${verb}`)) || 'get';

    const getUrl = (element) => {
        const url = element.getAttribute(`minu-${getVerb(element)}`);
        return url ? url.trim() : '';
    };

    const resolveTarget = (element) => {
        const selector = element.getAttribute('minu-target');
        if (selector) {
            if (selector === 'this') return element;
            const explicit = queryOne(selector);
            if (explicit) return explicit;
        }

        const inner = element.querySelector('[minu-content]');
        if (inner) return inner;

        // ponytail: legacy demos share one global content area. Explicit
        // minu-target is required as soon as a page has more than one.
        const all = document.querySelectorAll('[minu-content]');
        return all.length === 1 ? all[0] : element;
    };

    const resolveLoader = (element) => {
        const inner = element.querySelector('[minu-loader]');
        if (inner) return inner;
        const all = document.querySelectorAll('[minu-loader]');
        return all.length === 1 ? all[0] : null;
    };

    const resolveList = (element, attribute, allowSelf) => {
        const value = element.getAttribute(attribute);
        if (!value) return [];
        if (allowSelf && (value === 'self' || value === 'this')) return [element];
        return queryAll(value);
    };

    const swap = (target, html, mode) => {
        if (!target) return;
        switch ((mode || 'innerHTML').toLowerCase()) {
            case 'none':
                return;
            case 'outerhtml':
                target.outerHTML = html;
                return;
            case 'beforebegin':
            case 'afterbegin':
            case 'beforeend':
            case 'afterend':
                target.insertAdjacentHTML(mode.toLowerCase(), html);
                return;
            case 'delete':
                target.remove();
                return;
            default:
                target.innerHTML = html;
        }
    };

    const processOutOfBand = (fragment) => {
        fragment.querySelectorAll('[minu-oob]').forEach((node) => {
            const marker = node.getAttribute('minu-oob');
            let mode = 'outerHTML';
            let selector = marker;
            const colon = marker.indexOf(':');

            if (colon > -1) {
                mode = marker.slice(0, colon) || mode;
                selector = marker.slice(colon + 1);
            }
            if (selector === 'true' && node.id) selector = `#${node.id}`;

            const target = selector ? queryOne(selector) : null;
            node.removeAttribute('minu-oob');
            if (target) swap(target, node.outerHTML, mode);
            node.remove();
        });
    };

    const prepareHtml = (element, html) => {
        let output = sanitize(html);
        const selector = element.getAttribute('minu-select');
        if (output.indexOf('minu-oob') === -1 && !selector) return output;

        const hadOob = output.indexOf('minu-oob') !== -1;
        const template = document.createElement('template');
        template.innerHTML = output;
        processOutOfBand(template.content);

        if (selector) {
            try {
                const selected = template.content.querySelector(selector);
                return selected ? selected.outerHTML : null;
            } catch (error) {
                console.warn('minu: invalid minu-select selector', selector);
                return null;
            }
        }

        const rest = template.innerHTML;
        // An OOB-only response must not wipe the main target.
        return hadOob && !rest.trim() ? null : rest;
    };

    const collectData = (element) => {
        const data = new FormData();
        const form = element.tagName === 'FORM' ? element : element.closest('form');

        if (form) {
            new FormData(form).forEach((value, key) => data.append(key, value));
        }

        const include = element.getAttribute('minu-include');
        if (include) {
            queryAll(include).forEach((node) => {
                if (node.tagName === 'FORM') {
                    new FormData(node).forEach((value, key) => data.append(key, value));
                } else {
                    appendControl(data, node);
                }
            });
        }

        const values = parseJson(element.getAttribute('minu-vals'), null);
        if (values) {
            Object.keys(values).forEach((key) => {
                const value = values[key];
                data.append(key, value && typeof value === 'object' ? JSON.stringify(value) : value);
            });
        }

        let hasFile = false;
        data.forEach((value) => {
            if (typeof value !== 'string') hasFile = true;
        });

        return { data, hasFile };
    };

    const requestHeaders = (element) => {
        return Object.assign(
            { 'X-Minu-Request': 'true' },
            settings.headers,
            parseJson(element.getAttribute('minu-headers'), {}) || {}
        );
    };

    const request = (element) => {
        const url = getUrl(element);
        if (!url) return;

        const method = getVerb(element).toUpperCase();
        if (!safeConfirm(element.getAttribute('minu-confirm'))) return;

        if (!fire(element, 'minu:beforeRequest', { url, method, element }, true)) return;

        const state = getState(element);
        if (state.controller) state.controller.abort();

        const controller = new AbortController();
        state.controller = controller;

        const { data, hasFile } = collectData(element);
        const params = new URLSearchParams();
        data.forEach((value, key) => params.append(key, typeof value === 'string' ? value : ''));

        let requestUrl = url;
        let body;
        if (method === 'GET') {
            try {
                const parsed = new URL(url, document.baseURI);
                params.forEach((value, key) => parsed.searchParams.append(key, value));
                requestUrl = parsed.toString();
            } catch (error) {
                const separator = url.indexOf('?') === -1 ? '?' : '&';
                requestUrl = `${url}${separator}${params.toString()}`;
            }
        } else if (hasFile) {
            body = data;
        } else if (params.toString()) {
            body = params;
        }

        const timeoutAttribute = element.getAttribute('minu-timeout');
        const timeout = timeoutAttribute
            ? parseInt(timeoutAttribute, 10) || 0
            : settings.timeout;
        let timer = null;
        let timedOut = false;
        if (timeout > 0) {
            timer = setTimeout(() => {
                timedOut = true;
                controller.abort();
            }, timeout);
        }

        const indicators = resolveList(element, 'minu-indicator', true);
        indicators.forEach((node) => node.classList.add('minu-requesting'));

        const loader = resolveLoader(element);
        if (loader) loader.style.display = 'block';

        const disable = resolveList(element, 'minu-disable', true);
        disable.forEach((node) => {
            const record = disabledNodes.get(node);
            if (record) record.count += 1;
            else disabledNodes.set(node, { count: 1, wasDisabled: node.disabled });
            node.disabled = true;
            node.setAttribute('aria-busy', 'true');
        });

        const cleanup = () => {
            if (state.controller !== controller) return false;
            clearTimeout(timer);
            state.controller = null;
            indicators.forEach((node) => node.classList.remove('minu-requesting'));
            if (loader) loader.style.display = 'none';
            disable.forEach((node) => {
                const record = disabledNodes.get(node);
                if (!record) return;
                record.count -= 1;
                if (record.count <= 0) {
                    node.disabled = record.wasDisabled;
                    node.removeAttribute('aria-busy');
                    disabledNodes.delete(node);
                }
            });
            return true;
        };

        let ok = false;
        fetch(requestUrl, {
            method,
            body,
            headers: requestHeaders(element),
            credentials: element.getAttribute('minu-credentials') || settings.credentials || undefined,
            signal: controller.signal,
        })
            .then((response) => {
                handleResponseHeaders(response, element, requestUrl);
                if (response.status === 204 || response.status === 205) {
                    ok = true;
                    return null;
                }
                if (!response.ok) {
                    const error = new Error(`HTTP ${response.status} ${response.statusText}`);
                    error.status = response.status;
                    throw error;
                }
                return response.text().then((html) => {
                    ok = true;
                    const prepared = prepareHtml(element, html);
                    if (prepared !== null) {
                        swap(resolveTarget(element), prepared, element.getAttribute('minu-swap'));
                    }
                    fire(element, 'minu:contentLoaded', {
                        html: prepared || '',
                        url: requestUrl,
                        method,
                    });
                });
            })
            .catch((error) => {
                if (error && error.name === 'AbortError') {
                    if (timedOut) {
                        console.error('minu: Request timed out', error);
                        fire(element, 'minu:contentError', { error, url: requestUrl });
                    }
                    return;
                }
                console.error('minu: Failed to load content', error);
                fire(element, 'minu:contentError', { error, url: requestUrl });
            })
            .finally(() => {
                if (cleanup()) {
                    fire(element, 'minu:afterRequest', { url: requestUrl, method, ok });
                }
            });
    };

    const handleResponseHeaders = (response, element, url) => {
        const trigger = response.headers.get('Minu-Trigger');
        if (trigger) {
            trigger
                .split(',')
                .map((name) => name.trim())
                .filter(Boolean)
                .forEach((name) => fire(element, `minu:trigger:${name}`, { name, url }));
        }

        const redirect = response.headers.get('Minu-Redirect');
        if (redirect && typeof location !== 'undefined') location.assign(redirect);

        const refresh = response.headers.get('Minu-Refresh');
        if (refresh && refresh.toLowerCase() === 'true' && typeof location !== 'undefined') {
            location.reload();
        }
    };

    const setupTrigger = (element, state) => {
        const trigger = parseTrigger(element.getAttribute('minu-trigger'));

        if (trigger.event === 'every') {
            if (!trigger.interval) return;
            state.interval = setInterval(() => {
                if (!document.hidden) request(element);
            }, trigger.interval);
            return;
        }

        if (trigger.event === 'revealed' || trigger.event === 'intersect') {
            if (typeof IntersectionObserver === 'undefined') {
                request(element);
                return;
            }
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    if (trigger.event === 'revealed') observer.disconnect();
                    request(element);
                });
            });
            observer.observe(element);
            state.observers.push(observer);
            return;
        }

        if (trigger.event === 'load') {
            if (trigger.delay) {
                state.timeouts.push(setTimeout(() => request(element), trigger.delay));
            } else {
                request(element);
            }
            return;
        }

        let node = element;
        if (trigger.from) {
            node = queryOne(trigger.from) || element;
        }

        const run = () => {
            if (trigger.delay) {
                clearTimeout(state.debounce);
                state.debounce = setTimeout(() => request(element), trigger.delay);
                return;
            }
            if (trigger.throttle) {
                const now = Date.now();
                const wait = trigger.throttle - (now - state.lastRun);
                if (wait <= 0) {
                    state.lastRun = now;
                    request(element);
                } else {
                    clearTimeout(state.throttleTimer);
                    state.throttleTimer = setTimeout(() => {
                        state.lastRun = Date.now();
                        request(element);
                    }, wait);
                }
                return;
            }
            request(element);
        };

        const handler = (event) => {
            if ((event.type === 'submit' || event.type === 'click') &&
                element.getAttribute('minu-prevent') !== 'false') {
                event.preventDefault();
            }

            if (trigger.changed && /^(INPUT|SELECT|TEXTAREA)$/.test(element.tagName)) {
                const value = 'value' in element ? element.value : element.getAttribute('value');
                if (value === state.lastValue) return;
                state.lastValue = value;
            }

            if (trigger.once) node.removeEventListener(trigger.event, handler);
            run();
        };

        listen(state, node, trigger.event, handler);
    };

    const connectStream = (element) => {
        const url = element.getAttribute('minu-sse');
        if (!url || typeof EventSource === 'undefined') return;

        const state = getState(element);
        closeStream(element);

        const names = (element.getAttribute('minu-sse-event') || 'message')
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean);

        const stream = new EventSource(url);
        state.stream = stream;

        names.forEach((name) => {
            stream.addEventListener(name, (event) => {
                const html = prepareHtml(element, event.data);
                if (html !== null) {
                    swap(resolveTarget(element), html, element.getAttribute('minu-swap'));
                }
                fire(element, 'minu:sseMessage', { data: event.data, event: name, url });
            });
        });

        stream.addEventListener('open', () => fire(element, 'minu:sseOpen', { url }));
        stream.addEventListener('error', (error) => fire(element, 'minu:sseError', { error, url }));
    };

    const closeStream = (element) => {
        const close = (state) => {
            if (state && state.stream) {
                state.stream.close();
                state.stream = null;
            }
        };
        if (element) close(states.get(element));
        else states.forEach(close);
    };

    const setupElement = (element) => {
        if (initialized.has(element)) return;
        initialized.add(element);

        const state = getState(element);
        const url = getUrl(element);
        const trigger = element.getAttribute('minu-trigger') || 'load';

        fire(element, 'minu:contentSetup', {
            url: url || element.getAttribute('minu-sse') || '',
            trigger,
        });

        if (element.hasAttribute('minu-sse')) connectStream(element);
        if (url) setupTrigger(element, state);
    };

    const init = (selector = DEFAULT_SELECTOR) => {
        queryAll(selector).forEach(setupElement);
    };

    const reloadComponents = (selectors) => {
        (Array.isArray(selectors) ? selectors : [selectors]).forEach((selector) => {
            queryAll(selector).forEach((element) => {
                if (getUrl(element)) request(element);
            });
        });
    };

    let deprecationWarned = false;
    const reloadComponent = (selectors) => {
        if (!deprecationWarned) {
            console.warn('minu: reloadComponent() is deprecated. Use reloadComponents() instead.');
            deprecationWarned = true;
        }
        return reloadComponents(selectors);
    };

    const config = (options = {}) => {
        if (options.headers) settings.headers = Object.assign({}, settings.headers, options.headers);
        if (options.timeout != null) settings.timeout = parseInt(options.timeout, 10) || 0;
        if (options.credentials != null) settings.credentials = options.credentials;
    };

    const destroy = () => {
        states.forEach((state) => {
            if (state.controller) state.controller.abort();
            state.listeners.forEach(([node, type, handler]) => {
                node.removeEventListener(type, handler);
            });
            state.timeouts.forEach((id) => clearTimeout(id));
            clearTimeout(state.debounce);
            clearTimeout(state.throttleTimer);
            if (state.interval) clearInterval(state.interval);
            if (state.stream) state.stream.close();
            state.observers.forEach((observer) => observer.disconnect());
        });
        states.clear();
        initialized.clear();
        disabledNodes.forEach((record, node) => {
            node.disabled = record.wasDisabled;
            node.removeAttribute('aria-busy');
        });
        disabledNodes.clear();
    };

    return {
        init,
        reloadComponent,
        reloadComponents,
        config,
        destroy,
        closeStream,
    };
}
