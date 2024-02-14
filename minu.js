/**
 * The "Markup Injection and Network Utility" (Minu) is a comprehensive JavaScript library 
 * designed to enrich web applications by seamlessly injecting markup into web pages and 
 * managing network interactions. As a lightweight and dependency-free library, Minu stands 
 * out for its ease of use and straightforward integration into both new and existing web projects.
 *
 * Key Features:
 * - **Dynamic Markup Injection**: Minu empowers developers to dynamically update the DOM with 
 *   new content, facilitating real-time user interface enhancements without requiring page reloads.
 *   This capability is essential for single-page applications (SPAs) and any web interface 
 *   requiring dynamic content updates.
 *
 * - **Efficient Network Interactions**: With built-in functionalities for making HTTP requests 
 *   and handling responses, Minu simplifies the process of fetching data from servers, submitting 
 *   form data, and interacting with RESTful APIs. This makes it easier to build interactive,
 *   data-driven web applications.
 *
 * - **Custom Event Dispatching**: Minu provides a streamlined approach to triggering and managing 
 *   custom browser events. This feature allows developers to create more interactive and 
 *   responsive web applications by responding to user actions or changes in data in real time.
 *
 * Usage Scenario:
 * Minu is particularly useful in scenarios where developers need to rapidly prototype web applications,
 * implement AJAX-based content loading, or require a minimalistic library to extend the functionality 
 * of existing projects without the overhead of larger frameworks.
 *
 * By integrating Minu, developers gain a powerful tool that enhances web application interactivity, 
 * improves user experience, and facilitates the development of modern, high-performance web applications.
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.minu = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {

    const sanitizeHTML = (html) => {
        // Simplistic sanitation that should be replaced with a robust method like DOMPurify
        return html;
    };

    const dispatchCustomEvent = (element, eventName, detail = {}) => {
        const event = new CustomEvent(eventName, { detail });
        element.dispatchEvent(event);
    };

    const fetchAndDisplayContent = (url, element) => {
        
        const loader = element.querySelector('[minu-loader]');
        const contentArea = element.querySelector('[minu-content]');
        // Show loader if it exists
        if (loader) loader.style.display = 'block';
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.text();
            })
            .then(html => {
                html = sanitizeHTML(html); // Assuming sanitizeHTML is safely implemented
                 // Update the content area or the whole element if no specific content area defined
                 if (contentArea) {
                    contentArea.innerHTML = html;
                } else {
                    // Fallback to updating the entire element if no content area is defined
                    element.innerHTML = html;
                }
                dispatchCustomEvent(element, 'minu:contentLoaded', { html });
            })
            .catch(error => {
                console.error('minu: Failed to load content', error);
                dispatchCustomEvent(element, 'minu:contentError', { error });
            })
            .finally(() => {
                if (loader) loader.style.display = 'none'; // Hide loader if present
            });
    };
    

    const init = (selector = '[minu-get]') => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            setupElement(element);
        });
    };

    const setupElement = (element) => {
        const url = element.getAttribute('minu-get');
        const trigger = element.getAttribute('minu-trigger') || 'load';
        if (trigger === "load") {
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

    return { init, reloadComponent: reloadComponents, reloadComponents};
}));
