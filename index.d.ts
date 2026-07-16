declare namespace minu {
    /**
     * Initialize Minu on elements matching the given selector.
     * Defaults to `[minu-get]` if no selector is provided.
     */
    function init(selector?: string): void;

    /**
     * Reload content for elements matching the given selector(s).
     */
    function reloadComponents(selectors: string | string[]): void;

    /**
     * @deprecated Use `reloadComponents` instead.
     */
    function reloadComponent(selectors: string | string[]): void;
}

export = minu;
