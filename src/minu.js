(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.minu = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {

    const sanitize = (html) => {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html);
        }
        return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    };

    const dispatchCustomEvent = (element, eventName, detail = {}) => {
        const event = new CustomEvent(eventName, { detail });
        element.dispatchEvent(event);
    };

    const fetchAndDisplayContent = (url, element) => {
        const loader = element.querySelector('[minu-loader]');
        const contentArea = element.querySelector('[minu-content]');

        if (loader) loader.style.display = 'block';

        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.text();
            })
            .then(html => {
                html = sanitize(html);
                if (contentArea) {
                    contentArea.innerHTML = html;
                } else {
                    element.innerHTML = html;
                }
                dispatchCustomEvent(element, 'minu:contentLoaded', { html });
            })
            .catch(error => {
                console.error('minu: Failed to load content', error);
                dispatchCustomEvent(element, 'minu:contentError', { error });
            })
            .finally(() => {
                if (loader) loader.style.display = 'none';
            });
    };

    let _deprecationWarned = false;

    const init = (selector = '[minu-get]') => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            setupElement(element);
        });
    };

    const setupElement = (element) => {
        const url = element.getAttribute('minu-get');
        const trigger = element.getAttribute('minu-trigger') || 'load';
        if (trigger === 'load') {
            fetchAndDisplayContent(url, element);
        } else {
            element.addEventListener(trigger, () => fetchAndDisplayContent(url, element));
        }
        dispatchCustomEvent(element, 'minu:contentSetup', { url, trigger });
    };

    const reloadComponents = (selectors) => {
        if (!Array.isArray(selectors)) {
            selectors = [selectors];
        }
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                const url = element.getAttribute('minu-get');
                if (url) {
                    fetchAndDisplayContent(url, element);
                }
            });
        });
    };

    const reloadComponent = (selectors) => {
        if (!_deprecationWarned) {
            console.warn('minu: reloadComponent() is deprecated. Use reloadComponents() instead.');
            _deprecationWarned = true;
        }
        return reloadComponents(selectors);
    };

    return { init, reloadComponent, reloadComponents };
}));
