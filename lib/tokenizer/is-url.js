import { isUppercaseLetter } from './char-code-definitions.js';
import { cmpStr, consumeEscaped, decodeEscaped } from './utils.js';

export default function isUrl(source, start, end) {
    if (end - start === 3) {
        return cmpStr(source, start, end, 'url');
    }

    let index = 0;

    for (let i = start; i < end; i++) {
        if (index === 3) {
            return false;
        }

        let code = source.charCodeAt(i);

        if (code === 0x005C) {
            const escapeEnd = consumeEscaped(source, i);
            code = decodeEscaped(source.substring(i + 1, escapeEnd)).charCodeAt(0);
            i = escapeEnd - 1;
        }

        if (isUppercaseLetter(code)) {
            code |= 32;
        }

        if (code !== 'url'.charCodeAt(index++)) {
            return false;
        }
    }

    return index === 3;
}
