import DOMPurify from 'dompurify';
import { createMinu } from './core.js';
import { PROTOCOL_ATTRIBUTES } from './response.js';

if (!DOMPurify) {
    throw new Error('minu-secure requires DOMPurify. Install it: npm install dompurify');
}

const sanitize = (html) => DOMPurify.sanitize(html, { ADD_ATTR: PROTOCOL_ATTRIBUTES });

export default createMinu(sanitize);
