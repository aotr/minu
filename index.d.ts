declare namespace minu {
    interface Config {
        /** Extra headers sent with every request (merged under per-element headers). */
        headers?: Record<string, string>;
        /** Default request timeout in milliseconds. 0 disables the timeout. */
        timeout?: number;
        /** Fetch credentials mode. */
        credentials?: 'omit' | 'same-origin' | 'include';
    }

    interface ContentSetupDetail {
        url: string;
        trigger: string;
    }

    interface BeforeRequestDetail {
        url: string;
        method: string;
        element: Element;
    }

    interface ContentLoadedDetail {
        html: string;
        url: string;
        method: string;
    }

    interface ContentErrorDetail {
        error: Error;
        url: string;
    }

    interface AfterRequestDetail {
        url: string;
        method: string;
        ok: boolean;
    }

    interface SseMessageDetail {
        data: string;
        event: string;
        url: string;
    }

    interface MinuEventMap {
        'minu:contentSetup': CustomEvent<ContentSetupDetail>;
        'minu:beforeRequest': CustomEvent<BeforeRequestDetail>;
        'minu:contentLoaded': CustomEvent<ContentLoadedDetail>;
        'minu:contentError': CustomEvent<ContentErrorDetail>;
        'minu:afterRequest': CustomEvent<AfterRequestDetail>;
        'minu:sseOpen': CustomEvent<{ url: string }>;
        'minu:sseMessage': CustomEvent<SseMessageDetail>;
        'minu:sseError': CustomEvent<{ error: Event; url: string }>;
        [event: `minu:trigger:${string}`]: CustomEvent<{ name: string; url: string }>;
    }

    /**
     * Merge global request defaults. Call before or after `init()`.
     */
    function config(options: Config): void;

    /**
     * Initialize elements matching the given selector.
     * Defaults to `[minu-get],[minu-post],[minu-put],[minu-patch],[minu-delete],[minu-sse]`.
     */
    function init(selector?: string): void;

    /**
     * Re-fetch content for elements matching the given selector(s).
     */
    function reloadComponents(selectors: string | string[]): void;

    /**
     * @deprecated Use `reloadComponents` instead.
     */
    function reloadComponent(selectors: string | string[]): void;

    /**
     * Abort in-flight requests, remove listeners/timers, and close SSE streams.
     */
    function destroy(): void;

    /**
     * Close one SSE stream, or every stream when no element is given.
     */
    function closeStream(element?: Element): void;
}

declare global {
    interface DocumentEventMap extends minu.MinuEventMap {}
    interface HTMLElementEventMap extends minu.MinuEventMap {}
    interface WindowEventMap extends minu.MinuEventMap {}
}

export = minu;
export as namespace minu;
