/**
 * Morph swap plugin for Minu.
 *
 * ```js
 * import minu from 'minu';
 * import morph from 'minu/morph';
 *
 * minu.registerSwap('morph', morph);
 * ```
 */
declare function morph(target: Element, html: string): void;

export = morph;
