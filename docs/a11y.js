/* Load the open-a11y widget on the marketing and documentation pages. */
(() => {
    if (!window.OpenA11y || window.__minuA11y) return;

    const theme = document.createElement('style');
    theme.textContent = `
        asw-menu {
            --asw-bg: #f3efe5 !important;
            --asw-card-bg: #fbf8f0 !important;
            --asw-text: #16151a !important;
            --asw-text-muted: #67625a !important;
            --asw-border: #d5cebe !important;
        }
        asw-menu, asw-widget {
            font-family: "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
        }
    `;
    document.head.appendChild(theme);

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
