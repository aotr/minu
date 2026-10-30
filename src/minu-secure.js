import DOMPurify from 'dompurify';
import { createMinu } from './core.js';

if (!DOMPurify) {
    throw new Error('minu-secure requires DOMPurify. Install it: npm install dompurify');
}

export default createMinu((html) => DOMPurify.sanitize(html));
