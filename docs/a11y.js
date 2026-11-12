/* Load the open-a11y widget on the marketing and documentation pages. */
(() => {
    if (!window.OpenA11y || window.__minuA11y) return;

    const engine = new window.OpenA11y.AccessibilityEngine({
        storage: window.OpenA11y.localStorageAdapter,
        config: window.OpenA11y.mergeConfig({
            position: 'bottom-right',
            brand: {
                name: 'open-a11y',
                url: 'https://aotr.github.io/open-a11y/',
                primary: '#5a4bff',
                accent: '#b23a25',
            },
        }),
    });

    window.__minuA11y = engine;
    engine.init()
        .then(() => window.OpenA11y.createAccessibilityUI(engine))
        .catch((error) => console.warn('minu: open-a11y failed to start', error));
})();
